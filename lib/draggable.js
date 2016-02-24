module.exports = function(el) {
  var fn = onMouse.bind(null, el)
  el.addEventListener('mousedown', fn);
  el.addEventListener('touchstart', fn);
};

function onMouse(el, evt) {
  var x_elem = el.offsetLeft + evt.offsetX;
  var y_elem = el.offsetTop + evt.offsetY;
  var fixed = window.getComputedStyle(el).getPropertyValue('position') === 'fixed';

  setSelect(document.body, 'none');

  function onMove(evt) {
    var x_pos = document.all || fixed ? window.event.clientX : evt.pageX;
    var y_pos = document.all || fixed ? window.event.clientY : evt.pageY;
    console.log(x_pos, y_pos);
    el.style.transform = 'translate(' + (x_pos - x_elem) + 'px, ' + (y_pos - y_elem) + 'px)';
  }

  function onUp() {
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('touchmove', onMove);
    document.removeEventListener('mouseup', onUp);
    document.removeEventListener('touchend', onUp);
    setSelect(document.body, '');
  }

  document.addEventListener('mousemove', onMove);
  document.addEventListener('touchmove', onMove);
  document.addEventListener('mouseup', onUp);
  document.addEventListener('touchend', onUp);
}

function setSelect(el, value) {
  ['-webkit-user-select',
   '-khtml-user-select',
   '-moz-user-select',
   '-ms-user-select',
   'user-select'].forEach(function(key) {
    el.style[key] = value;
  })
}
