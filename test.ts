import { munge, Ruleset, Which, Munger, Sequence, singleRule, Proc, noop } from './munger.js';

let tests = 0;
function testCase(input: string, munger: Munger, expected: string) {
    const actual = munge(input, munger);
    const success = expected == actual;
    if (success) console.log(`\x1b[1A\x1b[K${++tests} good`);
    else {
        console.log(munger);
        console.table({ input, expected, actual });
        console.log();
    }
    return success;
}

{
    const input = "a";
    const replace = singleRule("", "x");
    const expected = "xax";
    testCase(input, replace, expected);
}

{
    const input = "the foo the bar the foobar legend";
    const replace = new Ruleset(Which.All, 
        { find: "foo", replace: "bar" },
        { find: /bar/g, replace: "foo" });
    const expected = "the bar the foo the barfoo legend";
    testCase(input, replace, expected);
}

{
    const input = "gooooooooooooooooal";
    const replace = new Ruleset(Which.FirstOnly, { find: "oo", replace: "o" }).repeat();
    const expected = "goal";
    testCase(input, replace, expected);
}

{
    const input = "";
    const replace = new Ruleset(Which.FirstOnly, { find: /^$/g, replace: "something" });
    const expected = "something";
    testCase(input, replace, expected);
}

{
    const input = "a";
    const replace = new Ruleset(Which.FirstOnly, 
        { find: "a", replace: "b" },
        { find: "a", replace: "c" });
    const expected = "b";
    testCase(input, replace, expected);
}

{
    const multipleTester = new Sequence(Which.All,
        new Ruleset(Which.All,
            { find: /[0369]/g, replace: "" },
            { find: /[47]/g, replace: "1" },
            { find: /[258]/g, replace: "11" },
        ),
        new Ruleset(Which.All,
            { find: "111", replace: "" }
        ).repeat(),
        new Ruleset(Which.All,
            { find: /.+/g, replace: "not" },
            { find: /^$/g, replace: "multiple of 3" })
    );

    for (let i = 0; i < 100; i++) {
        let expected = i % 3 ? "not" : "multiple of 3";
        if (!testCase(i.toString(), multipleTester, expected)) break;
    }
}

{
    const multipleTester = new Sequence(Which.All,
        new Ruleset(Which.FirstOnly,
            { find: /[02468]$/g, replace: new Ruleset(Which.FirstOnly, { find: /$/g, replace: "even" }) }
        ),
        new Ruleset(Which.All,
            { find: /[0369]/g, replace: "" },
            { find: /[47]/g, replace: "1" },
            { find: /[258]/g, replace: "11" },
        ),
        new Ruleset(Which.All,
            { find: "111", replace: "" }
        ).repeat(),
        new Ruleset(Which.FirstOnly,
            { find: /^even$/g, replace: "multiple of 6" },
            { find: /.*/g, replace: "not" })
    );

    for (let i = 0; i < 100; i++) {
        let expected = i % 6 ? "not" : "multiple of 6";
        if (!testCase(i.toString(), multipleTester, expected)) break;
    }
}

{
    const input = 'a,,b,"c,d",e';
    const replace = new Ruleset(Which.All,
        { find: /".*?"/g, replace: singleRule(/^"|"$/g, "") },
        // { find: /[^,]+/g, replace: new Ruleset(Which.All) },
        { find: ',', replace: "\n" });
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
    const replace = new Sequence(Which.All,
        new Ruleset(Which.All,
            { find: /\d+/g, replace: new Proc('_ "m" get max "m" set drop') },
            { find: ',', replace: '' }),
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
    const replace = new Sequence(Which.All,
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
    const replace = new Sequence(Which.All,
        singleRule(/.+/g, new Proc('_ len "maxlen" get max "maxlen" set drop _')),
        singleRule(/.+/g, new Proc('_ "maxlen" get lpad')));
    const expected = `
           a
        bbbb
          cc`.replace(/\r?\n/, '');
    testCase(input, replace, expected);
}

{
    const input = `
        a,b,c
        d,e,f,g
        h,i`.replace(/\r?\n/, '');
    const replace = singleRule(/.+/g, 
        new Ruleset(Which.All, 
            { find: /^/g, replace: new Proc('-1 "i" set drop _') },
            { find: /[^,]+/g, replace: new Proc('_ "i" get 1 + "i" set 1 = not when') },
            { find: ',', replace: new Proc('_ "i" get 0 = not when')}));
    const expected = `
        a,c
        d,f,g
        h`.replace(/\r?\n/, '');
    testCase(input, replace, expected);
}

{
    const input = "a";
    const replace = singleRule('a', new Proc('"\n"'));
    const expected = "\n";
    testCase(input, replace, expected);
}

{
    const input = "<outer><inner/><inner><child/></inner></outer>";
    const replace = new Ruleset(Which.All,
        { find: /<\w+>/g, replace: new Proc('" " "indent" get rep "indent" get 4 + "indent" set drop _ nl') },
        { find: /<\/\w+>/g, replace: new Proc('" " "indent" get 4 - "indent" set rep _ nl') },
        { find: /<\w+\/>/g, replace: new Proc('" " "indent" get rep _ nl') });
    const expected = `
<outer>
    <inner/>
    <inner>
        <child/>
    </inner>
</outer>
`.trimStart();
    testCase(input, replace, expected);
}

{
    const input = "<outer>                             <inner/><inner><child/></inner></outer>";
    const replace = new Ruleset(Which.All,
        { find: /\s+/g, replace: '' },
        { find: /<\w+>/g, replace: new Proc('" " "indent" get rep "indent" get 4 + "indent" set drop _ nl') },
        { find: /<\/\w+>/g, replace: new Proc('" " "indent" get 4 - "indent" set rep _ nl') },
        { find: /<\w+\/>/g, replace: new Proc('" " "indent" get rep _ nl') });
    const expected = `
<outer>
    <inner/>
    <inner>
        <child/>
    </inner>
</outer>
`.trimStart();
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
    const replace = singleRule(/0x[0-9a-f]+/ig, new Ruleset(Which.All,
        { find: '0x', replace: new Proc('0 set(h) clear') },
        { find: /./g, replace: new Proc('get(h) 16 * "0123456789abcdef" _ lower index + set(h) clear') },
        { find: /$/g, replace: new Proc('get(h)') }));
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
    const replace = new Sequence(Which.FirstOnly,
        singleRule(/(\d+) *\* (\d+)/g, new Proc('$1 $2 *')),
        singleRule(/(\d+) *\+ (\d+)/g, new Proc('$1 $2 +')),
    );
    const expected = "3 + 20";
    testCase(input, replace, expected);
}

{
    const input = "2 * 3 + 4 * 5";
    const replace = new Sequence(Which.FirstOnly,
        singleRule(/(\d+) *\* (\d+)/g, new Proc('$1 $2 *')),
        singleRule(/(\d+) *\+ (\d+)/g, new Proc('$1 $2 +')),
    ).repeat();
    const expected = "26";
    testCase(input, replace, expected);
}

{
    const input = "2 * (3 + 4) * 5";
    const replace = new Sequence(Which.FirstOnly,
        singleRule(/\(\d+\)/g, singleRule(/\(|\)/g, '')),
        singleRule(/(\d+) *\* (\d+)/g, new Proc('$1 $2 *')),
        singleRule(/(\d+) *\+ (\d+)/g, new Proc('$1 $2 +')),
    ).repeat();
    const expected = "70";
    testCase(input, replace, expected);
}

