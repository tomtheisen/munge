import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { munge } from './munger.js';
import { parse } from './mungerparser.js';

const folder = 'tests';

const decoder = new TextDecoder;
for (const file of readdirSync(folder)) {
    const fullname = join(folder, file);
    if (!fullname.endsWith(".mg")) continue;
    console.log(fullname);

    const ast = parse(decoder.decode(readFileSync(fullname)));

    let input: string;
    try {
        input = decoder.decode(readFileSync(fullname.replace(/\w+$/, "in.txt")));
    }
    catch (ex) {
        console.log("no input");
        continue;
    }

    const output = munge(input, ast, new Map);
    let expected: string;
    try {
        expected = decoder.decode(readFileSync(fullname.replace(/\w+$/, "expected.txt")));
    }
    catch (ex) {
        console.log("no output spec");
        continue;
    }

    if (expected !== output) console.dir({ output, expected });
}

