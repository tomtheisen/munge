def(n) { i 1 + }
def(check) { do(n) swap % 0 = when }
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
