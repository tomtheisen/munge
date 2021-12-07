import { RedactioComponent, RenderOutput } from 'redactio/jsx-runtime.js';
import { parse, ParseFailure } from '../mungerparser.js';
import { munge } from '../munger.js';
import { AutoSizingTextArea } from './inputs.js';
import { decodePermalink, makePermalink } from './permalinks.js';
import { NotificationPop } from './notification.js';

document.head.appendChild((
	<style>{`
		#app-title {
			margin: 0;
		}
		
		#app-inputs {
			display: flex;
			flex-wrap: wrap;
			margin: 0 -1em;
		}
		
		#app-inputs > * {
			flex-grow: 1;
			min-width: calc(min(36em, 100vw - 5em));
			margin: 0 1em;
		}
		
		#app-inputs h2 {
			line-height: 2;
		}

		#output {
			white-space: pre;
			background: #234;
			padding: 1em;
			font-family: monospace;
		}

		#notification-area {
			position: fixed;
			z-index: 1;
			left: 2em;
			bottom: 3em;
		}
	`}</style>
).root);

const MungerSourceKey = "MungerSource";
const MungerDocKey = "MungerDoc";

const formatMunger = parse(`
	( ! format munger
		/^(?: |\\t)*(\\)|})/m => { 
			dec(indent) 
			"\\t" get(indent) rep $1
		}
		/^(?: |\\t)*/m => { "\\t" get(indent) rep }
		/!.*/ => ()
		/\\(|{/ => fx { inc(indent) }
		/\\)|}/ => fx { dec(indent) }
		/(["'\\/])(\\\\.|.)*?\\1/ => ()
		/(?: |\\t)+$/m => ""
	)`).munger;

export class MungerApp extends RedactioComponent {
	constructor() {
		super(
			<>
				<h1 ref="mungeTitle" id="app-title">Text Munge</h1>
				<div id="app-inputs">
					<div>
						<h2>Munger Source
							&nbsp;<small class="faint">(<kbd>F2</kbd>)</small> 
							&nbsp;<small><a href="?docs" target="_blank">?</a></small>
							&nbsp;<small><a href="?" target="_blank">New</a></small>
						</h2>
						<AutoSizingTextArea allowComments={true} ref="code" />
						<div ref="codeError" class="error" hidden></div>
					</div>
					<div>
						<h2>
							Input Document
							&nbsp;<small class="faint">(<kbd>F4</kbd>)</small> 
							&nbsp;<button onclick={() => this.munge()}>▶ Munge <small>(Ctrl + ↲)</small></button>
						</h2>
						<AutoSizingTextArea ref="input" />
					</div>
				</div>

				<div ref="outputPanel" hidden>
					<h2>Output <button onclick={() => this.copyOutput()}>⧉ Copy</button></h2>
					<div ref="output" id="output"></div>
				</div>

				<div id="notification-area" ref="notificationArea"></div>
			</>);

		this.loadState();
		this.loadPermaLink();

		document.addEventListener("keydown", ev => {
			if (ev.key === "Enter" && ev.ctrlKey) this.munge();
			else if (ev.code === "KeyS" && ev.ctrlKey) this.savePermaLink();
			else if (ev.key === "F2") this.code.focus();
			else if (ev.key === "F4") this.input.focus();
			else if (ev.code === "KeyF" && ev.ctrlKey && ev.shiftKey) {
				this.code.value = munge(this.code.value, formatMunger, new Map);
				this.code.focus();
			}
			else return;

			ev.preventDefault();
		});
	}

	get code() { return this.refs.code as AutoSizingTextArea; }
	get input() { return this.refs.input as AutoSizingTextArea; }
	get outputPanel() { return this.refs.outputPanel as HTMLDivElement; }
	get output() { return this.refs.output as HTMLDivElement; }
	get notificationArea() { return this.refs.notificationArea as HTMLDivElement; }

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
		sessionStorage.setItem(MungerSourceKey, this.code.value);
		sessionStorage.setItem(MungerDocKey, this.input.value);
	}

	loadState() {
		const savedSource = sessionStorage.getItem(MungerSourceKey);
		if (savedSource)
			this.code.value = savedSource;
		const savedInput = sessionStorage.getItem(MungerDocKey);
		if (savedInput)
			this.input.value = savedInput;
	}

	codeChanged() {
		this.refs.codeError.hidden = true;
	}

	munge() {
		this.saveState();
		const start = new Date
		try {
			this.refs.output.innerText = "";
			const parsed = parse(this.code.value);
			this.refs.codeError.hidden = true;
			const output = munge(this.input.value, parsed.munger, parsed.locators, parsed.mungers);
			this.refs.output.innerText = output;
			this.refs.outputPanel.hidden = false;
			let success: RenderOutput = (
				<NotificationPop timeout={5000}>
					Munging complete in { new Date().valueOf() - start.valueOf() } ms.
				</NotificationPop>);
			this.notificationArea.append(success.root);
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
			let failure: RenderOutput = (
				<NotificationPop timeout={5000}>
					Munging failed.
				</NotificationPop>);
			this.notificationArea.append(failure.root);
			return;
		}
	}

	savePermaLink() {
		const permalink = location.hash = makePermalink(this.code.value, this.input.value);
		const copyclick = () => {
			navigator.clipboard.writeText(permalink);
			notification.refs.check.hidden = false;
		};
		const notification: RenderOutput = (
			<NotificationPop timeout={5000}>
				<a href={permalink}>Permalink</a> generated. {" "}
				<span ref="check" hidden>✔</span>
				<button onclick={ copyclick }>⧉ Copy</button>
			</NotificationPop>);
		this.notificationArea.append(notification.root);
	}

	loadPermaLink() {
		try {
			if (location.hash.length <= 1) return;
			else {
				const state = decodePermalink(location.hash);
				this.code.value = state.munger;
				this.input.value = state.input;
			}
		}
		catch (ex) {
			console.error(ex);
		}
	}
}
