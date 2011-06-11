exports.inherit = (x) -> f = (->); f.prototype = x; new f # JavaScript's prototypical inheritance
