/** @jsxImportSource redactio */

import { MungerApp } from './MungerApp.js';

switch (window.location.hash) {
    case "#docs":
        break;
    default:
        const app = new MungerApp;
        app.refs.mungeTitle.title = (document.getElementById("build-date") as HTMLInputElement).value;
        document.getElementById("app")!.append(app.element);
        app.mounted();
}
