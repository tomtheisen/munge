/** @jsxImportSource redactio */

import { MungerApp } from './app.js';
import { MungerDocs } from './docs.js';

const main = document.querySelector("main")!;
switch (location.search) {
    case "?docs":
        const docs = new MungerDocs;
        main.append(docs.element);
        break;
    case "?proc":
        main.append("proc stuff");
        break;
    case "?about":
        main.append("Text Munger by Tom Theisen");
        break;
    default:
        const app = new MungerApp;
        app.refs.mungeTitle.title = (document.getElementById("build-date") as HTMLInputElement).value;
        main.append(app.element);
        app.mounted();
}
