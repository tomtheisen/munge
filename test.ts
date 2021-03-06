import { munge, Ruleset, Munger, Sequence, Locator } from './munger.js';
import { Proc } from "./proc.js";
import { parse } from './mungerparser.js';

let tests = 0;
function testCase(input: string, munger: Munger, expected: string) {
    const actual = munge(input, munger, new Map);
    const success = expected == actual;
    if (success) console.log(`\x1b[1A\x1b[K${++tests} good`);
    else {
        console.log(munger);
        console.table({ input, expected, actual });
        console.log();
    }
    return success;
}

function singleRule(find: Locator, replace: Munger) {
    return new Ruleset(Number.POSITIVE_INFINITY, { locator: find, replace });
}

{
    const input = "a";
    const replace = singleRule("", "x");
    const expected = "xax";
    testCase(input, replace, expected);
}

{
    const input = "the foo the bar the foobar legend";
    const replace = new Ruleset(Number.POSITIVE_INFINITY, 
        { locator: "foo", replace: "bar" },
        { locator: /bar/g, replace: "foo" });
    const expected = "the bar the foo the barfoo legend";
    testCase(input, replace, expected);
}

{
    const input = "gooooooooooooooooal";
    const replace = new Ruleset(1, { locator: "oo", replace: "o" }).repeat();
    const expected = "goal";
    testCase(input, replace, expected);
}

{
    const input = "";
    const replace = new Ruleset(1, { locator: /^$/g, replace: "something" });
    const expected = "something";
    testCase(input, replace, expected);
}

{
    const input = "a";
    const replace = new Ruleset(1, 
        { locator: "a", replace: "b" },
        { locator: "a", replace: "c" });
    const expected = "b";
    testCase(input, replace, expected);
}

{
    const multipleTester = new Sequence(Number.POSITIVE_INFINITY,
        new Ruleset(Number.POSITIVE_INFINITY,
            { locator: /[0369]/g, replace: "" },
            { locator: /[47]/g, replace: "1" },
            { locator: /[258]/g, replace: "11" },
        ),
        new Ruleset(Number.POSITIVE_INFINITY,
            { locator: "111", replace: "" }
        ).repeat(),
        new Ruleset(Number.POSITIVE_INFINITY,
            { locator: /.+/g, replace: "not" },
            { locator: /^$/g, replace: "multiple of 3" })
    );

    for (let i = 0; i < 100; i++) {
        let expected = i % 3 ? "not" : "multiple of 3";
        if (!testCase(i.toString(), multipleTester, expected)) break;
    }
}

{
    const multipleTester = new Sequence(Number.POSITIVE_INFINITY,
        new Ruleset(1,
            { locator: /[02468]$/g, replace: new Ruleset(1, { locator: /$/g, replace: "even" }) }
        ),
        new Ruleset(Number.POSITIVE_INFINITY,
            { locator: /[0369]/g, replace: "" },
            { locator: /[47]/g, replace: "1" },
            { locator: /[258]/g, replace: "11" },
        ),
        new Ruleset(Number.POSITIVE_INFINITY,
            { locator: "111", replace: "" }
        ).repeat(),
        new Ruleset(1,
            { locator: /^even$/g, replace: "multiple of 6" },
            { locator: /.*/g, replace: "not" })
    );

    for (let i = 0; i < 100; i++) {
        let expected = i % 6 ? "not" : "multiple of 6";
        if (!testCase(i.toString(), multipleTester, expected)) break;
    }
}

{
    const input = 'a,,b,"c,d",e';
    const replace = new Ruleset(Number.POSITIVE_INFINITY,
        { locator: /".*?"/g, replace: singleRule(/^"|"$/g, "") },
        { locator: ',', replace: "\n" });
    const expected = "a\n\nb\nc,d\ne";
    testCase(input, replace, expected);
}

{
    const input = "abcd";
    const replace = new Proc('_ len');
    const expected = "4";
    testCase(input, replace, expected);
}

{
    const input = "2,11,5,4,3";
    const replace = new Sequence(Number.POSITIVE_INFINITY,
        new Ruleset(Number.POSITIVE_INFINITY,
            { locator: /\d+/g, replace: new Proc('_ "m" get max "m" set drop') },
            { locator: ',', replace: '' }),
        new Proc('"m" get')
    );
    const expected = "11";
    testCase(input, replace, expected);
}

{
    const input = "3,2,5,4,11,3";
    const replace = singleRule(/\d+/g, new Proc('_ "m" get max "m" set'));
    const expected = "3,3,5,5,11,11";
    testCase(input, replace, expected);
}

{
    const input = "3,2,5,4,11,3";
    const replace = new Sequence(Number.POSITIVE_INFINITY,
        singleRule(/\d+/g, new Proc('_ "m" get max "m" set _')),
        singleRule(/\d+/g, new Proc('"m" get')));
    const expected = "11,11,11,11,11,11";
    testCase(input, replace, expected);
}

{
    const input = `
        a
        bbbb
        cc`.replace(/\r?\n/, '');
    const replace = new Sequence(Number.POSITIVE_INFINITY,
        singleRule(/.+/g, new Proc('_ len "maxlen" get max "maxlen" set drop _')),
        singleRule(/.+/g, new Proc('_ "maxlen" get lpad')));
    const expected = `
           a
        bbbb
          cc`.replace(/\r?\n/, '');
    testCase(input, replace, expected);
}

{
    const input = "a";
    const replace = singleRule('a', new Proc('"\\n"'));
    const expected = "\n";
    testCase(input, replace, expected);
}

{
    const input = "a,b,c"
    const replace = singleRule(/\w+/g, new Proc('get(x) _ cat set(x)'))
    const expected = "a,ab,abc";
    testCase(input, replace, expected);
}

{
    const input = "0x100 is two five six while 0xffff is six five five three six, 0xDEAD";
    const replace = singleRule(/0x[0-9a-f]+/ig, new Ruleset(Number.POSITIVE_INFINITY,
        { locator: '0x', replace: new Proc('0 set(h) clear') },
        { locator: /./g, replace: new Proc('get(h) 16 * "0123456789abcdef" _ lower index + set(h) clear') },
        { locator: /$/g, replace: new Proc('get(h)') }));
    const expected = "256 is two five six while 65535 is six five five three six, 57005";
    testCase(input, replace, expected);
}

{
    const input = "pre 7 * 8 post";
    const replace = singleRule(/(\d+) *\* (\d+)/g, new Proc('$1 $2 *'));
    const expected = "pre 56 post";
    testCase(input, replace, expected);
}

{
    const input = "3 + 4 * 5";
    const replace = new Sequence(1,
        singleRule(/(\d+) *\* (\d+)/g, new Proc('$1 $2 *')),
        singleRule(/(\d+) *\+ (\d+)/g, new Proc('$1 $2 +')),
    );
    const expected = "3 + 20";
    testCase(input, replace, expected);
}

{
    const input = "2 * 3 + 4 * 5";
    const replace = new Sequence(1,
        singleRule(/(\d+) *\* (\d+)/g, new Proc('$1 $2 *')),
        singleRule(/(\d+) *\+ (\d+)/g, new Proc('$1 $2 +')),
    ).repeat();
    const expected = "26";
    testCase(input, replace, expected);
}

{
    const input = "2 * (3 + 4) * 5";
    const replace = new Sequence(1,
        singleRule(/\(\d+\)/g, singleRule(/\(|\)/g, '')),
        singleRule(/(\d+) *\* (\d+)/g, new Proc('$1 $2 *')),
        singleRule(/(\d+) *\+ (\d+)/g, new Proc('$1 $2 +')),
    ).repeat();
    const expected = "70";
    testCase(input, replace, expected);
}

{
    const input = "x123y";
    const { munger: replace } = parse(`( /(\\d+)/ => "" )`);
    const expected = "xy";
    testCase(input, replace, expected);
}

{
    const input = "abc";
    const { munger: replace } = parse('#( "" )');
    const expected = "";
    testCase(input, replace, expected);
}

{
    const input = "pile of junk";
    const { munger: replace } = parse('{ 0 9 times { copy 1 + } }');
    const expected = "0123456789";
    testCase(input, replace, expected);
}

{
    const input = "7";
    const { munger: replace } = parse('{ 1 set(n) _ 1 - times { inc(n) get(n) * } }');
    const expected = "5040";
    testCase(input, replace, expected);
}

{
    const input = "abc";
    const { munger: replace } = parse('/b/ => "X"');
    const expected = "aXc";
    testCase(input, replace, expected);
}

{
    const input = "1/2/3 4:56:789";
    const { munger: replace } = parse('/\\d+/ => { 2 _ len - 0 max times { 0 } _ }');
    const expected = "01/02/03 04:56:789";
    testCase(input, replace, expected);
}

{
    const input = "1/2/3 4:56:789";
    const { munger: replace } = parse('/\\d+/ => #({ _ 2 lpad } / / => "0")');
    const expected = "01/02/03 04:56:789";
    testCase(input, replace, expected);
}

{
    const input = "ab";
    const { munger: replace } = parse(`('' => "1" '' => "2")`);
    const expected = "12a12b12";
    testCase(input, replace, expected);
}

{
    const input = "abc"
    const {munger: replace} = parse(`('' => "<" '' => ">" )`);
    const expected = "<>a<>b<>c<>";
    testCase(input, replace, expected);
}

{
    const input = "";
    const {munger: replace} = parse(`{1 push(foo) 1 push(foo) 1 push(foo) count(foo)}`);
    const expected = "3";
    testCase(input, replace, expected);
}

{
    const input = "a cc bbb";
    const {munger: replace} = parse(`#(/\\w+/ => { _ push(arr) } { sort(arr) " " join(arr) } )`);
    const expected = "a bbb cc";
    testCase(input, replace, expected);
}

{
    const input = "lol";
    const {munger: replace} = parse(`{ 1.4 -3 }`);
    const expected = "1.4-3";
    testCase(input, replace, expected);
}

{
    const input = "abcdefg";
    const {munger: replace} = parse(`{ _ -1 skip -2 take }`);
    const expected = "ef";
    testCase(input, replace, expected);
}

{
    const input = "Hello, world!";
    const {munger: replace} = parse(`#( /./ => { _ push(chars) } { uniq(chars) "" join(chars) } )`);
    const expected = "Helo, wrd!";
    testCase(input, replace, expected);
}

