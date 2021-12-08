import { RedactioComponent, SimpleComponentProps } from 'redactio/jsx-runtime.js';
import { addStyle } from './style.js';

addStyle(`
	textarea {
		resize: none;
		width: 100%;
		min-height: 2em;
		max-height: 50vh;
	}`);

export class AutoSizingTextArea extends RedactioComponent {
	allowComments?: boolean;

	constructor(attr: { allowComments?: boolean } & SimpleComponentProps) {
		super(<textarea 
			spellcheck={false}
			onkeydown={ev => this.keydown(ev)} 
			oninput={() => this.autosize()} />);

		this.allowComments = attr.allowComments;

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

	get selection() { return this.value.substring(this.selectionStart, this.selectionEnd); }

	keydown(ev: KeyboardEvent) {
		if (ev.key === "Tab") {
			ev.preventDefault();
			if (this.selectionStart !== this.selectionEnd) {
				this.expandSelectionToLine();
				if (ev.shiftKey) this.replaceSelection(/^\t/mg, "");
				else this.replaceSelection(/^(.)/mg, "\t$1");
			}
			else if (ev.shiftKey) {
				const pos = this.selectionStart;
				const lineStart = this.value.lastIndexOf("\n", pos - 1) + 1;
				if (this.value[lineStart] === "\t") {
					this.value = this.value.substring(0, lineStart) + this.value.substring(lineStart + 1);
					this.selectionEnd = this.selectionStart = Math.max(pos - 1, lineStart);
				}
			}
			else {
				const pos = this.selectionStart;
				this.value = this.value.substring(0, pos) + "\t" + this.value.substring(pos);
				this.selectionEnd = this.selectionStart = pos + 1;
			}
		}
		else if (ev.key === "/" && ev.ctrlKey && this.allowComments) {
			ev.preventDefault();
			if (this.selectionStart === this.selectionEnd) {
				const start = this.selectionStart;
				const lineStart = this.value.lastIndexOf("\n", start - 1) + 1;
				let i = lineStart;
				for (; " \t".includes(this.value[i]); i++) { }
				if (this.value[i] === '!') {
					if (this.value[i + 1] === ' ') {
						this.value = this.value.substring(0, i) + this.value.substring(i + 2);
						this.selectionEnd = this.selectionStart = start > i ? Math.max(i, start - 2) : start;
					}
					else {
						this.value = this.value.substring(0, i) + this.value.substring(i + 1);
						this.selectionEnd = this.selectionStart = start > i ? start - 1 : start;
					}
				} 
				else {
					this.value = this.value.substring(0, i) + "! " + this.value.substring(i);
					this.selectionEnd = this.selectionStart = start > i ? start + 2 : start;
				}
			}
			else {
				this.expandSelectionToLine();
				const isCommented = this.selection.split(/\n/g)
					.every(line => /^\s*!/.test(line) || line.trim() === "");
				if (isCommented) this.replaceSelection(/^(\s*)! ?/mg, "$1");
				else this.replaceSelection(/^(\s*)(?!$)/mg, "$1! ");
			}
		}
		else if ("})'\"".includes(ev.key) && this.selection === "" && this.value[this.selectionStart] === ev.key) {
			ev.preventDefault();
			this.selectionStart = ++this.selectionEnd;
		}
		else if (ev.key === "{" || ev.key === "(" || ev.key === "'" || ev.key === '"') {
			const start = this.selectionStart, end = this.selectionEnd;

			const close = {"(":")", "{":"}", "'": "'", '"': '"'}[ev.key];
			if (this.selection) {
				ev.preventDefault();
				this.value = this.value.substring(0, start) + ev.key + this.selection + close + this.value.substring(end);
				this.selectionStart = start + 1;
				this.selectionEnd = end + 1;
			}
			else {
				const lineStart = this.value.lastIndexOf('\n', start - 1) + 1;
				const lineEnd = (this.value + '\n').indexOf('\n', start);
				const line = this.value.substring(lineStart, lineEnd);
				if (line.indexOf(ev.key) < 0) {
					ev.preventDefault();
					this.value = this.value.substring(0, start) + ev.key + close + this.value.substring(start);
					this.selectionStart = this.selectionEnd = start + 1; 
				}
			}
		}
		else if (ev.key === "Enter" && this.selection === "" && !ev.ctrlKey) {
			ev.preventDefault();
			const start = this.selectionStart;
			let indentPattern = /[ \t]*/y;
			indentPattern.lastIndex = this.value.lastIndexOf("\n", start - 1) + 1;
			const indent = indentPattern.exec(this.value.substring(0, start))?.[0] ?? "";
			if (/{}|\(\)/.test(this.value.substr(start - 1, 2))) {
				this.value = this.value.substring(0, start) + "\n" + indent + "\t\n" + indent + this.value.substring(start);
				this.selectionStart = this.selectionEnd = start + 2 + indent?.length;
			}
			else if (/{|\(/.test(this.value.substr(start - 1, 1))) {
				this.value = this.value.substring(0, start) + "\n" + indent + "\t" + this.value.substring(start);
				this.selectionStart = this.selectionEnd = start + 2 + indent?.length;
			}
			else {
				this.value = this.value.substring(0, start) + "\n" + indent + this.value.substring(start);
				this.selectionStart = this.selectionEnd = start + 1 + indent?.length;
			}
		}
		else if (ev.key === "Backspace" && this.selection === "" && !ev.shiftKey && !ev.ctrlKey && !ev.altKey) {
			const empties = ["{}","()","''",'""'];
			const start = this.selectionStart;
			const surrounding = this.value.substr(start - 1, 2);
			if (empties.includes(surrounding)) {
				ev.preventDefault();
				this.value = this.value.substring(0, start - 1) + this.value.substring(start + 1);
				this.selectionStart = this.selectionEnd = start - 1;
			}
		}
	}

	expandSelectionToLine() {
		this.selectionStart = this.value.lastIndexOf("\n", this.selectionStart - 1) + 1;
		this.selectionEnd  = (this.value + "\n").indexOf("\n", this.selectionEnd - 1) + 1;
	}

	replaceSelection(find: RegExp, replace: string) {
		const start = this.selectionStart, end = this.selectionEnd;
		const newSelection = this.selection.replace(find, replace);
		this.value = this.value.substring(0, start) + newSelection + this.value.substring(end);
		this.selectionStart = start;
		this.selectionEnd = start + newSelection.length;
	}

	autosize() {
		if (this.element.isConnected) {
			this.element.style.height = "auto";
			this.element.style.height = this.element.scrollHeight + "px";
		}
	}
}
