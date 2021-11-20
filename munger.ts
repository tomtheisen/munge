type Locator = string | RegExp;
export type Replacement = string | Ruleset | ReplacementAST;
export type Munger = Repeater | Sequence | Ruleset | string

export enum Which { FirstOnly, All }

type ReplacementAST = never;

type Match = {
    index: number;
    value: string;
    groups: string[];
};

function nextMatch(input: string, start: number, locator: Locator): Match | undefined {
    if (typeof locator === 'string') {
        const index = input.indexOf(locator, start);
        if (index >= 0) return {
            index,
            value: locator,
            groups: []
        };
    }
    if (locator instanceof RegExp) {
        if (!locator.global) throw "gotta be global";
        locator.lastIndex = start;
        const match = locator.exec(input);
        if (match) {
            return {
                index: match.index,
                value: match[0],
                groups: match.slice(1),
            };
        }
    }
}

export function munge(input: string, munger: Munger): string {
    let output: string[] = [];
    return apply(input, munger);
}

function apply(input: string, munger: Munger): string {
    if (typeof munger === 'string') return munger;
    else return munger.apply(input);
}

type Rule = { find: Locator, replace: Replacement };
export class Ruleset {
    rules: Rule[];
    which: Which;

    constructor(which: Which, ...rules: Rule[]) {
        this.which = which;
        this.rules = rules;
    }

    apply(input: string): string {
        let searchIndex = 0, output: string[] = [];
        for (let i = 0; searchIndex <= input.length; ++i) {
            let matches = this.rules
                .map((r, index) => ({ index, match: nextMatch(input, searchIndex, r.find) }))
                .filter(m => m.match != null);
            if (matches.length === 0) break;
            
            let { index, match } = matches.reduce((a, b) => a.match!.index <= b.match!.index ? a : b);
            if (!match) break;
            
            let { replace } = this.rules[index];

            output.push(
                input.substring(searchIndex, match.index),
                apply(match.value, replace));
            searchIndex = match.index + (match.value.length || 1);

            if (this.which === Which.FirstOnly) break;
        }
        return output.join('') + input.substring(searchIndex);
    }

    repeat() {
        return new Repeater(this);
    }
}

export class Repeater {
    private munger: Munger;

    constructor(munger: Munger) {
        this.munger = munger;
    }

    apply(input: string): string {
        do {
            let output = apply(input, this.munger);
            if (output === input) break;
            input = output;
        } while (true);
        return input;
    }
}

export class Sequence {
    steps: Munger[];

    constructor(...steps: Munger[]) {
        this.steps = steps;
    }

    apply(input: string): string {
        for (let munger of this.steps) {
            input = apply(input, munger);
        }
        return input;
    }
}