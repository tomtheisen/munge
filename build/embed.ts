import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

const decoder = new TextDecoder;
const [sourceFileName, targetFileName] = process.argv.slice(2);
const contents = decoder.decode(readFileSync(sourceFileName))
const path = dirname(sourceFileName);

console.log({path});

/*
    <!--#embed <style>{file:style.css}</style>-->
    <link rel="stylesheet" href="style.css">
    <!--#/embed-->
*/

const embedPattern = /<!--#embed\b(.*?)-->.*?<!--#\/embed-->/sg;
const result = contents.replace(embedPattern, embed);

if (targetFileName) writeFileSync(targetFileName, result);
else console.log(result);

function embed(fullMatch: string, template: string): string {
    const fileRefPattern = /{file:(.*?)}/g;
    return template.replace(fileRefPattern, readEmbedFile);
}

function readEmbedFile(fullMatch: string, fileName: string) {
    return decoder.decode(readFileSync(join(path, fileName)));
}
