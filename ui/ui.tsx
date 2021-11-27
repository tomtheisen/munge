/** @jsxImportSource redactio */

import { RedactioComponent } from 'redactio/jsx-runtime.js';
import { parse } from '../mungerparser.js'
import { munge } from '../munger.js'

class MungerApp extends RedactioComponent {
    constructor() {
        super(
            <div>
                <h1>Hello mungees</h1>
                <h2>Munging Code</h2>
                <textarea ref="code"></textarea>
                <div ref="codeError" class="error" hidden></div>
                <h2>Input Document</h2>
                <textarea ref="input"></textarea>
                <button onclick={() => this.munge()}>Munge me</button>
                <div ref="outputPanel" hidden>
                    <h2>Output</h2>
                    <div ref="output"></div>
                </div>
            </div>);
    }

    get code() { return this.refs.code as HTMLTextAreaElement; }
    get input() { return this.refs.input as HTMLTextAreaElement; }

    munge() {
        try {
            const parsed = parse(this.code.value);
            this.refs.codeError.hidden = true;
            const output = munge(this.input.value, parsed.munger, parsed.named);
            this.refs.output.innerText = output;
            this.refs.outputPanel.hidden = false;
        }
        catch (er: any) {
            this.refs.codeError.innerText = er?.toString();
            this.refs.codeError.hidden = false;
            return;
        }
    }
}

const app = new MungerApp;
document.getElementById("app")!.append(app.element);