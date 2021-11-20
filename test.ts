import { munge, Ruleset, Which, Munger } from './munger.js';

function testCase(input: string, transform: Munger, expected: string) {
    const actual = munge(input, transform);
    const success = expected == actual;
    if (success) console.log("good");
    else {
        console.log("bad");
        console.log(`expected: ${ expected }`);
        console.log(`actual:   ${ actual }`);
    }
}

const input = "the foo the bar the foobar legend";
const replace = new Ruleset(Which.AllSimultaneously, 
    { find: "foo", replace: "bar" },
    { find: /bar/g, replace: "foo" });
const expected = "the bar the foo the barfoo legend";

testCase(input, replace, expected);

