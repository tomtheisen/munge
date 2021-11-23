```
type Locator = string | RegExp;
type Rule = { find: Locator, replace: Munger };
export type Munger = string | Ruleset | Proc| Repeater | Sequence;
export enum Which { FirstOnly, All }
```

* Mungers
    * String `"foo"`
    * Ruleset 
        * All `input ( )`
        * FirstOnly `first input ( )`
        * Locator
            * String `"foo"`
            * Regexp `/bar/`
        * Munger
    * Sequence
        * All `rule ( )`
        * FirstOnly `first rule ( )`
    * Repeater `rep ...`
    * Proc `{ get(x) "lol" }`

```
input (
    "foo" => "bar",
    /bar/ => { len },
)
```