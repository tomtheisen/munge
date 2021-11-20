export var Which;
(function (Which) {
    Which[Which["FirstOnly"] = 0] = "FirstOnly";
    Which[Which["AllSimultaneously"] = 1] = "AllSimultaneously";
})(Which || (Which = {}));
export var When;
(function (When) {
    When[When["Once"] = 0] = "Once";
    When[When["UntilStable"] = 1] = "UntilStable";
})(When || (When = {}));
function nextMatch(input, start, locator) {
    if (typeof locator === 'string') {
        const index = input.indexOf(locator, start);
        if (index >= 0)
            return {
                index,
                value: locator,
                groups: []
            };
    }
    if (locator instanceof RegExp) {
        if (!locator.global)
            throw "gotta be global";
        locator.lastIndex = start;
        const match = locator.exec(input);
        if (match) {
            return {
                index: match.index,
                value: match[0],
                groups: match.slice(1),
            };
        }
    }
}
export function munge(input, replacement) {
    let output = [];
    apply(input, replacement, output);
    return output.join('');
}
function apply(input, replacement, output) {
    if (typeof replacement === 'string')
        output.push(replacement);
    if (replacement instanceof Ruleset)
        replacement.apply(input, output);
}
export class Ruleset {
    constructor(which, when, ...rules) {
        this.which = which;
        this.when = when;
        this.rules = rules;
    }
    applyOnce(input, output) {
        let searchIndex = 0;
        for (let i = 0; searchIndex < input.length; ++i) {
            let matches = this.rules
                .map((r, index) => ({ index, match: nextMatch(input, searchIndex, r.find) }))
                .filter(m => { var _a; return (_a = m.match) === null || _a === void 0 ? void 0 : _a.value; });
            if (matches.length === 0)
                break;
            let { index, match } = matches.reduce((a, b) => a.match.index < b.match.index ? a : b);
            if (!match)
                break;
            let { replace } = this.rules[index];
            output.push(input.substring(searchIndex, match.index));
            apply(match.value, replace, output);
            searchIndex = match.index + match.value.length;
            if (this.which === Which.FirstOnly)
                break;
        }
        output.push(input.substring(searchIndex));
    }
    stabilize(input) {
        for (let output;; input = output.join('')) {
            this.applyOnce(input, output = []);
            if (output.length == 1)
                return output[0];
        }
    }
    apply(input, output) {
        switch (this.when) {
            case When.Once:
                this.applyOnce(input, output);
                break;
            case When.UntilStable:
                output.push(this.stabilize(input));
                break;
        }
    }
}
