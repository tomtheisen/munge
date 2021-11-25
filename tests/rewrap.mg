#(
    /[ \t]+$/m => "" ! strip trailing spaces
    (                ! join para lines
        /\n{2,}/ => ()
        /\n(?!$)/ => " "
    )
    /(?=.{61})(.{1,59}\S)[ \t]+/ => { $1 "\n" }
)