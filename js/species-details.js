// species-details.js — standalone Species details page. Reads ?sci= and renders the scientific name + common names per language.

function speciesPageInit() {
  var sci = new URLSearchParams(location.search).get('sci') || '';
  document.getElementById('screen').innerHTML =
    '<div class="status-bar"><span>9:41</span><span><i class="ti ti-wifi"></i> <i class="ti ti-battery-2"></i></span></div>' +
    '<div class="page active">' +
      '<div class="topbar"><button class="back-btn" type="button" onclick="history.back()"><i class="ti ti-arrow-left"></i></button><span class="topbar-title">Species details</span></div>' +
      '<div class="scrollable"><div class="species-scroll">' +
        '<div class="species-hero"><div class="species-sci">' + (sci || '—') + '</div><div class="species-sci-sub">Scientific name</div></div>' +
        '<div class="species-section-title">Common names</div>' +
        '<div class="species-names-card" id="species-names-card"></div>' +
      '</div></div>' +
    '</div>';
  renderSpeciesNames(sci);
}

function renderSpeciesNames(sci) {
  var card = document.getElementById('species-names-card');
  if (!card) return;
  if (!sci) {
    card.innerHTML = '<div class="species-empty">No species name provided.</div>';
    return;
  }
  var db = storage.get('treeNames') || [];
  var entry = null;
  for (var i = 0; i < db.length; i++) {
    if (db[i][sci]) { entry = db[i][sci]; break; }
  }
  if (!entry) {
    card.innerHTML = '<div class="species-empty">No detail found for this species.</div>';
    return;
  }
  var rows = [];
  var lang_label = window.__LANGS || {};
  Object.keys(entry).forEach(function (lang) {
    var names = entry[lang] || [];
    if (!Array.isArray(names) || !names.length) return;
    var label = (lang_label[lang] && (lang_label[lang].name || lang_label[lang].en)) || lang;
    rows.push('<div class="species-names-row"><span class="species-lang">' + escHtml(label) + '</span><span class="species-names">' + escHtml(names.join(', ')) + '</span></div>');
  });
  card.innerHTML = rows.length ? rows.join('') : '<div class="species-empty">No common names recorded for this species.</div>';
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.render = { init: speciesPageInit };