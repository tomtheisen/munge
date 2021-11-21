type Locator = string | RegExp;
export type Replacement = string | Ruleset | ReplacementAST;
export type Munger = Repeater | Sequence | Replacement

export enum Which { FirstOnly, All }

type Context = {
    value: string;
};
class ReplacementAST {
    private instructions: string[];
    constructor(instructions: string) {
        this.instructions = Array
            .from(instructions.matchAll(/".*?"|\d+|./g))
            .map(m => m[0]);
    }

    evaluate(ctx: Context): string {
        let stack: string[] = [ctx.value];
        for (let instr of this.instructions) {
            if (/^\d+$/.test(instr)) stack.push(instr);
            else if (instr.startsWith('"')) stack.push(instr.substring(1, instr.length - 1));
            else switch (instr) {
                case '_': stack.push(ctx.value); break;
                case 'L': stack.push(stack.pop()!.length.toString()); break;
                case '+': {
                    const b = stack.pop()!, a = stack.pop()!;
                    stack.push(a + b);
                    break;
                }
                case '(': {
                    
                }
            }
        }
        return stack.pop() ?? "";
    }
};

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
    else if (munger instanceof ReplacementAST) return munger.evaluate({ value: input });
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
export const noop = new Ruleset(Which.All);
Object.freeze(noop);
Object.freeze(noop.rules);

export function replaceOne(find: Locator, replace: Replacement) {
    return new Ruleset(Which.All, { find, replace });
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