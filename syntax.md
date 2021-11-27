```
type Locator = string | RegExp;
type Rule = { find: Locator, replace: Munger };
export type Munger = string | Ruleset | Proc| Repeater | Sequence | Last;
export enum Which { FirstOnly, All }
```
* Mungers (basically string => string)
    * String `"foo"`
    * Rule `locator => munger`
        * Locator
            * String `'foo'`
            * Regexp `/bar/[ism]*`
            * Wholesale `all`
        * Munger
    * Ruleset 
        * All `( )`
        * FirstOnly `1( )`
        * Sequence All `#( )`
        * Sequence FirstOnly `1#( )`
    * Decorators
        * Repeater `@ ...`
        * Side-effect `fx ...`
        * Consume `eat ...`
    * Last `last(rule)` (applies a rule once to the locator's last match)
    * Proc `{ get(x) "lol" }`
        * Reference `do(name)` defined by `def(name) ...`
        * foreach `for(arrname) { ... }`
        * `if { ... } [{ ... }]`
    * Named call `do(name)`
* Comments `! comment here`
* Named munger `def(name) ....`

