/** @jsxImportSource redactio */

import { RedactioComponent } from 'redactio/jsx-runtime.js';
import { parse, ParseFailure } from '../mungerparser.js';
import { munge } from '../munger.js';
import { AutoSizingTextArea } from './inputs.js';

const MungerSourceKey = "MungerSource";
const MungerDocKey = "MungerDoc";

export class MungerApp extends RedactioComponent {
    constructor() {
        super(
            <div>
                <h1 ref="mungeTitle">Text Munge</h1>
                <h2>Munger Source&nbsp;
                    <small><a href="#docs" target="_blank">?</a></small>
                </h2>
                <AutoSizingTextArea ref="code" />
                <div ref="codeError" class="error" hidden></div>
                <h2>Input Document <button title="Ctrl + Enter" onclick={() => this.munge()}>▶ Munge</button></h2>
                <AutoSizingTextArea ref="input" />

                <div ref="outputPanel" hidden>
                    <h2>Output <button onclick={() => this.copyOutput()}>⧉ Copy</button></h2>
                    <div ref="output" id="output"></div>
                </div>
            </div>);

        this.loadState();

        document.addEventListener("keydown", ev => {
            if (ev.key === "Enter" && ev.ctrlKey) this.munge();
        })
    }

    get code() { return this.refs.code as AutoSizingTextArea; }
    get input() { return this.refs.input as AutoSizingTextArea; }
    get outputPanel() { return this.refs.outputPanel as HTMLDivElement; }
    get output() { return this.refs.output as HTMLDivElement; }

    mounted() {
        this.code.autosize();
        this.input.autosize();
    }

    copyOutput() {
        const range = document.createRange();
        range.selectNodeContents(this.output);
        let selection = getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }

        navigator.clipboard.writeText(this.refs.output.innerText);
    }

    saveState() {
        localStorage.setItem(MungerSourceKey, this.code.value);
        localStorage.setItem(MungerDocKey, this.input.value);
    }

    loadState() {
        const savedSource = localStorage.getItem(MungerSourceKey);
        if (savedSource)
            this.code.value = savedSource;
        const savedInput = localStorage.getItem(MungerDocKey);
        if (savedInput)
            this.input.value = savedInput;
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
