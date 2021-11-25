import { Locator, Munger, Proc, Rule, Ruleset, Sequence, Which } from './munger.js';

export function parse(source: string): Munger {
    let consumed = 0;

    const WhiteSpaceAndComments = /(?:\s|!.*)+/y;
    // no backtracking
    function tryParse(tokenPattern: RegExp): RegExpExecArray | undefined {
        if (!tokenPattern.sticky) throw `Token pattern ${tokenPattern} not sticky.`;

        WhiteSpaceAndComments.lastIndex = consumed;
        consumed += WhiteSpaceAndComments.exec(source)?.[0].length ?? 0;
        
        tokenPattern.lastIndex = consumed;
        let match = tokenPattern.exec(source);
        if (match) {
            consumed += match[0].length;
            return match;
        }
    }

    const StringLiteral = /"((?:[^\\"]|\\.)*)"/y;
    function parseStringLiteral(): string | undefined {
        let match = tryParse(StringLiteral);
        if (match) return match[1].replace(/\\(.)/g, "$1");
    }

    const RegExpLiteral = /\/((?:[^\\\n])+)\/([ism]*)/y;
    function parseRegExpLiteral(): RegExp | undefined {
        let match = tryParse(RegExpLiteral);
        if (match) return new RegExp(match[1], match[2] + 'g');
    }

    function parseLocator(): Locator | undefined {
        return parseStringLiteral() ?? parseRegExpLiteral();
    }

    const GoesTo = /=>/y;
    function parseRule(): Rule | undefined {
        let find = parseLocator();
        if (find == null) return undefined;
        if (!tryParse(GoesTo)) throw `Expected '=>' at ${consumed}`;
        let replace = parseMunger();
        if (replace == null) throw `Expected rule munger at ${consumed}`;
        return { find, replace };
    }

    const RulesetOpen = /(1)?\(/y;
    const RulesetClose = /\)/y;
    function parseRuleset(): Ruleset | undefined {
        let open = tryParse(RulesetOpen);
        if (!open) return undefined;

        let rules: Rule[] = [], rule: Rule | undefined;
        while (rule = parseRule()) rules.push(rule);
        if (!tryParse(RulesetClose)) throw `Expected ')' at ${consumed}`;
        
        return new Ruleset(open[1] ? Which.FirstOnly : Which.All, ...rules);
    }

    const SequenceOpen = /(1)?#\(/y;
    const SequenceClose = /\)/y;
    function parseSequence(): Sequence | undefined {
        let open = tryParse(SequenceOpen);
        if (!open) return undefined;

        let mungers: Munger[] = [], munger: Munger | undefined;
        while (munger = parseMunger()) mungers.push(munger);
        if (!tryParse(SequenceClose)) throw `Expected ')' at ${consumed}`;
        
        return new Sequence(open[1] ? Which.FirstOnly : Which.All, ...mungers);
    }

    const ProcOpen = /{/y;
    const ProcInstruction = /"(?:[^\\"]|\\.)*"|(?!["}])\S+/y;
    const ProcClose = /}/y;
    function parseProc(): Proc | undefined {
        if (!tryParse(ProcOpen)) return undefined;
        let instructions: string[] = [], match: RegExpExecArray | undefined;
        while (match = tryParse(ProcInstruction)) instructions.push(match[0]);
        if (!tryParse(ProcClose)) throw `Expected '}' at ${consumed}`;
        return new Proc(instructions);
    }

    function parseMunger(): Munger | undefined {
        return parseStringLiteral()
            ?? parseRuleset()
            ?? parseSequence()
            ?? parseProc();
    }

    const result = parseMunger();
    if (result == null) throw `Expected munger definition at ${consumed}`;
    return result;
}