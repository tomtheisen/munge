(
    ! various string literals
    /(["'`])(?:\\.|.)*?\1/s => ()

    ! comments
    /\/\/.*/ => ""
    /\/\*.*?\*\//s => ""
)