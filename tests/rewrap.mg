#(
    /[ \t]+$/m => ""            ! strip trailing spaces
    /(.)\n(?=.)/ => { $1 " " }  ! join para lines
    /(?=.{61})(.{1,59}\S)[ \t]+/ => { $1 "\n" } ! reflow
)