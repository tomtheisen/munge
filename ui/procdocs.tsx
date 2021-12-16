import { RedactioComponent } from 'redactio/jsx-runtime.js';
import { MungeExample } from './example.js';

export class ProcDocs extends RedactioComponent {
	constructor() {
		super(
			<article>
				<h1>Munging Procs</h1>
				<p>
					Procs operate on a stack.  All values are strings.  
					Some instructions operate on numbers, but they're really just strings like <code>"123"</code>.
					There are two namespaces for variables.
					One for normal string variables, and another for arrays of strings.
				</p>
				<p>                    
					A proc is just one type of munger.  All mungers produce a single string as output.
					At the conclusion of a proc, all the values in the stack are concatenated together to produce the output.
				</p>
				<p>
					Certain noted instructions operate on blocks.  
					Blocks are groups of instructions enclosed in curly braces. <code>{`{ }`}</code>
					Blocks can be nested.
				</p>
				<p>
					Some instructions take a named variable in parentheses like <code>set(x)</code>.
					This is the equivalent of <code>"x" set</code>.
					This allows a crude form of indirection by allowing non-constant variable names.
				</p>
				<h2>Proc Instructions</h2>
				<dl>
					<dt><code>_</code></dt>
						<dd>Push the current matched value.</dd>
					<dt><code>"abc"</code></dt>
						<dd>Push a string literal.</dd>
					<dt><code>123</code></dt>
						<dd>Push a string literal consisting of digits.</dd>
					<dt><code>$1</code></dt>
						<dd>Push the value of the first capture group from a regex locator. Works for other numbers too.</dd>
					<dt><code>group</code></dt>
						<dd>Push the value of the nth capture group from a regex locator. n is popped.</dd>
					<dt><code>swap</code></dt>
						<dd>Swap the top two values on the stack.</dd>
					<dt><code>copy</code></dt>
						<dd>Copy the top value on the stack.</dd>
					<dt><code>drop</code></dt>
						<dd>Pop from the stack and throw it in the trash.</dd>
					<dt><code>clear</code></dt>
						<dd>Empty the whole stack.</dd>
					<dt><code>len</code></dt>
						<dd>Push the length of a string.</dd>
					
					<dt><code>min</code></dt>
					<dt><code>max</code></dt>
						<dd>Pop two values.  Push the lesser or greater of them, interpreted as numbers.</dd>
					
					<dt><code>&lt;</code></dt>
					<dt><code>&gt;</code></dt>
					<dt><code>=</code></dt>
						<dd>Pop two values.  Push 0 or 1 depending on the comparison of the two.</dd>
					
					<dt><code>&lt;&lt;</code></dt>
					<dt><code>&gt;&gt;</code></dt>
					<dt><code>&lt;=</code></dt>
					<dt><code>&gt;=</code></dt>
						<dd>Pop two values.  Push 0 or 1 depending on the comparison of the two, treating them as numbers.</dd>
					
					<dt><code>+</code></dt>
					<dt><code>-</code></dt>
					<dt><code>*</code></dt>
					<dt><code>/</code></dt>
					<dt><code>%</code></dt>
						<dd>Pop two values.  Push the result of an arithmetic operation.</dd>

					<dt><code>floor</code></dt>
						<dd>Pop a number.  Push its numeric floor.</dd>
					
					<dt><code>not</code></dt>
						<dd>Pop a value.  Push 0 if it's truthy, or 1 otherwise.</dd>
					<dt><code>or</code></dt>
						<dd>Pop two values. Push the first one if it's truthy.  Otherwise push the second.</dd>

					<dt><code>cat</code></dt>
						<dd>Pop a value, then concatenate with the top of the stack</dd>
					<dt><code>lpad</code></dt>
					<dt><code>rpad</code></dt>
						<dd>Pop a width.  Left- or right-pad a value to the specified width.</dd>
					<dt><code>zpad</code></dt>
						<dd>Pop a width.  Left-pad a value with zeroes to the specified width.</dd>
					<dt><code>index</code></dt>
						<dd>Pop two values.  Push the index of the first occurrence of the second in the first.</dd>
					<dt><code>upper</code></dt>
					<dt><code>lower</code></dt>
						<dd>Pop a value.  Convert the case and push.</dd>
					<dt><code>take</code></dt>
					<dt><code>skip</code></dt>
						<dd>Pop an index.  Push the left or right substring of a value from that position.  Negative numbers index from the end of the string.</dd>
					<dt><code>ord</code></dt>
					<dt><code>chr</code></dt>
						<dd>Convert between a character and the corresponding unicode codepoint.</dd>
					<dt><code>hex</code></dt>
					<dt><code>unhex</code></dt>
						<dd>Convert between decimal and hexadecimal representation. "255" &lt;-&gt; "ff"  </dd>
					<dt><code>set(x)</code></dt>
					<dt><code>get(x)</code></dt>
						<dd>Gets or sets a named variable.</dd>
					<dt><code>inc(x)</code></dt>
					<dt><code>dec(x)</code></dt>
						<dd>Increment or decrement a named variable.  Does not touch the stack.</dd>

					<dt><code>cons(x)</code></dt>
					<dt><code>push(x)</code></dt>
						<dd>Pop a value.  Insert it at the beginning or end of a named array.</dd>
					<dt><code>uncons(x)</code></dt>
					<dt><code>pop(x)</code></dt>
						<dd>Push a value removed from the beginning or end of a named array.</dd>
					<dt><code>getat(x)</code></dt>
						<dd>Pop a 0-indexed position.  Read a value at that position in a named array and push it.</dd>
					<dt><code>empty(x)</code></dt>
						<dd>Remove all elements from named array.</dd>
					<dt><code>count(x)</code></dt>
						<dd>Push the length of a named array.</dd>
					<dt><code>rev(x)</code></dt>
						<dd>Reverse a named array in place.  Does not touch the stack.</dd>
					<dt><code>join(x)</code></dt>
						<dd>Pop a delimiter.  Use it to join a named array.  Push the result.</dd>
					<dt><code>sort(x)</code></dt>
						<dd>Sort a named array.  Does not touch the stack.</dd>
					<dt><code>uniq(x)</code></dt>
						<dd>Leave only the first occurrence of each distinct value in a named array.  Does not touch the stack.</dd>

					<dt><code>if {`{ ... } [{ ... }]`}</code></dt>
						<dd>Pop a condition.  If it's truthy, execute the following condition block.  Otherwise execute the else block, if present.</dd>
					<dt><code>for(x) {`{ ... }`}</code></dt>
						<dd>Execute a block for each element in a named array.  The element will be accessible from the <code>_</code> instruction.</dd>
					<dt><code>times {`{ ... }`}</code></dt>
						<dd>Pop a number.  Execute a block that many times.</dd>

					<dt><code>do(x)</code></dt>
						<dd>Invoke a named proc, established using a <code>def(x)</code> declaration.</dd>

					<dt><code>log</code></dt>
						<dd>Pop a value and log it to the console.</dd>
					<dt><code>dump</code></dt>
						<dd>Logs the current state of things to the console.</dd>
					<dt><code>fail</code></dt>
						<dd>Stop munging.  Pop a value and use it for a failure message.</dd>
				</dl>
				<h2>Parting Example</h2>
				<p>
					Here's a fancy little number that demonstrates many of these.
					It indents JSON.
				</p>
				<MungeExample
					input={`
						{ "kind": "Combobox", "defaultValue": "win-x86", 
						"label": { "$ref": "strings:#/targetRuntime" }, 
						"itemsSource": { "kind": "TargetRuntime", "defaults": 
						[ "win-x86", "win-x64", "win-arm", "osx-x64", 
						"linux-x64", "linux-arm" ], "dependsOn": [ 
						"DeploymentMode.SelectedValue" ] }, "enabled": 
						"true" }`}
					munger={`
						def(nl) {                 ! macro definition for next line
							"\\n"
							get(depth) times {"  "} ! repeat indent string
						}
						(
							/\\s/ => ""            ! strip pre-existing whitespace
							/"(?:\\\\.|.)*?"/ => () ! don't touch string literals
							':' => ": "           ! single space after colon
							',' => { _ do(nl) }   ! newline after comma
							/{|\\[/ => {           ! open braces
								inc(depth)
								_ do(nl)
							}
							/}|\\]/ => {           ! close braces
								dec(depth)
								do(nl) _ 
							}
						)`}
				/>
			</article>
		)
	}
}
