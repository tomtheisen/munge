#(
    /.+/ => { _ cons(lines) }
    /^.*/s => { "\n" join(lines) }
)