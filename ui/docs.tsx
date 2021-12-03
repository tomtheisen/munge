/** @jsxImportSource redactio */

import { RedactioComponent } from 'redactio/jsx-runtime.js';
import { MungeExample } from './example.js';

export class MungerDocs extends RedactioComponent {
	constructor() {
		super(
			<article>
				<h1>Text Munge Docs</h1>
				<section>
					<p>
						Munging is about manipulating text.    
					</p>
					<ol>
						<li>You have an input document as a string.</li>
						<li>You apply a munger.</li>
						<li>You get an output document as a string.</li>
					</ol>
					<p>
						A simple munger might extract email addresses.  
						A fancy munger could convert CSV to JSON.
						Some things work better than others.
						Let's look at an example.
					</p>

					<MungeExample input="Hello world" munger={ "/o/ => \"u\"" } />
					
					<h2 id="munger">Mungers</h2>
					<p>
						A <dfn>munger</dfn> takes text as input.  
						Some can optionally take other context information as well.
						It produces text as output.
						There are several types of mungers.
					</p>
					<ul>
						<li><a href="#rule">Rule</a></li>
						<li><a href="#ruleset">Ruleset</a></li>
						<li><a href="#literal">String</a></li>
						<li><a href="#repeater">Repeater</a></li>
						<li><a href="#effects">Side-effect decorator</a></li>
						<li><a href="#last">Last decorator</a></li>
						<li><a href="#proc">Proc</a></li>
						<li><a href="#named">Named Reference</a></li>
					</ul>
				</section>
				<h2 id="rule">Rules</h2>
				<section>
					<p>
						A <dfn>rule</dfn> consists of a locator and a munger.
						They go in that order with <code>=&gt;</code> in between them.
					</p>
				</section>
				<h2 id="locator">Locators</h2>
				<h3>Literal locator</h3>
				<section>
					<p>
						A <dfn>locator</dfn> finds some particular substring of the input to manipulate.
						There are three kinds.  
						The simplest locator is the literal.  
						It's enclosed in single quotes.
					</p>
					<MungeExample input={"Once you munge,\nyou never go back"} munger={`' ' => ""`} />
				</section>
				<h3>RegExp locator</h3>
				<section>
					<p>
						There are also <dfn>regular expression locators</dfn>, using mostly javascript syntax.
						The <code>ism</code> flags are supported. 
						The <code>g</code> flag is implied.&nbsp;
					</p>
					<MungeExample input="abc 123 def 456" munger={`/\\d/ => "_"`} />
				</section>
				<h3>Named value locator</h3>
				<section>
					<p>
						The fanciest of the locators is the <dfn>named value locator</dfn>.
						This finds an occurrence of a named value stored by a <a href="#proc">proc</a>.
						The actual value to match is resolved at the start of the start of the 
						enclosing <a href="#ruleset">ruleset</a> or other munger.
					</p>
					<MungeExample input="f->m:buffer" munger={
						`
						(
							/(\w)->(\w)/ => fx { 
								$1 set(find) 
								$2 set(replace) 
							}
							/.+/ => 
								! we use this extra indirection
								! to delay resolution of get(find)
								get(find) => { get(replace) }
						)`} />
				</section>
				<h2 id="literal">Literal</h2>
				<section>
					<p>
						A <dfn>literal munger</dfn> is the simplest type of munger.  
						It's a string literal in double quotes.
						Single quotes are for locators.
						Double quotes are for mungers.
						At the top level, this is generally useless.
						Check out this example.  Every input becomes the same output.   
					</p>
					<MungeExample input="whatever, a bunch of text" munger={`"useless"`} />
				</section>
				<h2 id="ruleset">Rulesets</h2>
				<section>
					<p>
						A <dfn>ruleset</dfn> consists of one or more rules.
						By default, they are applied in document order.
						Munging proceeds from beginning to end of the input document.
						Matching rules are applied for each match encountered.
						A default ruleset consists of zero or more rules contained in <code>( [rules here] )</code>.
						An empty set of parenthesis is a no-op munger, which is occasionally useful.
					</p>
					<MungeExample
						input={`
							1. abc
							2. ab
							3. bc`}
						munger={`
							(
								'ab' => "X"
								'bc' => "Y"
							)`}/>
				</section>
				<h2 id="first">First-only rulesets</h2>
				<section>
					<p>
						A <dfn>first-only ruleset</dfn> applies its rules differently.
						It only applies only a certain number of rules, scanning in document order.
						After the specified number of rule applications are done, no further munging is performed.
						First-only rulesets are expressed by adding a preceding number: <code>1( [rules here] )</code>
					</p>
					<MungeExample input="foo foo foo" munger={`2( 'foo' => "bar" )`}/>
				</section>
				<h2 id="sequence">Sequences</h2>
				<section>
					<p>
						A <dfn>sequence</dfn> is an orderd list of mungers.
						Rather than scanning the document from start to end, a sequence iterates over rules in declaration order.
						It applies each munger to the entire document in declaration order.
						This means that subsequent mungers are able to see the output from the previous rules.
						These use a <code>#</code> prefix.
					</p>
					<MungeExample input="food" munger={`
						#( 
							'foo' => "bar"
							'ard' => "icycle"
						)`} />
					<p>
						It's also possible to combine a sequenced and first-only ruleset this way.
						These apply only the first rule to match, in declaration order, instead of document order.  
						The prefix is like <code>1#</code>.
					</p>
				</section>
				<h2 id="repeater">Repeaters</h2>
				<section>
					<p>
						A <dfn>repeater</dfn> is a decorated munger.
						You can precede any other munger with a <code>@</code>, and it will become a repeater.
						<code>@</code> like a wheel to me, just rolling and rolling.
						A repeater applies repeatedly to its input until a fixed point is reached.
						It's not too hard to make an infinite loop with these.
					</p>
					<MungeExample input="a{{}{{}}}b" munger={`@'{}' => ""`} />
				</section>
				<h2 id="last">Last match</h2>
				<section>
					<p>
						You can apply a rule only to the last match of its locator using a <dfn>last</dfn>.
						This can only be applied to a single rule.
					</p>
					<MungeExample input="foo foo foo" munger={`last('foo' => "bar")`}/>
				</section>
				<h2 id="comment">Comments</h2>
				<section>
					<p>
						You can add a <dfn>comment</dfn> to the end of any line in a munger.
						Comments start with a <code>!</code>.
					</p>
					<MungeExample input="loool             " munger={`/\\s+$/ => "" ! trailing whitespace`} />
				</section>
				<h2 id="proc">Procs</h2>
				<section>
					<p>
						Now it's time for the big guns.
						A <dfn>proc</dfn> is an arbitrary piece of logic inside of <code>{`{ }`}</code> curly braces.
						It's a concatenative stack-based language fully enclosed inside the text munging language.
						Ok, let's just look at some code.
					</p>
					<MungeExample input="Hello World"
						munger={`
							( ! toggle case
								/[a-z]/ => { _ upper }
								/[A-Z]/ => { _ lower }
							)`} />
					<p>
						There's a <a href="?proc">whole separate page</a> about the details of the proc language.
					</p>
				</section>
				<h2 id="effects">Side effects</h2>
				<section>
					<p>
						There's a <dfn>side effect</dfn> decoration you can use on any munger if you only want to use it for side effects.
						This is generally most useful if you have procs that are setting variables or something that you're going to use later.
						Precede any munger with `fx`, and it won't actually do any replacement.
					</p>
					<MungeExample 
						input={`
							first
							middle
							last`}
						munger={`
							#(
								fx /.+/ => { _ len set(lastlen) } ! matches every line
								1( /$/m => { " Length of last line: " get(lastlen) } )
							)`} />
				</section>
				<h2 id="named">Named munger declarations</h2>
				<section>
					<p>
						Prior to the munger, you can create one or more <dfn>named munger declarations</dfn>.
						These can be referred to later.
						These are <code>def(name)</code> followed by a munger.
						You can invoke them using <code>do(name)</code>.
					</p>
					<MungeExample input = "abc123def567"
						munger = {`
							def(paren) { "(" _ ")" }
							( ! enclose runs in parens
								/\\d+/     => do(paren)
								/[a-z]+/i => do(paren)
							)`} />
				</section>
				<p>
					Did you know?  
					You can press <kbd>Ctrl</kbd> + <kbd>S</kbd> to generate a permalink.
					<kbd>Ctrl</kbd> + <kbd>/</kbd> is block comment.
					<kbd>Tab</kbd> is block indent.
					<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>F</kbd> is munger auto-indent.
				</p>
			</article>
		);
	}
}
