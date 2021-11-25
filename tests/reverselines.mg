#(
    /.+/ => { _ cons(lines) }
    all => { "\n" join(lines) }
)