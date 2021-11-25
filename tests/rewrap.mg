#(                          ! apply rules in order
    /[ \t]+$/m => ""        ! strip trailing spaces
    /.\n./ => /\n/ => " "   ! join paragraph lines
    @1(                     ! reflow - repeatedly apply to first match
        /.{60}./            ! any run too long
        => /\s\S+$/         ! last whitespace to the end
        => /\s/             ! just that whitespace
        => "\n"             ! becomes a newline
    )
)