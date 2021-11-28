export function makePermalink(munger: string, input?: string) {
    const state = {m: munger, i: input};
    let chars = JSON.stringify(state).split('')
        .map(c => c.codePointAt(0)! > 127 
            ? "\\u" + c.codePointAt(0)?.toString(16).padStart(4, '0')
            : c );
    const permalink = '#' + btoa(chars.join(''));
    return permalink;
}

export type PermalinkState = { munger: string, input: string };
export function decodePermalink(permalink: string): PermalinkState {
    permalink = permalink.replace(/^#/, "");
    const state = JSON.parse(atob(permalink));
    return { munger: state.m, input: state.i };
}
