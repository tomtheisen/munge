import { exit } from 'process';
import { Last, Locator, Munger, Proc, Repeater, Rule, Ruleset, Sequence, SideEffects, singleRule, Which } from './munger.js';

export function parse(source: string): { munger: Munger, named: Map<string, Munger> } {
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

    const DoubleStringLiteral = /"(?:[^\\"]|\\.)*"/y;
    function parseDoubleStringLiteral(): string | undefined {
        let match = tryParse(DoubleStringLiteral);
        if (match) return JSON.parse(match[0]);
    }

    const SingleStringLiteral = /'(?:[^\\']|\\.)*'/y;
    function parseSingleStringLiteral(): string | undefined {
        let match = tryParse(SingleStringLiteral);
        if (match) return JSON.parse(match[0].replace(/^'|'$/g, '"'));
    }

    const RegExpLiteral = /\/((?:[^\\\n/]|\\.)+)\/([ism]*)/y;
    function parseRegExpLiteral(): RegExp | undefined {
        let match = tryParse(RegExpLiteral);
        if (match) return new RegExp(match[1], match[2] + 'g');
    }

    const Wholesale = /all/y;
    function parseWholesale(): RegExp | undefined {
        if (!tryParse(Wholesale)) return undefined;
        return /^.*/gs;
    }

    function parseLocator(): Locator | undefined {
        return parseSingleStringLiteral() 
            ?? parseRegExpLiteral()
            ?? parseWholesale();
    }

    const GoesTo = /=>/y;
    function parseRule(): Rule | undefined {
        let find = parseLocator();
        if (find == null) return undefined;
        if (!tryParse(GoesTo)) fail(`Expected '=>'`);
        let replace = parseMunger();
        if (replace == null) fail(`Expected rule munger`);
        return { locator: find, replace };
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
        while ((munger = parseMunger()) != null) mungers.push(munger);
        if (!tryParse(SequenceClose)) fail(`Expected munger or ')'`);
        
        return new Sequence(open[1] ? Which.FirstOnly : Which.All, ...mungers);
    }

    const ProcOpen = /{/y;
    const ProcInstruction = /"(?:[^\\"]|\\.)*"|(?:(?!["{}}])\S)+/y;
    const ProcClose = /}/y;
    function parseProc(): Proc | undefined {
        if (!tryParse(ProcOpen)) return undefined;
        let instructions: (string | Proc)[] = [], match: RegExpExecArray | undefined;
        while (true) {
            if (match = tryParse(ProcInstruction)) {
                instructions.push(match[0]);
                continue;
            }
            const innerProc = parseProc();
            if (innerProc) {
                instructions.push(innerProc);
                continue;
            }
            break;
        }
        if (!tryParse(ProcClose)) fail(`Expected instruction or '}'`);
        return new Proc(instructions);
    }

    const RepeaterPrefix = /@/y;
    function parseRepeater(): Repeater | undefined {
        if (!tryParse(RepeaterPrefix)) return undefined;
        const munger = parseMunger();
        if (munger == null) fail(`Expected munger after '@' decorator`);
        return new Repeater(munger);
    }

    const EatPrefix = /eat\b/y;
    function parseEater(): Sequence | undefined {
        if (!tryParse(EatPrefix)) return undefined;
        const munger = parseMunger();
        if (munger == null) fail(`Expected munger after 'eat' decorator`);
        return new Sequence(Which.All, munger, "");
    }

    const EffectPrefix = /fx\b/y;
    function parseEffect(): SideEffects | undefined {
        if (!tryParse(EffectPrefix)) return undefined;
        const munger = parseMunger();
        if (munger == null) fail(`Expected munger after 'fx' decorator`);
        return new SideEffects(munger);
    }

    const LastOpen = /last\s*\(/y;
    const LastClose = /\)/y;
    function parseLast(): Last | undefined {
        if (!tryParse(LastOpen)) return undefined;
        const rule = parseRule();
        if (rule == null) fail(`Expected rule after 'last('`);
        if (!tryParse(LastClose)) fail(`Expected ')' to close 'last('`);
        return new Last(rule);
    }

    function parseMunger(): Munger | undefined {
        return parseRuleset()
            ?? parseSequence()
            ?? parseRepeater()
            ?? parseLast()
            ?? parseEater()
            ?? parseEffect()
            ?? parseProc()
            ?? parseSingleRule()
            ?? parseDoubleStringLiteral();
    }

    const MungerDeclaration = /def\((\w+)\)/y;
    function parseMungerDef(): {name: string, munger: Munger} | undefined {
        let decl = tryParse(MungerDeclaration);
        if (decl == null) return undefined;
        const name = decl[0];
        let munger = parseMunger();
        if (munger == null) fail(`Expected munger definition after named declaration`);
        return { name, munger };
    }

    let namedMungers = new Map<string, Munger>();
    while (true) {
        const named = parseMungerDef();
        if (named == null) break;
        if (namedMungers.has(named.name)) fail(`Duplicate def() for ${ named.name }`);
        namedMungers.set(named.name, named.munger);
    }

    const munger = parseMunger();
    if (munger == null) fail(`Expected munger definition`);
    return { munger, named: namedMungers };
}
