#(
    /.+/ => fx { _ push(lines) }
    /\n.*/s => ""
    fx {0 set(col)}
    /./ => {
        for(lines) {
            _ get(col) skip 1 take
        }
        inc(col)
        "\n"
    }
)