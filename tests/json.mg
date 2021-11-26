def(indent) { " " get(depth) 2 * rep }
(
    /\s/ => ""
    /"(?:\\.|[^"\\])*?":/ => { _ " " }
    /"(?:\\.|[^"\\])*?"/ => ()
    ',' => { ",\n" do(indent) }
    /{|\[/ => { 
        get(depth) 1 + set(depth) drop 
        _ "\n" do(indent)
    }
    /}|\]/ => {
        get(depth) 1 - set(depth) drop 
        "\n" do(indent) _ 
    }
)