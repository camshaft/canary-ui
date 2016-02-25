module.exports = UI;

function UI(store, target) {
  if (!(this instanceof UI)) return new UI(store, target);
  this.store = store;
  this.target = target || document.body;
}

UI.prototype = {
  open: function() {
    var el = this._el;
    if (!el) {
      el = this._el = this.render();
      require.ensure(['./lib/draggable', '!!style-loader!css-loader!./canary.css'], function(require) {
        require('!!style-loader!css-loader!./canary.css');
        (require('./lib/draggable'))(el);
      });
    }
    var target = this.target;
    if (!target.contains(el)) target.appendChild(el);
    el.style.display = '';
    return this;
  },
  close: function() {
    this._el.style.display = 'none';
    return this;
  },
  render: function() {
    var list = this._ul(this.store);

    return DOM('div', {
      id: 'canary-ui'
    }, [
      this._reset(),
      this._close(),
      this._minimize(),
      list
    ]);
  },
  sessionStorage: function() {
    var overrides = {};

    try {
      this._storage = window.sessionStorage;
      overrides = JSON.parse(this._storage.canary || '{}');
    } catch (e) {}

    for (var k in overrides) {
      this.store.override(k, overrides[k]);
    }

    return this;
  },
  hashchange: function() {
    var self = this;
    function onChange() {
      self._onhashchange(location.hash);
    }
    onChange();

    // Set a timeout in case the element gets ripped out of the DOM
    setTimeout(onChange, 1000);

    window.addEventListener('hashchange', onChange);
    return self;
  },
  set: function(feature, variant) {
    this.store.override(feature, variant);
    if (this._storage) this._storage.canary = JSON.stringify(this.store._overrides);
    return this;
  },
  reset: function() {
    this.store.reset();
    if (this._storage) delete this._storage.canary;
  },
  _onhashchange: function(hash) {
    if (hash.indexOf('#canary') !== 0) return;
    var parts = hash.split('=');
    if (parts[0] === '#canary') this.open();
    try {
      var overrides = JSON.parse(parts[1] || '{}');
      for (var k in overrides) {
        this.set(k, overrides[k]);
      }
    } catch(e) {}
  },
  _reset: function() {
    var self = this;
    return a('reset', 'reset', function() {
      self.reset();
    });
  },
  _close: function() {
    var self = this;
    return a('action close', '×', function() {
      self.close();
    });
  },
  _minimize: function() {
    var self = this;
    var minimize = a('action minimize', '_', function() {
      var el = self._el;
      var minimized = el.className === 'minimized';
      el.className = minimized ? '' : 'minimized';
      minimize.innerText = minimized ? '_' : '+';
    });
    return minimize;
  },
  _ul: function(store) {
    var self = this;
    var ul = DOM('ul');

    function onChange() {
      store.features().forEach(function(feature) {
        ul.appendChild(self._li(feature));
      });
    }

    store.on('change', function() {
      ul.innerHTML = '';
      onChange();
    });

    onChange();

    return ul;
  },
  _li: function(feature) {
    return DOM('li', {}, [
      DOM('label', {}, [
        DOM('span', {innerText: feature.name}),
        this._input(feature)
      ])
    ]);
  },
  _input: function(feature) {
    var variants = feature.variants;
    return variants.length === 2 && typeof variants[0].value === 'boolean' ?
      this._checkbox(feature) :
      this._select(feature);
  },
  _checkbox: function(feature) {
    var self = this;
    var el = DOM('input', {
      type: 'checkbox',
      checked: feature.selected,
      onchange: function() {
        self.set(feature.name, !!el.checked);
      }
    });
    return el;
  },
  _select: function(feature) {
    var self = this;
    var el = DOM('select', {
      onchange: function() {
        self.set(feature.name, el.value);
      }
    }, feature.variants.map(function(variant) {
      return DOM('option', {
        value: variant.value,
        selected: variant.isSelected,
        innerText: variant.value
      })
    }));
    return el;
  }
};

function a(className, text, onclick) {
  return DOM('a', {
    className: className,
    innerText: text,
    href: 'javascript:;',
    onclick: function(evt) {
      onclick(evt)
      return false;
    }
  });
}

function DOM(name, props, children) {
  var el = document.createElement(name);
  props = props || {};
  children = children || [];
  for (var k in props) {
    el[k] = props[k]
  }
  children.forEach(function(child) {
    el.appendChild(child);
  });
  return el;
}
