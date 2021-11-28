import { Proc } from "./proc.js";

export type Locator = string | RegExp;
export type Rule = { locator: Locator, replace: Munger };
export type Munger = string | Ruleset | Proc | Repeater | Sequence | Last | SideEffects;
export enum Which { FirstOnly, All }

export type Context = {
    registers: Map<string, string>;
    arrays: Map<string, string[]>;
    mungers: ReadonlyMap<string, Munger>;
};

export type Match = {
    index: number;
    value: string;
    groups: string[];
};

const emptyMap = new Map;
export function munge(input: string, munger: Munger, mungers: ReadonlyMap<string, Munger> = emptyMap) {
    const lineNormalized = input.replace(/\r\n?/g, "\n");
    const newContext = { registers: new Map, arrays: new Map, mungers };
    return mungeCore({ value: lineNormalized, groups: [], index: 0 }, munger, newContext);
}

function mungeCore(input: Match, munger: Munger, ctx: Context): string {
    if (typeof munger === 'string') return munger;
    else if (munger instanceof Proc) return munger.evaluate(input, ctx);
    else return munger.apply(input, ctx);
}

export class Ruleset {
    rules: Rule[];
    which: Which;

    constructor(which: Which, ...rules: Rule[]) {
        this.which = which;
        this.rules = rules;
    }

    apply(input: Match, ctx: Context): string {
        let startOfMatch = -1, endOfMatch = 0, ruleIndex = -1, output: string[] = [];
        for (let matchCount = 0; endOfMatch <= input.value.length; ++matchCount) {
            // TODO: remember the next location for each locator, to avoid duplicate searches
            let matches = this.rules.map((rule, ruleIndex) => {
                let startIndex = endOfMatch;
                if (startOfMatch === startIndex && ruleIndex <= ruleIndex) ++startIndex;

                let nextMatch: Match | undefined = undefined;
                if (typeof rule.locator === 'string') {
                    const index = startIndex > input.value.length ? -1 : input.value.indexOf(rule.locator, startIndex);
                    if (index >= 0) nextMatch = { index, value: rule.locator, groups: [] };
                }
                if (rule.locator instanceof RegExp) {
                    if (!rule.locator.global) throw "gotta be global";
                    rule.locator.lastIndex = startIndex;
                    const match = rule.locator.exec(input.value);
                    if (match) nextMatch = { index: match.index, value: match[0], groups: match.slice(1) };
                }
                return { index: ruleIndex, match: nextMatch };
            }).filter(m => m.match);
            if (matches.length === 0) break;
            
            let { index, match } = matches.reduce((a, b) => a.match!.index <= b.match!.index ? a : b);
            if (!match) break;
            
            ruleIndex = index;
            let { replace } = this.rules[ruleIndex];

            output.push(
                input.value.substring(endOfMatch, match.index),
                mungeCore(match, replace, ctx));
            startOfMatch = match.index;
            endOfMatch = match.index + match.value.length;

            if (this.which === Which.FirstOnly) break;
        }
        return output.join('') + input.value.substring(endOfMatch);
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

    apply(input: Match, ctx: Context): string {
        let last = input.value, output = mungeCore(input, this.munger, ctx), i = 0;
        while (last !== output) {
            last = output;
            output = mungeCore({ value: output, groups: [], index: i++ }, this.munger, ctx);
        }
        return output;
    }
}

export class Sequence {
    steps: Munger[];
    which: Which;

    constructor(which: Which, ...steps: Munger[]) {
        this.which = which;
        this.steps = steps;
    }

    apply(match: Match, ctx: Context): string {
        let input = match.value, i = 0;
        for (let munger of this.steps) {
            let next = mungeCore({ value: input, groups: [], index: i++ }, munger, ctx);
            if (this.which === Which.FirstOnly && next !== input) return next;
            input = next;
        }
        return input;
    }

    repeat() {
        return new Repeater(this);
    }
}

export class Last {
    rule: Rule;
    constructor(rule: Rule) {
        this.rule = rule;
    }

    apply(match: Match, ctx: Context): string {
        const input = match.value;
        let lastMatch: Match | undefined = undefined;
        let lastMatchPosition : number | undefined = undefined;

        if (typeof this.rule.locator === "string") {
            lastMatchPosition = input.lastIndexOf(this.rule.locator);
            if (lastMatchPosition >= 0) lastMatch = { value: this.rule.locator, groups: [], index: 0 };
        }
        else for (let m of input.matchAll(this.rule.locator)) {
            lastMatchPosition = m.index;
            lastMatch = { value: m[0], groups: m.slice(1), index: 0 };
        }

        if (!lastMatch || lastMatchPosition == null) return input;
        return input.substring(0, lastMatchPosition) 
            + mungeCore(lastMatch, this.rule.replace, ctx)
            + input.substring(lastMatchPosition + lastMatch.value.length);
    }
}

export class SideEffects {
    munger: Munger;

    constructor(munger: Munger) {
        this.munger = munger;
    }

    apply(match: Match, ctx: Context): string {
        mungeCore(match, this.munger, ctx);
        return match.value;
    }
}
