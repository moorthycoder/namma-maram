var fontLevels = [ { label:'S', mul:0.85 }, { label:'M', mul:1 }, { label:'L', mul:1.15 } ];
var fontSizeLevel = 1;

function toggleAbout(btn) {
  var on = btn.getAttribute('aria-checked') === 'true';
  btn.setAttribute('aria-checked', String(!on));
  document.getElementById('about-panel').classList.toggle('open', !on);
}

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

function renderLangGrid() {
  var langs = storage.get('languages') || [];
  var currentLang = getAppLang();
  var grid = document.getElementById('lang-grid');
  grid.innerHTML = langs.map(function (item) {
    var selClass = (item.code === currentLang) ? ' sel' : '';
    return '<div class="lang-tile' + selClass + '" onclick="pickLang(this,\'' + item.code + '\')"><b>' + item.script + '</b><small>' + item.name + '</small></div>';
  }).join('');
}

function pickLang(tile, code) {
  document.querySelectorAll('#lang-grid .lang-tile').forEach(function(t){ t.classList.remove('sel'); });
  tile.classList.add('sel');
  setAppLang(code);
}

function freshUpSampleData() {
  storage.freshUp();
  alert('Sample data restored.');
}

window.render = {
  init: function () {
    filterLang = appLang;
    renderLangGrid();
  }
};