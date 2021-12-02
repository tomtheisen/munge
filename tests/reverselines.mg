#(
    /.+/ => { _ cons(lines) }
    { "\n" join(lines) }
)

! #(
!     /.+/ => { _ "\n" get(out) when cat get(out) cat set(out) }
!     all => { get(out) }
!     ! /\n$/ => ""
! )