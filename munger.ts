import { Proc } from "./proc.js";

export type NamedLocator = { locatorName: string };
export enum LocatorComposition { Sequence, Alternative, Optional, OneOrMore, ZeroOrMore }
export type ComposedLocator = { type: LocatorComposition, children: Locator[] }
export type Locator = string | RegExp | NamedLocator | ComposedLocator;
export type Rule = { locator: Locator, replace: Munger };
export type Munger = string | Ruleset | Proc | Repeater | Sequence | Last | SideEffects;

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
export function munge(input: string, munger: Munger, 
	locators: ReadonlyMap<string, Locator> = emptyMap, 
	mungers: ReadonlyMap<string, Munger> = emptyMap) 
{
	const lineNormalized = input.replace(/\r\n?/g, "\n");
	const newContext = { registers: new Map, arrays: new Map, locators, mungers };
	return mungeCore({ value: lineNormalized, groups: [] }, munger, newContext);
}

function mungeCore(input: Match, munger: Munger, ctx: Context): string {
	if (typeof munger === 'string') return munger;
	else if (munger instanceof Proc) return munger.evaluate(input, ctx);
	else return munger.apply(input, ctx);
}

function nextMatch(input: string, locator: Locator, startFrom: number, sticky: boolean): LocatedMatch | undefined {
	if (typeof locator === 'string') {
		if (!sticky) {
			const index = startFrom > input.length ? -1 : input.indexOf(locator, startFrom);
			if (index >= 0) return { index, value: locator, groups: [] };
		}
		else if (input.substr(startFrom, locator.length) === locator) {
				return { index: startFrom, value: locator, groups: [] };
		}
	}
	else if (locator instanceof RegExp) {
		if (!locator.global) throw "gotta be global";
		const regexp = sticky ? new RegExp(locator, "gy") : locator;
		regexp.lastIndex = startFrom;
		const match = regexp.exec(input);
		if (match) return { index: match.index, value: match[0], groups: match.slice(1) };
	}
	else if (isComposed(locator)) {
		switch (locator.type) {
			case LocatorComposition.Optional: {
				let result = nextMatch(input, locator.children[0], startFrom, true);
				if (result) return result;
				return { index: startFrom, value: "", groups: [] };
			}
			case LocatorComposition.ZeroOrMore: {
				let result = [], nextStartFrom = startFrom;
				while (true) {
					let match = nextMatch(input, locator.children[0], nextStartFrom, true);
					if (!match) break;
					result.push(match.value);
					nextStartFrom += match.value.length;
				}
				return { index: startFrom, value: result.join(""), groups: [] };
			}
			case LocatorComposition.OneOrMore: {
				const firstMatch = nextMatch(input, locator.children[0], startFrom, sticky);
				if (firstMatch == null) return undefined;
				let result = [firstMatch.value];
				let nextStartFrom = firstMatch.index + firstMatch.value.length;
				while (true) {
					let match = nextMatch(input, locator.children[0], nextStartFrom, true);
					if (!match) break;
					result.push(match.value);
					nextStartFrom += match.value.length;
				}
				return { index: startFrom, value: result.join(""), groups: [] };
			}
			case LocatorComposition.Alternative: {
				for (const child of locator.children) {
					const match = nextMatch(input, child, startFrom, sticky);
					if (match != null) return match;
				}
				break;
			}
			case LocatorComposition.Sequence: {
				if (sticky) {
					let nextStartFrom = startFrom, result: string[] = [];
					for (const child of locator.children) {
						const match = nextMatch(input, child, nextStartFrom, true);
						if (match == null) return undefined;
						result.push(match.value);
						nextStartFrom += match.value.length;
					}
					return { value: result.join(""), index: startFrom, groups: result };
				}
				else {
					for (let nextStartFrom = startFrom; ;) {
						const candidate = nextMatch(input, locator.children[0], nextStartFrom, false);
						if (candidate == null) return undefined;
						const match = nextMatch(input, locator, candidate.index, true);
						if (match != null) return match;
						nextStartFrom = candidate.index + 1;
					}
				}
			}
		}
	}
	else throw `Unimplemented locator type ${ locator }`;
}

function isNamed(locator: Locator): locator is NamedLocator {
	return typeof locator === "object" && "locatorName" in locator;
}
function isComposed(locator: Locator): locator is ComposedLocator {
	return typeof locator === "object" && "type" in locator && "children" in locator;
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
				ruleMatches[i] = ruleMatch = nextMatch(input.value, locators[i], searchStart, false);
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
				lastMatch = { value: m[0], groups: m.slice(1) };
			}
		}
		else if (isComposed(this.rule.locator)) {
			throw Error(`Composed locators not supported inside of reverse lookups.`);
		}
		else {
			const target = isNamed(this.rule.locator) 
				? ctx.registers.get(this.rule.locator.locatorName) 
				: this.rule.locator;
			if (target == null) return input;
			lastMatchPosition = input.lastIndexOf(target);
			if (lastMatchPosition >= 0) lastMatch = { value: target, groups: [] };
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
