/** @jsxImportSource redactio */

import { RedactioComponent } from 'redactio/jsx-runtime.js';
import { munge } from '../munger.js';
import { parse } from '../mungerparser.js';

const {  munger: normalizer } = parse(`
#( ! dedent
	/^(\\s*\\n)+/ => ""
	fx /^\\s+/m => { get(indent) _ len min set(indent) }
	/.+/ => { _ get(indent) skip }
)`);

export class MungeExample extends RedactioComponent {
    constructor(attrs: { input: string; munger: string; }) {
        super(
            <div>
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
                {/* <a target="_blank" href="?#something">Try it</a> */}
            </div>);

        const input = munge(attrs.input, normalizer);
        this.refs.input.innerText = input;
        this.refs.munger.innerText = munge(attrs.munger, normalizer);
        const { munger, named } = parse(attrs.munger);
        this.refs.output.innerText = munge(input, munger, named);
    }
}
