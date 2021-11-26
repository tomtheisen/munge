def(nextline) { "\n" " " get(depth) 2 * rep }
(
    /\s/ => ""
    /"(?:\\.|[^"\\])*?":/ => { _ " " }
    /"(?:\\.|[^"\\])*?"/ => ()
    ',' => { "," do(nextline) }
    /{|\[/ => { 
        inc(depth)
        _ do(nextline)
    }
    /}|\]/ => {
        dec(depth)
        do(nextline) _ 
    }
)