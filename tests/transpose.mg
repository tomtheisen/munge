#(
    /.+/ => fx { _ push(lines) }
    /\n.*/s => ""
    /./ => {
        i set(col) drop
        for(lines) {
            _ get(col) skip 1 take
        }
        "\n"
    }
)