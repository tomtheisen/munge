def(r) get(target) => "_"
/(\w):(\w+)/ => {  
    $1 set(target) drop
    $2 do(r)
}