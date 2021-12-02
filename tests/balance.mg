/.+/ => #(
    /[^\(\)\[\]{}]/ => ""
    @ (
        '()' => ""
        '[]' => ""
        '{}' => ""
    )
    1(
        /.+/ => { "Unmatched: " _ }
        '' => "✔"
    )
)