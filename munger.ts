type Transform = Ruleset | string

enum Which { FirstOnly, AllSimultaneously }
enum When { Once, UntilStable }

type ReplacementAST = never;

type Locator = string | RegExp;
type Replacement = string | Ruleset | ReplacementAST;

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

function apply(input: string, replacement: Replacement, output: string[]): void {
    if (typeof replacement === 'string') output.push(replacement);
    if (replacement instanceof Ruleset) replacement.apply(input, output);
}

class Ruleset {
    rules: { location: Locator, replace: Replacement }[] = [];
    which: Which;
    when: When;

    constructor(which: Which, when: When) {
        this.which = which;
        this.when = when;
    }

    private applyOnce(input: string, output: string[]): void {
        let searchIndex = 0;
        for (let i = 0; searchIndex < input.length; ++i) {
            let matches = this.rules
                .map((r, index) => ({ index, match: nextMatch(input, searchIndex, r.location) }))
                .filter(m => m.match?.value);
            if (matches.length === 0) break;
            
            let { index, match } = matches.reduce((a, b) => a.match!.index < b.match!.index ? a : b);
            if (!match) break;
            
            let { replace } = this.rules[index];

            output.push(input.substring(0, match.index));
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

