type Locator = string | RegExp;
type Rule = { find: Locator, replace: Munger };
export type Munger = string | Ruleset | Proc| Repeater | Sequence;
export enum Which { FirstOnly, All }

type Context = {
    registers: Map<string, string>;
    arrays: Map<string, string[]>;
    procs: ReadonlyMap<string, Proc>;
};

export class Proc {
    private instructions: string[];
    constructor(instructions: string) {
        this.instructions = Array
            .from(instructions.matchAll(/".*?"|\S+/sg))
            .map(m => m[0]);
    }

    evaluate(input: Match, ctx: Context): string {
        let stack: string[] = [];
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

        const instructions = this.instructions.slice();
        let instr, match: RegExpExecArray | null;
        while (instr = instructions.shift()) {
            if (/^-?\d+$/.test(instr)) push(instr);
            else if (instr.startsWith('"')) push(instr.substring(1, instr.length - 1));
            else if (match = /^(set|get)\((\w+)\)$/.exec(instr)) {
                instructions.unshift(JSON.stringify(match[2]), match[1]);
            }
            else if (match = /^\$(\d+)$/.exec(instr)) {
                instructions.unshift(JSON.stringify(match[1]), "group");
            }
            else switch (instr) {
                case '_': push(input.value); break;
                case 'nl': push("\n"); break;
                case 'len': push(pop().length); break;
                case 'swap': push(pop(), pop()); break;
                case 'copy': push(peek()); break;
                case 'drop': pop(); break;
                case 'clear': stack.splice(0); break;
                case 'dump': console.log({ instructions, stack }); break;

                case 'group': push(input.groups?.[Number(pop()) - 1] ?? ""); break;

                case 'max': stack.length >= 2 && push(Math.max(Number(pop()), Number(pop()))); break;
                case 'min': stack.length >= 2 && push(Math.min(Number(pop()), Number(pop()))); break;
                case '>': push(pop(1) > pop() ? 1 : 0); break;
                case '<': push(pop(1) < pop() ? 1 : 0); break;
                case '=': push(pop() == pop() ? 1 : 0); break;
                case '+': push(Number(pop()) + Number(pop())); break;
                case '-': push(Number(pop(1)) - Number(pop())); break;
                case '%': push(Number(pop(1)) % Number(pop())); break;
                case '*': push(Number(pop()) * Number(pop())); break;
                case '/': push(Number(pop(1)) / Number(pop())); break;
                case 'rep': push(Array(Number(pop())).fill(pop()).join('')); break;

                case 'not': push(Number(pop()) ? 0 : 1); break;
                case 'if': push(Number(pop()) ? (pop(), pop()) : (pop(1), pop())); break;
                case 'when': Number(pop()) || (pop(), push("")); break;

                case 'cat': push(pop(1) + pop()); break;
                case 'rpad': push(pop(1).padEnd(Number(pop()))); break;
                case 'lpad': push(pop(1).padStart(Number(pop()))); break;
                case 'index': push(pop(1).indexOf(pop())); break;
                case 'lower': push(pop().toLowerCase()); break;
                case 'upper': push(pop().toUpperCase()); break;

                case 'set': ctx.registers.set(pop(), peek()); break;
                case 'get': push(ctx.registers.get(pop()) ?? ""); break;

                case 'push': ctx.arrays.get(pop())?.push(pop()); break;
                
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
        if (match) return { index: match.index, value: match[0], groups: match.slice(1) };
    }
}

export function munge(input: string, munger: Munger) {
    const newContext = { registers: new Map, arrays: new Map, procs: new Map };
    return mungeCore({ value: input, groups: [], index: 0 }, munger, newContext);
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
            let matches = this.rules.map((r, index) => {
                    let startIndex = endOfMatch;
                    if (startOfMatch === startIndex && index <= ruleIndex) ++startIndex;
                    return { index, match: nextMatch(input.value, startIndex, r.find) };
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
export const noop = new Ruleset(Which.All);
Object.freeze(noop);
Object.freeze(noop.rules);

export function singleRule(find: Locator, replace: Munger) {
    return new Ruleset(Which.All, { find, replace });
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
