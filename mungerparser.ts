import { exit } from 'process';
import { Locator, Munger, Proc, Repeater, Rule, Ruleset, Sequence, singleRule, Which } from './munger.js';

export function parse(source: string): Munger {
    let consumed = 0;

    const Upcoming = /.*/y;
    function fail(message: string): never {
        const sofar = source.substring(0, consumed);
        let line = 1, col = 1;
        for (let nl of sofar.matchAll(/\n/g)) {
            if (nl.index == null) throw Error("Internal error: RegExp match doesn't have index");
            if (nl.index > consumed) break;
            ++line;
            col = consumed - nl.index + 1;
        }

        console.error(`${ line }:${ col } ` + message);
        Upcoming.lastIndex = consumed;
        const upcoming = Upcoming.exec(source);
        if (upcoming) console.error(`Upcoming: ` + upcoming[0]);
        exit(1);
    }

    const WhiteSpaceAndComments = /(?:\s|!.*)+/y;
    // no backtracking
    function tryParse(tokenPattern: RegExp): RegExpExecArray | undefined {
        if (!tokenPattern.sticky) fail(`Token pattern ${tokenPattern} not sticky.`);

        WhiteSpaceAndComments.lastIndex = consumed;
        consumed += WhiteSpaceAndComments.exec(source)?.[0].length ?? 0;
        
        tokenPattern.lastIndex = consumed;
        let match = tokenPattern.exec(source);
        if (match) {
            consumed += match[0].length;
            return match;
        }
    }

    const DoubleStringLiteral = /"((?:[^\\"]|\\.)*)"/y;
    function parseDoubleStringLiteral(): string | undefined {
        let match = tryParse(DoubleStringLiteral);
        if (match) return match[1].replace(/\\(.)/g, "$1");
    }

    const SingleStringLiteral = /'((?:[^\\']|\\.)*)'/y;
    function parseSingleStringLiteral(): string | undefined {
        let match = tryParse(SingleStringLiteral);
        if (match) return match[1].replace(/\\(.)/g, "$1");
    }

    const RegExpLiteral = /\/((?:[^\\\n]|\\.)+)\/([ism]*)/y;
    function parseRegExpLiteral(): RegExp | undefined {
        let match = tryParse(RegExpLiteral);
        if (match) return new RegExp(match[1], match[2] + 'g');
    }

    function parseLocator(): Locator | undefined {
        return parseSingleStringLiteral() ?? parseRegExpLiteral();
    }

    const GoesTo = /=>/y;
    function parseRule(): Rule | undefined {
        let find = parseLocator();
        if (find == null) return undefined;
        if (!tryParse(GoesTo)) fail(`Expected '=>'`);
        let replace = parseMunger();
        if (replace == null) fail(`Expected rule munger`);
        return { find, replace };
    }

    function parseSingleRule(): Ruleset | undefined {
        const rule = parseRule();
        if (rule == null) return undefined;
        return new Ruleset(Which.All, rule);
    }

    const RulesetOpen = /(1)?\(/y;
    const RulesetClose = /\)/y;
    function parseRuleset(): Ruleset | undefined {
        let open = tryParse(RulesetOpen);
        if (!open) return undefined;

        let rules: Rule[] = [], rule: Rule | undefined;
        while (rule = parseRule()) rules.push(rule);
        if (!tryParse(RulesetClose)) fail(`Expected rule or ')'`);
        
        return new Ruleset(open[1] ? Which.FirstOnly : Which.All, ...rules);
    }

    const SequenceOpen = /(1)?#\(/y;
    const SequenceClose = /\)/y;
    function parseSequence(): Sequence | undefined {
        let open = tryParse(SequenceOpen);
        if (!open) return undefined;

        let mungers: Munger[] = [], munger: Munger | undefined;
        while (munger = parseMunger()) mungers.push(munger);
        if (!tryParse(SequenceClose)) fail(`Expected munger or ')'`);
        
        return new Sequence(open[1] ? Which.FirstOnly : Which.All, ...mungers);
    }

    const ProcOpen = /{/y;
    const ProcInstruction = /"(?:[^\\"]|\\.)*"|(?!["}])\S+/y;
    const ProcClose = /}/y;
    function parseProc(): Proc | undefined {
        if (!tryParse(ProcOpen)) return undefined;
        let instructions: string[] = [], match: RegExpExecArray | undefined;
        while (match = tryParse(ProcInstruction)) instructions.push(match[0]);
        if (!tryParse(ProcClose)) fail(`Expected instruction or '}'`);
        return new Proc(instructions);
    }

    const RepeaterPrefix = /@/y;
    function parseRepeater(): Repeater | undefined {
        if (!tryParse(RepeaterPrefix)) return undefined;
        const munger = parseMunger();
        if (munger == null) fail(`Expected munger after @`);
        return new Repeater(munger);
    }

    function parseMunger(): Munger | undefined {
        return parseRuleset()
            ?? parseSequence()
            ?? parseRepeater()
            ?? parseProc()
            ?? parseSingleRule()
            ?? parseDoubleStringLiteral();
    }

    const result = parseMunger();
    if (result == null) fail(`Expected munger definition`);
    return result;
}