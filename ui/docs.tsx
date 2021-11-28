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
                        <li>Rule</li>
                        <li>Ruleset</li>
                        <li>String</li>
                        <li>Repeater</li>
                        <li>Repeater decorator</li>
                        <li>Side-effect decorator</li>
                        <li>Last decorator</li>
                        <li>Proc</li>
                        <li>Named munger reference</li>
                    </ul>
                </section>
                <h2 id="rule">Rules</h2>
                <section>
                    <p>
                        A <dfn>rule</dfn> consists of a locator and a munger.
                        They go in that order with <code>=&gt;</code> in between them.
                    </p>
                </section>
                <h2 id="locator">Locator</h2>
                <section>
                    <p>
                        A <dfn>locator</dfn> finds some particular substring of the input to manipulate.
                        There are two kinds.  For now.  I got some ideas about combinators.
                        But anyway.  The simplest locator is the literal.  
                        It's enclosed in single quotes.
                    </p>
                    <MungeExample input={"Once you munge,\nyou never go back"} munger={`' ' => ""`} />
                    <p>
                        There are also regular expression locators, using mostly javascript syntax.
                        The <code>ism</code> flags are supported. 
                        The <code>g</code> flag is implied.
                    </p>
                    <MungeExample input="abc 123 def 456" munger={`/\\d/ => "_"`} />
                </section>
                <h2 id="munger-literal">Literal</h2>
                <section>
                    <p>
                        This is the simplest type of munger.  
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
                        There are a couple of ways to change the behavior of a ruleset.
                        A <dfn>first-only ruleset</dfn> only applies the the first rule that matches, scanning in document order.
                        After that rule is applied, no further munging is performed.
                        First-only rulesets are expressed by adding a preceding 1: <code>1( [rules here] )</code>
                    </p>
                    <MungeExample
                        input={`
                            1. abc
                            2. ab
                            3. bc`}
                        munger={`
                            1(
                                'ab' => "X"
                                'bc' => "Y"
                            )`}/>
                </section>
                <h2 id="sequence">Sequenced rulesets</h2>
                <section>
                    <p>
                        Another way of modifying the behavior of a ruleset is to make a <dfn>sequenced ruleset</dfn>.
                        Rather than scanning the document from start to end, a sequenced ruleset iterates over rules in declaration order.
                        It applies each rule to the entire document in declaration order.
                        This means that subsequent rules are able to see the output from the previous rules.
                        These use a <code>#</code> prefix.
                    </p>
                </section>
                <h3 id="last">Last</h3>
                <section>
                    <p>
                        A <dfn>locator</dfn>
                    </p>
                </section>
                <h2 id="repeater">Repeaters</h2>
                <h2 id="comment">Comments</h2>
                <h2 id="proc">Procs</h2>
                <h2 id="effects">Side effects</h2>
                <h2 id="named">Named munger declarations</h2>
            </article>
        );
    }
}
