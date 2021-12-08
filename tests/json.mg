def(nl) {                 ! macro definition for next line
    "\n"
    get(depth) times {"  "}! repeat indent string
}
(
    /\s/ => ""            ! strip pre-existing whitespace
    /"(?:\\.|.)*?"/ => () ! don't touch string literals
    ':' => ": "           ! single space after colon
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