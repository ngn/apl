(function () {

    var modules = {};

    window.require = function (name) {
        var m = modules[name];
        if (!m) {
            throw Error('Cannot find module ' + JSON.stringify(m));
        }
        if (m.state === 'unloaded') {
            m.state = 'beingloaded';
            m.exports = m.init(m.exports, window.require);
            m.state = 'loaded';
        }
        return m.exports;
    };

    window.defModule = function (name, init) {
        if (modules[name]) {
            throw Error('Redefinition of module ' + JSON.stringify(name));
        }
        modules[name] = {state: 'unloaded', init: init, exports: {}};
    };

})();
