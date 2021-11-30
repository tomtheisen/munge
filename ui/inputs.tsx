/** @jsxImportSource redactio */

import { RedactioComponent } from 'redactio/jsx-runtime.js';

export class AutoSizingTextArea extends RedactioComponent {
	constructor() {
		super(<textarea 
			spellcheck={false}
			onkeydown={ev => this.keydown(ev)} 
			oninput={() => this.autosize()} />);

		window.addEventListener("resize", () => this.autosize());
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

	keydown(ev: KeyboardEvent) {
		if(ev.key === "Tab") {
			ev.preventDefault();
			if (this.selectionStart == this.selectionEnd) {
				if (ev.shiftKey) {
					const pos = this.selectionStart, nl = this.value.lastIndexOf("\n", pos);
					if (this.value[nl + 1] === "\t") {
						this.value = this.value.substring(0, nl + 1) + this.value.substring(nl + 2);
						this.selectionEnd = this.selectionStart = pos - 1;
					}
				}
				else {
					const pos = this.selectionStart;
					this.value = this.value.substring(0, pos) + "\t" + this.value.substring(pos);
					this.selectionEnd = this.selectionStart = pos + 1;
				}
			}
		}
	}

	autosize() {
		if (this.element.isConnected) {
			this.element.style.height = "auto";
			this.element.style.height = this.element.scrollHeight + "px";
		}
	}
}
