def(check) { i 1 + swap % 0 = when }
#(
    all => {"X" _ rep}
    /./ => {
        "Fizz" 3 i 1 + swap % 0 = when
        "Buzz" 5 i 1 + swap % 0 = when
        cat 
        i 1 + 
        or
        "\n"
    }
)
