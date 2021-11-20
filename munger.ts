export type Transform = Ruleset | string

export enum Which { FirstOnly, AllSimultaneously }
export enum When { Once, UntilStable }

type ReplacementAST = never;

type Locator = string | RegExp;
export type Replacement = string | Ruleset | ReplacementAST;

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

export function munge(input: string, replacement: Replacement): string {
    let output: string[] = [];
    apply(input, replacement, output);
    return output.join('');
}

function apply(input: string, replacement: Replacement, output: string[]): void {
    if (typeof replacement === 'string') output.push(replacement);
    if (replacement instanceof Ruleset) replacement.apply(input, output);
}

type Rule = { find: Locator, replace: Replacement };
export class Ruleset {
    rules: Rule[];
    which: Which;
    when: When;

    constructor(which: Which, when: When, ...rules: Rule[]) {
        this.which = which;
        this.when = when;
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

    private stabilize(input: string): string {
        for (let output: string[]; ; input = output.join('')) {
            this.applyOnce(input, output = []);
            if (output.length == 1) return output[0];
        }
    }

    apply(input: string, output: string[]): void {
        switch (this.when) {
            case When.Once:
                this.applyOnce(input, output);
                break;
            case When.UntilStable:
                output.push(this.stabilize(input));
                break;
        }
    }
}

