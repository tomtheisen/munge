import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const decoder = new TextDecoder;
const [sourceFileName, targetFileName] = process.argv.slice(2);
let result = decoder.decode(readFileSync(sourceFileName))
const path = dirname(sourceFileName);

console.log({path});

/*
    <!--#embed <style>{file:style.css}</style>-->
    <link rel="stylesheet" href="style.css">
    <!--#/embed-->
*/

result = result.replace(/<!--#embed\b(.*?)-->.*?<!--#\/embed-->/sg, doEmbed);
result = result.replace(/{eval:(.+?)}/g, doEval);

if (targetFileName) writeFileSync(targetFileName, result);
else console.log(result);

function doEmbed(fullMatch: string, template: string): string {
    const fileRefPattern = /{file:(.*?)}/g;
    return template.replace(fileRefPattern, readEmbedFile);
}

function readEmbedFile(fullMatch: string, fileName: string) {
    return decoder.decode(readFileSync(join(path, fileName)));
}

function doEval(fullMatch: string, expr: string) {
    let result = eval(expr);
    return `${result}`;
}
