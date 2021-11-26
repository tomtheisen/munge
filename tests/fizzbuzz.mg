def(n) { i 1 + }
def(ismul) {swap % 0 =}
def(check) { do(n) do(ismul) when }
#(
    all => {"X" _ rep}
    /./ => {
        "Fizz" 3 do(check)
        "Buzz" 5 do(check)
        cat 
        do(n)
        or
        "\n"
    }
)
