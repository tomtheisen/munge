import { Proc } from "./proc.js";

export type NamedLocator = { locatorName: string };
export type Locator = string | RegExp | NamedLocator;
export type Rule = { locator: Locator, replace: Munger };
export type Munger = string | Ruleset | Proc | Repeater | Sequence | SideEffects;

export type Context = {
	registers: Map<string, string>;
	arrays: Map<string, string[]>;
	mungers: ReadonlyMap<string, Munger>;
};

export type Match = {
	value: string;
	groups: string[];
};

export type LocatedMatch = Match & { index: number; };

const emptyMap = new Map;
export function munge(input: string, munger: Munger, mungers: ReadonlyMap<string, Munger> = emptyMap) {
	const lineNormalized = input.replace(/\r\n?/g, "\n");
	const newContext = { registers: new Map, arrays: new Map, mungers };
	return mungeCore({ value: lineNormalized, groups: [] }, munger, newContext);
}

function mungeCore(input: Match, munger: Munger, ctx: Context): string {
	if (typeof munger === 'string') return munger;
	else if (munger instanceof Proc) return munger.evaluate(input, ctx);
	else return munger.apply(input, ctx);
}

function nextMatch(input: string, locator: Locator, startFrom: number): LocatedMatch | undefined {
	if (typeof locator === 'string') {
		const index = startFrom > input.length ? -1 : input.indexOf(locator, startFrom);
		if (index >= 0) return { index, value: locator, groups: [] };
	}
	else if (locator instanceof RegExp) {
		if (!locator.global) throw "gotta be global";
		locator.lastIndex = startFrom;
		const match = locator.exec(input);
		if (match) return { index: match.index, value: match[0], groups: match.slice(1) };
	}
	else throw `Unimplemented locator type ${ locator }`;
}

function isNamed(locator: Locator): locator is NamedLocator {
	return typeof locator === "object" && "locatorName" in locator;
}

export class Ruleset {
	rules: Rule[];
	howMany: number;

	constructor(howMany: number, ...rules: Rule[]) {
		this.howMany = howMany;
		this.rules = rules;
	}

	apply(input: Match, ctx: Context): string {
		let startOfMatch = -1, endOfMatch = 0, output: string[] = [], lastRuleIndex = -1;
		let ruleIndex: number, bestMatch: LocatedMatch | undefined;
		const locators = this.rules
			.map(r => isNamed(r.locator) ? ctx.registers.get(r.locator.locatorName) : r.locator)
			.filter((r): r is Exclude<Locator, NamedLocator> => r != null);
		let ruleMatches: (LocatedMatch | undefined)[] = locators.map(() => ({ value: "", index: -1, groups: [] }));

		for (let matchCount = 0; endOfMatch <= input.value.length; ) {
			bestMatch = undefined; 
			ruleIndex = -1;
			for (let i = 0; i < locators.length; i++) {
				let ruleMatch = ruleMatches[i];
				if (ruleMatch == null) continue;
				const searchStart = i <= lastRuleIndex 
					? Math.max(startOfMatch + 1, endOfMatch) 
					: endOfMatch;
				ruleMatches[i] = ruleMatch = nextMatch(input.value, locators[i], searchStart);
				if (ruleMatch == null) continue;
				if (bestMatch == null || ruleMatch.index < bestMatch.index) {
					bestMatch = ruleMatch;
					ruleIndex = i;
				}
			}

			if (bestMatch == null) break;

			output.push(
				input.value.substring(endOfMatch, bestMatch.index),
				mungeCore(bestMatch, this.rules[ruleIndex].replace, ctx));

			lastRuleIndex = ruleIndex;
			startOfMatch = bestMatch.index;
			endOfMatch = bestMatch.index + bestMatch.value.length;

			if (++matchCount === this.howMany) break;
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
		let last = input.value, output = mungeCore(input, this.munger, ctx);
		while (last !== output) {
			last = output;
			output = mungeCore({ value: output, groups: [] }, this.munger, ctx);
		}
		return output;
	}
}

export class Sequence {
	steps: Munger[];
	howMany: number;

	constructor(howMany: number, ...steps: Munger[]) {
		this.howMany = howMany;
		this.steps = steps;
	}

	apply(match: Match, ctx: Context): string {
		let input = match.value, changes = 0;
		for (let munger of this.steps) {
			let next = mungeCore({ value: input, groups: [] }, munger, ctx);
			if (next !== input && ++changes === this.howMany) return next;
			input = next;
		}
		return input;
	}

	repeat() {
		return new Repeater(this);
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
