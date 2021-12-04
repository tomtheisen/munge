import { RedactioComponent } from 'redactio/jsx-runtime.js';
import { munge } from '../munger.js';
import { parse } from '../mungerparser.js';
import { makePermalink } from './permalinks.js'

document.head.appendChild(
	(<style>{`
		.example {
			display: flex;
			flex-wrap: wrap;
			justify-content: space-around;
		}

		.example > * {
			flex: auto;
			margin: 0.3em;
			display: flex;
			flex-direction: column;
		}

		.example h5 {
			margin: 0;
		}

		.example pre {
			background: #0008;
			padding: 0.7em;
			font-size: 90%;
			flex-grow: 1;
			margin: 0.5em 0;
		}
	`}</style>).root);

const {  munger: normalizer } = parse(`
#( ! dedent
	/^(\\s*\\n)+/ => ""
	fx /^\\s+/m => { get(indent) _ len min set(indent) }
	/.+/ => { _ get(indent) skip }
)`);

export class MungeExample extends RedactioComponent {
	constructor(attrs: { input: string; munger: string; }) {
		super(
			<aside>
				<h4>Example</h4>
				<div class="example">
					<div>
						<h5>Input</h5>
						<pre ref="input" />
					</div>
					<div>
						<h5>Munger</h5>
						<pre ref="munger" />
					</div>
					<div>
						<h5>Output</h5>
						<pre ref="output" />
					</div>
				</div>
				<a ref="permalink">Try it 🡕</a>
			</aside>);

		const input = munge(attrs.input, normalizer);
		const source = munge(attrs.munger, normalizer);
		this.refs.munger.innerText = source;
		this.refs.input.innerText = input;
		const { munger, named } = parse(attrs.munger);
		this.refs.output.innerText = munge(input, munger, named);

		this.permalink.href = '?' + makePermalink(source, input);
	}

	get permalink() { return this.refs.permalink as HTMLAnchorElement; }
}
