#(
    /.+/ => { _ cons(lines) }
    all => { "\n" join(lines) }
)

! #(
!     /.+/ => { _ "\n" get(out) len when cat get(out) cat set(out) }
!     all => { get(out) }
!     ! /\n$/ => ""
! )