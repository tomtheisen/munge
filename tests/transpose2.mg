#(
    /.+/ => { _ push(lines) }
    { 
        0 set(row)
		for(lines) { _ len max }        ! max input row length is left on the stack 
        times {                         ! output row iteration
            for(lines) {                ! output column iteration
                _ get(row) skip 1 take  ! get character at index
                1 lpad                  ! replace "" with " "
            }
			inc(row)
            "\n"
        }
    }
    /\s+$/m => ""       ! trim line endings
)