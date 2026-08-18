var fontLevels = [ { label:'S', mul:0.85 }, { label:'M', mul:1 }, { label:'L', mul:1.15 } ];
var fontSizeLevel = 1;

function toggleNotif(btn) {
  var on = btn.getAttribute('aria-checked') === 'true';
  btn.setAttribute('aria-checked', String(!on));
}

function fontSize(dir) {
  if (dir === 'up') {
    if (fontSizeLevel < 2) { fontSizeLevel++; }
  } else {
    if (fontSizeLevel > 0) { fontSizeLevel--; }
  }
  applyFontSize();
}

function applyFontSize() {
  var lv = fontLevels[fontSizeLevel];
  document.getElementById('fs-val').textContent = lv.label;
  document.getElementById('fs-minus').disabled = fontSizeLevel === 0;
  document.getElementById('fs-plus').disabled = fontSizeLevel === 2;
  document.documentElement.style.fontSize = (15 * lv.mul) + 'px';
}

function pickLang(tile, name) {
  document.querySelectorAll('.lang-tile').forEach(function(t){ t.classList.remove('sel'); });
  tile.classList.add('sel');
  alert('Language set to ' + name);
}