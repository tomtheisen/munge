/** @jsxImportSource redactio */

import { RedactioComponent } from 'redactio/jsx-runtime.js';
import { parse, ParseFailure } from '../mungerparser.js'
import { munge } from '../munger.js'

const MungerSourceKey = "MungerSource";
const MungerDocKey = "MungerDoc";

class MungerApp extends RedactioComponent {
    constructor() {
        super(
            <div>
                <h2>Munging Code</h2>
                <textarea ref="code" oninput={() => this.codeChanged()}></textarea>
                <div ref="codeError" class="error" hidden></div>
                <h2>Input Document</h2>
                <textarea ref="input"></textarea>
                <button onclick={() => this.munge()}>Munge me</button>
                <div ref="outputPanel" hidden>
                    <h2>Output</h2>
                    <div ref="output"></div>
                </div>
            </div>);

        this.loadState();
    }

    get code() { return this.refs.code as HTMLTextAreaElement; }
    get input() { return this.refs.input as HTMLTextAreaElement; }

    saveState() {
        localStorage.setItem(MungerSourceKey, this.code.value);
        localStorage.setItem(MungerDocKey, this.input.value);
    }

    loadState() {
        const savedSource = localStorage.getItem(MungerSourceKey);
        if (savedSource) this.code.value = savedSource;
        const savedInput = localStorage.getItem(MungerDocKey);
        if (savedInput) this.input.value = savedInput;
    }

    codeChanged() {
        this.refs.codeError.hidden = true;
    }

    munge() {
        this.saveState();
        try {
            const parsed = parse(this.code.value);
            this.refs.codeError.hidden = true;
            const output = munge(this.input.value, parsed.munger, parsed.named);
            this.refs.output.innerText = output;
            this.refs.outputPanel.hidden = false;
        }
        catch (er: any) {
            if (er instanceof ParseFailure) {
                this.refs.codeError.innerText = `${er.line}:${er.column} ${er.message}`;
                this.code.focus();
                this.code.selectionStart = er.position; 
                this.code.selectionEnd = er.position + 1;
            }
            else {
                this.refs.codeError.innerText = er?.toString();
            }
            this.refs.codeError.hidden = false;
            return;
        }
    }
}

const app = new MungerApp;
document.getElementById("app")!.append(app.element);