type Locator = string | RegExp;
export type Replacement = string | Ruleset | Proc;
export type Munger = Repeater | Sequence | Replacement

export enum Which { FirstOnly, All }

type Context = {
    registers: Map<string, string>;
    arrays: Map<string, string[]>;
    procs: ReadonlyMap<string, Proc>;
};
function makeContext(): Context {
    return { registers: new Map, arrays: new Map, procs: new Map };
}

export class Proc {
    private instructions: string[];
    constructor(instructions: string) {
        this.instructions = Array
            .from(instructions.matchAll(/".*?"|\S+/sg))
            .map(m => m[0]);
    }

    evaluate(input: string, ctx: Context): string {
        let stack: string[] = [input];
        function push(...es: (string | number)[]) {
            for (let e of es) {
                stack.unshift(typeof e === 'string' ? e : e.toString());   
            }
        }
        function pop(depth: number = 0) {
            if (depth === 0) return stack.shift() ?? "";
            return stack.splice(depth, 1)[0] ?? "";
        }
        function peek(depth?: number) {
            return stack[depth ?? 0] ?? "";
        }

        for (let instr of this.instructions) {
            if (/^-?\d+$/.test(instr)) push(instr);
            else if (instr.startsWith('"')) {
                push(instr.substring(1, instr.length - 1));
            }
            else switch (instr) {
                case '_': push(input); break;
                case 'len': push(pop().length); break;
                case 'swap': push(pop(), pop()); break;
                case 'copy': push(peek(), peek()); break;
                case 'drop': pop(); break;
                case 'cat': push(pop(1) + pop()); break;
                case 'rpad': push(pop(1).padEnd(Number(pop()))); break;
                case 'lpad': push(pop(1).padStart(Number(pop()))); break;
                case 'max': stack.length >= 2 && push(Math.max(Number(pop()), Number(pop()))); break;
                case 'min': stack.length >= 2 && push(Math.min(Number(pop()), Number(pop()))); break;
                case '>': push(pop(1) > pop() ? 1 : 0); break;
                case '<': push(pop(1) < pop() ? 1 : 0); break;
                case '=': push(pop() == pop() ? 1 : 0); break;
                case '+': push(Number(pop()) + Number(pop())); break;
                case '-': push(Number(pop(1)) - Number(pop())); break;
                case 'rep': push(Array(Number(pop())).fill(pop()).join('')); break;

                case 'not': push(Number(pop()) ? 0 : 1); break;
                case 'if': push(Number(pop()) ? (pop(), pop()) : (pop(1), pop())); break;
                case 'when': Number(pop()) || (pop(), push("")); break;

                case 'setvar': ctx.registers.set(pop(), peek()); break;
                case 'getvar': push(ctx.registers.get(pop()) ?? ""); break;

                case 'push': ctx.arrays.get(pop())?.push(pop());
                
                default: throw "unrecognized instruction " + instr;
            }
        }
        return stack.reverse().join('');
    }
};

type Match = {
    index: number;
    value: string;
    groups: string[];
};

function nextMatch(input: string, start: number, locator: Locator): Match | undefined {
    if (typeof locator === 'string') {
        const index = start > input.length ? -1 : input.indexOf(locator, start);
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

export function munge(input: string, munger: Munger) {
    return mungeCore(input, munger, makeContext());
}

function mungeCore(input: string, munger: Munger, ctx: Context): string {
    if (typeof munger === 'string') return munger;
    else if (munger instanceof Proc) return munger.evaluate(input, ctx);
    else return munger.apply(input, ctx);
}

type Rule = { find: Locator, replace: Replacement };
export class Ruleset {
    rules: Rule[];
    which: Which;

    constructor(which: Which, ...rules: Rule[]) {
        this.which = which;
        this.rules = rules;
    }

    apply(input: string, ctx: Context): string {
        let startOfMatch = -1, endOfMatch = 0, patternIndex = -1, output: string[] = [];
        for (let matchCount = 0; endOfMatch <= input.length; ++matchCount) {
            let matches = this.rules
                .map((r, index) => {
                    let startIndex = endOfMatch;
                    if (startOfMatch === startIndex && index <= patternIndex) ++startIndex;
                    return { index, match: nextMatch(input, startIndex, r.find) };
                })
                .filter(m => m.match != null);
            if (matches.length === 0) break;
            
            let { index, match } = matches.reduce((a, b) => a.match!.index <= b.match!.index ? a : b);
            if (!match) break;
            
            patternIndex = index;
            let { replace } = this.rules[patternIndex];

            output.push(
                input.substring(endOfMatch, match.index),
                mungeCore(match.value, replace, ctx));
            startOfMatch = match.index;
            endOfMatch = match.index + match.value.length;

            if (this.which === Which.FirstOnly) break;
        }
        return output.join('') + input.substring(endOfMatch);
    }

    repeat() {
        return new Repeater(this);
    }
}
export const noop = new Ruleset(Which.All);
Object.freeze(noop);
Object.freeze(noop.rules);

export function singleRule(find: Locator, replace: Replacement) {
    return new Ruleset(Which.All, { find, replace });
}

export class Repeater {
    private munger: Munger;

    constructor(munger: Munger) {
        this.munger = munger;
    }

    apply(input: string, ctx: Context): string {
        while (true) {
            const output = mungeCore(input, this.munger, ctx);
            if (output === input) break;
            input = output;
        }
        return input;
    }
}

export class Sequence {
    steps: Munger[];

    constructor(...steps: Munger[]) {
        this.steps = steps;
    }

    apply(input: string, ctx: Context): string {
        for (let munger of this.steps) input = mungeCore(input, munger, ctx);
        return input;
    }
}