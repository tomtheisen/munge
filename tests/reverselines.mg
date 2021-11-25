#(
    /.+/ => eat { _ push(lines) }
    ""
    /(?:)/ => { rev(lines) "\n" join(lines) }
)