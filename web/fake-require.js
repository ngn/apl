(function () {

    var modules = {};

    window.require = function (name) {
        var m = modules[name];
        if (!m) {
            throw Error('Cannot find module ' + JSON.stringify(m));
        }
        if (m.state === 'unloaded') {
            m.state = 'beingloaded';
            m.instance = m.init(m.instance, window.require);
            m.state = 'loaded';
        }
        return m.instance;
    };

    window.defModule = function (name, init) {
        if (modules[name]) {
            throw Error('Redefinition of module ' + JSON.stringify(name));
        }
        modules[name] = {state: 'unloaded', init: init, instance: {}};
    };

})();
