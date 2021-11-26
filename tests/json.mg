def(nl) {                 ! macro definition for next line
    "\n"
    "  " get(depth) rep   ! repeat indent string
}
(
    /\s/ => ""            ! strip pre-existing whitespace
    /"(?:\\.|.)*?"/ => () ! don't touch string literals
    ':' => ": "           ! single space after comma
    ',' => { _ do(nl) }   ! newline after comma
    /{|\[/ => {           ! open braces
        inc(depth)
        _ do(nl)
    }
    /}|\]/ => {           ! close braces
        dec(depth)
        do(nl) _ 
    }
)