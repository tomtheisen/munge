#(
    /.+/ => { _ push(lines) }
    { 
        0 for(lines) { _ len max }      ! max input row length is left on the stack 
        times {                         ! output row iteration
            i set(row) drop
            for(lines) {                ! output column iteration
                _ get(row) skip 1 take  ! get character at index
                1 lpad                  ! replace "" with " "
            }
            "\n"
        }
    }
    /\s+$/m => ""       ! trim line endings
)