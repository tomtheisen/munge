```
type Locator = string | RegExp;
type Rule = { find: Locator, replace: Munger };
export type Munger = string | Ruleset | Proc| Repeater | Sequence;
export enum Which { FirstOnly, All }
```

* Mungers
    * String `"foo"`
    * Ruleset 
        * All `doc ( )` short: `( )`
        * FirstOnly `first doc ( )` short: `1( )`
        * Locator
            * String `"foo"`
            * Regexp `/bar/`
        * Munger
    * Sequence
        * All `seq ( )` short: `#( )`
        * FirstOnly `first seq ( )` short: `1#( )`
    * Repeater `stabilize ...` short: `@ ...`
    * Proc `{ get(x) "lol" }`

```
input (
    "foo" => "bar",
    /bar/ => { len },
)
```