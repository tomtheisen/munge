import { munge, Ruleset, Which, Munger, Repeater, Sequence, replaceOne as singleReplace, ReplacementAST } from './munger.js';

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
    const input = "the foo the bar the foobar legend";
    const replace = new Ruleset(Which.All, 
        { find: "foo", replace: "bar" },
        { find: /bar/g, replace: "foo" });
    const expected = "the bar the foo the barfoo legend";
    testCase(input, replace, expected);
}

{
    const input = "gooooooooooooooooal";
    const replace = new Repeater(new Ruleset(Which.FirstOnly, { find: "oo", replace: "o" }));
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
    const multipleTester = new Sequence(
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
    const multipleTester = new Sequence(
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
        { find: /".*?"/g, replace: singleReplace(/^"|"$/g, "") },
        // { find: /[^,]+/g, replace: new Ruleset(Which.All) },
        { find: ',', replace: "\n" });
    const expected = "a\n\nb\nc,d\ne";
    testCase(input, replace, expected);
}

{
    const input = "abcd";
    const replace = new ReplacementAST('len');
    const expected = "4";
    testCase(input, replace, expected);
}