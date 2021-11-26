import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { munge } from './munger.js';
import { parse } from './mungerparser.js';

const folder = 'tests';

function normalize(s: string) {
    return s.replace(/\r\n?/g, "\n");
}

const decoder = new TextDecoder;
for (const file of readdirSync(folder)) {
    const fullname = join(folder, file);
    if (!fullname.endsWith(".mg")) continue;
    console.log(fullname);

    const { munger: ast, named } = parse(decoder.decode(readFileSync(fullname)));

    let input: string;
    try {
        input = decoder.decode(readFileSync(fullname.replace(/\w+$/, "in.txt")));
    }
    catch (ex) {
        console.log("no input");
        continue;
    }

    const output = munge(input, ast, named);
    let expected: string;
    try {
        expected = decoder.decode(readFileSync(fullname.replace(/\w+$/, "expected.txt")));
        expected = normalize(expected);
    }
    catch (ex) {
        console.log("no output spec");
        console.log(output);
        continue;
    }

    if (expected === output) console.log("Output matches");
    else {
        let diffIndex = 0;
        for (; diffIndex < expected.length || diffIndex < output.length ; diffIndex++) {
            if (output[diffIndex] !== expected[diffIndex]) {
                console.dir({ 
                    ast, diffIndex, output, expected,
                    outputFromDiff: output.substr(diffIndex, 10), 
                    expectedFromDiff: expected.substr(diffIndex, 10) 
                }, { depth: null });
                break;
            }
        }
    }
}
