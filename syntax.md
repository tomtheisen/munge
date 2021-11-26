
```
type Locator = string | RegExp;
type Rule = { find: Locator, replace: Munger };
export type Munger = string | Ruleset | Proc| Repeater | Sequence;
export enum Which { FirstOnly, All }
```
* Comments `! comment here`
* Mungers
    * String `"foo"`
    * Ruleset 
        * All `( )`
        * FirstOnly `1( )`
        * Sequence All `#( )`
        * Sequence FirstOnly `1#( )`
        * Locator
            * String `'foo'`
            * Regexp `/bar/[ism]*`
            * Wholesale `all`
        * Munger
    * Last `last(rule)`
    * Proc `{ get(x) "lol" }`
        * Reference `munger(name)` defined by `define(name) ...`
        * foreach `for(name) { ... }`
    * Decorators
        * Repeater `@ ...`
        * Side-effect `fx ...`
        * Consume `eat ...`
* Named proc `define(name) ....` (or is it named munger?)


```
(
    "foo" => "bar",
    /bar/ => { len },
)
```