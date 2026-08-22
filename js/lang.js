var LANG_STORE_KEY = 'nm-app-lang';

function getAppLang() {
  try { return localStorage.getItem(LANG_STORE_KEY) || 'en'; } catch (e) { return 'en'; }
}

var appLang = getAppLang();
var filterLang = appLang;

function setAppLang(code) {
  try { localStorage.setItem(LANG_STORE_KEY, code); } catch (e) {}
  appLang = code;
  filterLang = code;
  window._mapLang = code;
  if (window.render && typeof window.render.init === 'function') { window.render.init(); }
}

function setFilterLang(code) {
  // [future] per-page language override - disabled, filter follows appLang
  // filterLang = code;
  // appLang = code;
  // window._mapLang = code;
  // try { localStorage.setItem(LANG_STORE_KEY, code); } catch (e) {}
  filterLang = appLang;
}