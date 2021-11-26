def(n) { i 1 + }
def(ismul) {% 0 =}
#(
    all => {"X" _ rep}
    /./ => {
        do(n) 3 do(ismul) if {"Fizz"}
        do(n) 5 do(ismul) if {"Buzz"}  
        cat do(n) or
        "\n"
    }
)
