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
      this.target.appendChild(el);
      require.ensure(['./lib/draggable', '!!style-loader!css-loader!./canary.css'], function(require) {
        require('!!style-loader!css-loader!./canary.css');
        (require('./lib/draggable'))(el);
      });
    }
    el.style.display = '';
    return this;
  },
  close: function() {
    this._el.style.display = 'none';
    return this;
  },
  render: function() {
    var store = this.store;
    var list = this._ul(store);

    return DOM('div', {
      id: 'canary-ui'
    }, [
      this._reset(store),
      this._close(store),
      this._minimize(store),
      list
    ]);
  },
  hashchange: function() {
    var self = this;
    function onChange() {
      self._onhashchange(location.hash);
    }
    setTimeout(onChange, 1000);
    window.addEventListener('hashchange', onChange);
    return self;
  },
  _onhashchange: function(hash) {
    if (hash.indexOf('#canary') !== 0) return;
    this.open();
    var parts = hash.split('=');
    try {
      var overrides = JSON.parse(parts[1] || '{}');
      for (var k in overrides) {
        this.store.override(k, overrides[k]);
      }
    } catch(e) {}
  },
  _reset: function(store) {
    return a('reset', 'reset', function() {
      store.reset();
    });
  },
  _close: function(store) {
    var self = this;
    return a('action close', '×', function() {
      self.close();
    });
  },
  _minimize: function(store) {
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
    var el = DOM('input', {
      type: 'checkbox',
      checked: feature.selected,
      onchange: function() {
        feature.set(!!el.checked);
      }
    });
    return el;
  },
  _select: function(feature) {
    var el = DOM('select', {
      onchange: function() {
        feature.set(el.value);
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
