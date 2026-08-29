var LANG_STORE_KEY = 'nm-app-lang';

function goNav(page) {
  document.getElementById('app-frame').src = page;
}

function openLangPopup() { document.getElementById('lang-popup').classList.add('open'); }
function closeLangPopup() { document.getElementById('lang-popup').classList.remove('open'); }

function renderLangGrid() {
  var currentLang = getAppLang();
  var langs = storage.get('languages') || [];
  var grid = document.getElementById('lang-grid');
  grid.innerHTML = langs.map(function (item) {
    var selClass = (item.code === currentLang) ? ' sel' : '';
    return '<div class="lang-tile' + selClass + '" onclick="pickHomeLang(this,\'' + item.code + '\')"><b>' + item.script + '</b><small>' + item.name + '</small></div>';
  }).join('');
}

function pickHomeLang(tile, code) {
  document.querySelectorAll('#lang-grid .lang-tile').forEach(function (t) { t.classList.remove('sel'); });
  tile.classList.add('sel');
  setAppLang(code);
  closeLangPopup();
  var frame = document.getElementById('app-frame');
  try {
    if (frame && frame.contentWindow && typeof frame.contentWindow.setAppLang === 'function') {
      frame.contentWindow.setAppLang(code);
    }
  } catch (e) {}
}

window.render = {
  init: function () {
    filterLang = appLang;
    renderLangGrid();
  }
};

function clearSessionOnClose() { try { sessionStorage.clear(); } catch(e){} }
window.addEventListener('beforeunload', clearSessionOnClose);
window.addEventListener('pagehide', clearSessionOnClose);

if (window.top === window.self) {
  window.render.init();
}