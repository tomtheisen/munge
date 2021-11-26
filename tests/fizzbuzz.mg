#(
    all => {"X" _ rep}
    /./ => {
        "Fizz" i 1 + 3 % 0 = when
        "Buzz" i 1 + 5 % 0 = when
        cat set(fb)
        i 1 + 
        get(fb) if
        "\n"
    }
)