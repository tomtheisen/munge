/** @jsxImportSource redactio */

import { RedactioComponent } from 'redactio/jsx-runtime.js';

export class AutoSizingTextArea extends RedactioComponent {
    constructor() {
        super(<textarea spellcheck={false} oninput={() => this.autosize()} />);
    }

    private get textarea() { return this.element as HTMLTextAreaElement; }

    get value() { return this.textarea.value; }
    set value(v: string) {
        this.textarea.value = v;
        this.autosize();
    }

    get selectionStart() { return this.textarea.selectionStart; }
    set selectionStart(value: number) { this.textarea.selectionStart = value; }

    get selectionEnd() { return this.textarea.selectionEnd; }
    set selectionEnd(value: number) { this.textarea.selectionEnd = value; }

    autosize() {
        if (this.element.isConnected) {
            this.element.style.height = "auto";
            this.element.style.height = this.element.scrollHeight + "px";
        }
    }
}
