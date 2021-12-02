def(ismul) {% 0 =}
#(
    {"X" _ rep}
    /./ => {
        inc(n)
        get(n) 3 do(ismul) if {"Fizz"}
        get(n) 5 do(ismul) if {"Buzz"}  
        cat get(n) or
        "\n"
    }
)
