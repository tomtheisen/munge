def(ismul) {% 0 =}
{ _ times {
    inc(n)
    get(n) 3 do(ismul) if {"Fizz"} {""}
    get(n) 5 do(ismul) if {"Buzz"} {""}
    cat get(n) or
    "\n"
} }
