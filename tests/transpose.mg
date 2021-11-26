#(
    /.+/ => fx { _ push(lines) }
    /\n.*/s => ""
    /./ => {
        i set(col) drop
        for(lines) {
            get(col) skip
            1 take
        }
        "\n"
    }
)