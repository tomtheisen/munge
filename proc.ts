import { Match, Context } from "./munger";

export class Proc {
	private instructions: (string | Proc)[];
	constructor(instructions: string | (string | Proc)[]) {
		if (typeof instructions === "string") {
			this.instructions = Array
				.from(instructions.matchAll(/".*?"|\S+/sg))
				.map(m => m[0]);
		}
		else {
			this.instructions = instructions;
		}
	}

	evaluate(input: Match, ctx: Context, stack: string[] = []): string {
		function push(...es: (string | number)[]) {
			for (let e of es) {
				stack.unshift(typeof e === 'string' ? e : e.toString());
			}
		}
		function pop(depth: number = 0) {
			if (depth === 0)
				return stack.shift() ?? "";
			return stack.splice(depth, 1)[0] ?? "";
		}
		function getBlock() {
			const block = instructions.shift();
			if (!(block instanceof Proc))
				throw "Expected proc block, got " + block;
			return block;
		}
		function tryGetBlock() {
			const block = instructions[0];
			if (block instanceof Proc) {
				instructions.shift();
				return block;
			}
		}
		function peek(depth?: number) {
			return stack[depth ?? 0] ?? "";
		}
		function truthy(s: string) {
			return !["", "0"].includes(s);
		}

		const instructions = this.instructions.slice();
		let instr, match: RegExpExecArray | null;
		while (instr = instructions.shift()) {
			if (instr instanceof Proc)
				throw Error(`Bare proc blocks don't do anything (yet?)`);

			if (/^-?\d+$/.test(instr))
				push(instr);
			else if (instr.startsWith('"'))
				push(JSON.parse(instr));
			else if (match = /^(set|get|push|pop|cons|uncons|join|rev|for|do|getat|setat|inc|dec|empty)\((\w+)\)$/.exec(instr)) {
				instructions.unshift(JSON.stringify(match[2]), match[1]);
			}
			else if (match = /^\$(\d+)$/.exec(instr)) {
				instructions.unshift(JSON.stringify(match[1]), "group");
			}
			else
				switch (instr) {
					case '_': push(input.value); break;
					case 'len': push(pop().length); break;
					case 'swap': push(pop(), pop()); break;
					case 'copy': push(peek()); break;
					case 'drop': pop(); break;
					case 'clear': stack.splice(0); break;
					case 'dump': console.log(JSON.parse(JSON.stringify({ 
						instructions, 
						stack, 
						arrays: [...ctx.arrays.entries()],
						registers: [...ctx.registers.entries()],
						mungers: [...ctx.mungers.entries()],
					}))); break;
					case 'i': push(input.index); break;

					case 'group': push(input.groups?.[Number(pop()) - 1] ?? ""); break;

					case 'max': 
						if (stack.length >= 2) {
							push(Math.max(...[pop(), pop()].filter(x => x).map(Number)));    
						} 
						break;
					case 'min': 
						if (stack.length >= 2) {
							push(Math.min(...[pop(), pop()].filter(x => x).map(Number)));    
						}
						break;
					case '>': push(pop(1) > pop() ? 1 : 0); break;
					case '<': push(pop(1) < pop() ? 1 : 0); break;
					case '>>': push(Number(pop(1)) > Number(pop()) ? 1 : 0); break;
					case '<<': push(Number(pop(1)) < Number(pop()) ? 1 : 0); break;
					case '=': push(pop() == pop() ? 1 : 0); break;
					case '+': push(Number(pop()) + Number(pop())); break;
					case '-': push(Number(pop(1)) - Number(pop())); break;
					case '%': push(Number(pop(1)) % Number(pop())); break;
					case '*': push(Number(pop()) * Number(pop())); break;
					case '/': push(Number(pop(1)) / Number(pop())); break;
					case 'rep': push(Array(Number(pop())).fill(pop()).join('')); break;

					case 'not': push(Number(pop()) ? 0 : 1); break;
					case 'or': {
						const a = pop(1), b = pop();
						push(truthy(a) ? a : b);
						break;
					}

					case 'cat': push(pop(1) + pop()); break;
					case 'rpad': push(pop(1).padEnd(Number(pop()))); break;
					case 'lpad': push(pop(1).padStart(Number(pop()))); break;
					case 'index': push(pop(1).indexOf(pop())); break;
					case 'lower': push(pop().toLowerCase()); break;
					case 'upper': push(pop().toUpperCase()); break;
					case 'skip': push(pop(1).substring(Number(pop()))); break;
					case 'take': push(pop(1).substring(0, Number(pop()))); break;
					case 'ord': push(pop().codePointAt(0) ?? 0); break;
					case 'chr': push(String.fromCodePoint(Number(pop()))); break;

					case 'set': ctx.registers.set(pop(), peek()); break;
					case 'get': push(ctx.registers.get(pop()) ?? ""); break;
					case 'inc': {
						const name = pop();
						ctx.registers.set(name, (Number(ctx.registers.get(name) ?? 0) + 1).toString());
						break;
					}
					case 'dec': {
						const name = pop();
						ctx.registers.set(name, (Number(ctx.registers.get(name) ?? 0) - 1).toString());
						break;
					}

					case 'push': {
						const name = pop();
						if (!ctx.arrays.has(name))
							ctx.arrays.set(name, []);
						ctx.arrays.get(name)!.push(pop());
						break;
					}
					case 'pop': push(ctx.arrays.get(pop())?.pop() ?? ""); break;
					case 'cons': {
						const name = pop();
						if (!ctx.arrays.has(name))
							ctx.arrays.set(name, []);
						ctx.arrays.get(name)!.unshift(pop());
						break;
					}
					case 'uncons': push(ctx.arrays.get(pop())?.shift() ?? ""); break;
					case 'join': push(ctx.arrays.get(pop())?.join(pop()) ?? ""); break;
					case 'rev': ctx.arrays.get(pop())?.reverse(); break;
					case 'empty': ctx.arrays.set(pop(), []); break;

					case 'if': {
						const condition = pop(), then = getBlock(), else_ = tryGetBlock();
						if (truthy(condition)) then.evaluate(input, ctx, stack);
						else if (else_) else_.evaluate(input, ctx, stack);
						break;
					}
					case 'for': {
						const arr = ctx.arrays.get(pop()) ?? [], block = getBlock();
						let i = 0;
						for (const e of arr) {
							block.evaluate({ value: e, index: i++, groups: [] }, ctx, stack);
						}
						break;
					}
					case 'times': {
						const times = Number(pop()), block = getBlock();
						for (let i = 0; i < times; i++) {
							block.evaluate({ value: input.value, index: i, groups: input.groups }, ctx, stack);
						}
						break;
					}

					case 'do': {
						const name = pop(), target = ctx.mungers.get(name);
						if (!(target instanceof Proc))
							throw Error(`Can't call non-proc name '${name}: ${target}'`);
						target.evaluate(input, ctx, stack);
						break;
					}

					default: throw "unrecognized instruction " + instr;
				}
		}
		return stack.slice().reverse().join('');
	}
}
