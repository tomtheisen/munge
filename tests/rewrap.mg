#(                          ! apply rules in order
    /[ \t]+$/m => ""        ! strip trailing spaces
    /.\n./ => /\n/ => " "   ! join paragraph lines
    @1(                     ! reflow - repeatedly apply to first match
        /.{60}./ =>         ! any run too long
        /\s\S+$/ => /\s/ => "\n" ! last whitespace becomes a newline
    )
)