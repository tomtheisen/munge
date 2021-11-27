/** @jsxImportSource ./node_modules/redactio */

import { RedactioComponent } from './node_modules/redactio/jsx-runtime.js';
import { parse } from './mungerparser.js'
import { munge } from './munger.js'

class MungerApp extends RedactioComponent {
    constructor() {
        super(
            <div>
                <h1>Hello mungees</h1>
                <h2>Munging Code</h2>
                <textarea ref="code"></textarea>
                <h2>Input Document</h2>
                <textarea ref="input"></textarea>
                <button onclick={() => this.munge()}>Munge me</button>
                <h2>Output</h2>
                <div ref="output"></div>
            </div>);
    }

    get code() { return this.refs.code as HTMLTextAreaElement; }
    get input() { return this.refs.input as HTMLTextAreaElement; }

    munge() {
        const parsed = parse(this.code.value);
        const output = munge(this.input.value, parsed.munger, parsed.named);
        this.refs.output.innerText = output;
    }
}

const app = new MungerApp;
document.getElementById("app")!.append(app.element);