

```
type Locator = string | RegExp;
type Rule = { find: Locator, replace: Munger };
export type Munger = string | Ruleset | Proc| Repeater | Sequence;
export enum Which { FirstOnly, All }
```
* Comments `! comment here`
* Mungers (basically string => string)
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
        * Reference `do(name)` defined by `def(name) ...`
        * foreach `for(arrname) { ... }`
    * Decorators
        * Repeater `@ ...`
        * Side-effect `fx ...`
        * Consume `eat ...`
    * Named call `do(name)`
* Named munger `def(name) ....`

