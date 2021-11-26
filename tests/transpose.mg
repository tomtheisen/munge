#(
    /.+/ => fx { _ push(lines) }
    /\n.*/s => { 0 set(col) clear }
    /./ => {
        for(lines) {
            get(col) skip
            1 take
        }
        "\n"
        get(col) 1 + set(col) drop
    }
)