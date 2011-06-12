exports.inherit = (x) -> f = (->); f.prototype = x; new f # JavaScript's prototypical inheritance
exports.trampoline = (x) -> (while typeof x is 'function' then x = x()); x # a continuation-passing style helper
