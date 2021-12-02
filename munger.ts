import { Proc } from "./proc.js";

export type NamedLocator = { locatorName: string };
export type Locator = string | RegExp | NamedLocator;
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

function nextMatch(input: string, locator: Locator, startFrom: number): Match | undefined {
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
	which: Which;

	constructor(which: Which, ...rules: Rule[]) {
		this.which = which;
		this.rules = rules;
	}

	apply(input: Match, ctx: Context): string {
		let startOfMatch = -1, endOfMatch = 0, output: string[] = [], lastRuleIndex = -1;
		let ruleIndex: number, bestMatch: Match | undefined;
		const locators = this.rules
			.map(r => isNamed(r.locator) ? ctx.registers.get(r.locator.locatorName) : r.locator)
			.filter((r): r is Exclude<Locator, NamedLocator> => r != null);
		let ruleMatches: (Match | undefined)[] = locators.map(() => ({ value: "", index: -1, groups: [] }));

		for (let matchCount = 0; endOfMatch <= input.value.length; ++matchCount) {
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

		if (this.rule.locator instanceof RegExp) {
			for (let m of input.matchAll(this.rule.locator)) {
				lastMatchPosition = m.index;
				lastMatch = { value: m[0], groups: m.slice(1), index: 0 };
			}
		} 
		else {
			const target = isNamed(this.rule.locator) 
				? ctx.registers.get(this.rule.locator.locatorName) 
				: this.rule.locator;
			if (target == null) return input;
			lastMatchPosition = input.lastIndexOf(target);
			if (lastMatchPosition >= 0) lastMatch = { value: target, groups: [], index: 0 };
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
