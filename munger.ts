type Locator = string | RegExp;
export type Replacement = string | Ruleset | ReplacementAST;
export type Munger = Repeater | Ruleset | string

export enum Which { FirstOnly, AllSimultaneously }

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
    apply(input, munger, output);
    return output.join('');
}

function apply(input: string, munger: Munger, output: string[]): void {
    if (typeof munger === 'string') output.push(munger);
    else munger.apply(input, output);
}

type Rule = { find: Locator, replace: Replacement };
export class Ruleset {
    rules: Rule[];
    which: Which;

    constructor(which: Which, ...rules: Rule[]) {
        this.which = which;
        this.rules = rules;
    }

    private applyOnce(input: string, output: string[]): void {
        let searchIndex = 0;
        for (let i = 0; searchIndex < input.length; ++i) {
            let matches = this.rules
                .map((r, index) => ({ index, match: nextMatch(input, searchIndex, r.find) }))
                .filter(m => m.match?.value);
            if (matches.length === 0) break;
            
            let { index, match } = matches.reduce((a, b) => a.match!.index < b.match!.index ? a : b);
            if (!match) break;
            
            let { replace } = this.rules[index];

            output.push(input.substring(searchIndex, match.index));
            apply(match.value, replace, output);
            searchIndex = match.index + match.value.length;

            if (this.which === Which.FirstOnly) break;
        }
        output.push(input.substring(searchIndex));
    }

    apply(input: string, output: string[]): void {
        this.applyOnce(input, output);
    }
}

class Repeater {
    private munger: Munger;

    constructor(munger: Munger) {
        this.munger = munger;
    }

    apply(input: string, output: string[]) {
        let myOutput: string[];
        do {
            myOutput = [];
            apply(input, this.munger, myOutput);
            input = myOutput.join('');
        } while (myOutput.length > 1);
        output.push(...myOutput);
    }
}
