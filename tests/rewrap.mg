#(
    /\r/ => { _ set(r) clear }
    /[ \t]+$/m => ""
    ( ! join para lines
        /\n{2,}/ => { _ } ! noop
        /\n/ => " "
    )
    /$/m => " "
    /(?=.{61})(.{1,59}\S)[ \t]+/ => { $1 "\n" }
    /[ \t]+$/m => ""
    /$/ => "\n"
    '\n' => { get(r) _ }
)