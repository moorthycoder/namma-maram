// append-a-tree-name.js — standalone flow injected into #screen. Reads tree names from storage and appends new tree names.
// Entry format: { "<scientificName>": { en: [], ta: [], te: [], ... }, "variety": [] }

var appendTreeNameCSS = "\n\
  .app-name-group{display:flex;flex-direction:column;gap:8px;}\n\
  .app-name-lbl{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}\n\
  .app-name-script{font-size:0.8rem;color:var(--color-text-secondary);}\n\
  .app-name-add{background:var(--color-theme-light);border:1px solid var(--color-theme);color:var(--color-theme);border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:0.8rem;line-height:1;margin-left:auto;}\n\
  .app-name-row{display:flex;align-items:center;gap:8px;}\n\
  .app-name-row .field-input{flex:1;}\n\
  .app-name-row-del{background:var(--color-background-secondary);border:0.5px solid #e6b8b8;color:#dc2626;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:0.8rem;line-height:1;}\n\
  .app-name-row-del:disabled{opacity:0.35;cursor:not-allowed;}\n\
  .success-top{background:var(--color-theme-light);padding:24px 20px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;}\n\
  .check-ring{width:58px;height:58px;border-radius:50%;background:var(--color-theme);display:flex;align-items:center;justify-content:center;animation:popIn 0.5s ease forwards;}\n\
  @keyframes popIn{0%{transform:scale(0.4);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}\n\
  .flow-scroll{padding:12px 13px;display:flex;flex-direction:column;gap:10px;min-height:100%;}\n\
";

function injectAppendTreeCSS() {
  if (document.getElementById('append-tree-name-css')) { return; }
  var style = document.createElement('style');
  style.id = 'append-tree-name-css';
  style.textContent = appendTreeNameCSS;
  document.head.appendChild(style);
}

function appendTreeName(treeName) {
  var botanicalName = treeName.scientificName || '';
  var entry = {};
  entry[botanicalName] = {};
  (storage.get('languages') || []).forEach(function (l) {
    entry[botanicalName][l.code] = (treeName.names && treeName.names[l.code]) || [];
  });
  entry.variety = [];
  var db = storage.get('treeNames') || [];
  db.push(entry);
  storage.commit('treeNames', db);
  return entry;
}

var appendTreePages = "\n\
<div class=\"page\" id=\"page-append-tree-name\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Append tree name</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Append a tree name to the database</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">Add a new tree name with its scientific name and names in each language. It will be available across the app.</div>\n\
    <div class=\"field-wrap\"><div class=\"field-label\"><i class=\"ti ti-abc\" style=\"font-size:0.8667rem\"></i> Scientific name</div><input id=\"app-scientific-name\" class=\"field-input\" type=\"text\" placeholder=\"e.g. Borassus flabellifer\" /></div>\n\
    <div id=\"app-name-fields\"></div>\n\
    <button class=\"green-btn\" onclick=\"appendTreeNameToDatabase()\"><i class=\"ti ti-database-plus\" style=\"font-size:0.9333rem\"></i> Append to database</button>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-append-tree-success\">\n\
  <div class=\"success-top\">\n\
    <div class=\"check-ring\"><i class=\"ti ti-check\" style=\"font-size:1.8667rem;color:var(--color-theme-light)\"></i></div>\n\
    <div style=\"font-size:1.1333rem;font-weight:500;color:#27500A;\">Tree name added!</div>\n\
    <div style=\"font-size:0.8rem;color:#3B6D11;text-align:center;line-height:1.5;\">The tree name has been appended to the database.</div>\n\
  </div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <button class=\"green-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-layout-dashboard\"></i> Back to dashboard</button>\n\
  </div>\n\
</div>\n";

var appendTreeNamePlaceholders = {
  en: 'Palmyra Palm',
  ta: 'பனைமரம்',
  te: 'తాటి చెట్టు',
  kn: 'ತಾಳೆಮರ',
  ml: 'കരിമ്പന',
  mr: 'ताड',
  or: 'ତାଳ ଗଛ',
  as: 'তাল গছ',
  bn: 'তাল গাছ',
  hi: 'ताड़',
  ne: 'ताड',
  si: 'තල් ගස',
  kok: 'इरोळ',
  tcy: 'ತಾರಿ'
};

function appendNameBoxHtml(placeholder) {
  return '<div class="app-name-row">' +
    '<input class="field-input app-name-inp" type="text" placeholder="' + placeholder + '" />' +
    '<button type="button" class="app-name-row-del" onclick="removeAppNameBox(this)"><i class="ti ti-minus"></i></button>' +
  '</div>';
}

function buildAppendNameFields() {
  var wrap = document.getElementById('app-name-fields');
  if (!wrap) { return; }
  var langs = (storage.get('languages') || []).slice().sort(function (a, b) {
    if (a.code === 'en') { return -1; }
    if (b.code === 'en') { return 1; }
    return a.name.localeCompare(b.name);
  });
  wrap.innerHTML = langs.map(function (l) {
    return '<div class="field-wrap app-name-group" data-lang="' + l.code + '">' +
      '<div class="field-label app-name-lbl"><i class="ti ti-language" style="font-size:0.8667rem"></i> ' + l.name + ' <span class="app-name-script">' + l.script + '</span><button type="button" class="app-name-add" onclick="addAppNameBox(this)"><i class="ti ti-plus"></i></button></div>' +
      appendNameBoxHtml(appendTreeNamePlaceholders[l.code] || ('Type in ' + l.name)) +
    '</div>';
  }).join('');
  wrap.querySelectorAll('.app-name-group').forEach(syncDelButtons);
}

function addAppNameBox(btn) {
  var group = btn.closest('.app-name-group');
  var placeholder = group.querySelector('.app-name-inp').getAttribute('placeholder');
  group.insertAdjacentHTML('beforeend', appendNameBoxHtml(placeholder));
  syncDelButtons(group);
}

function removeAppNameBox(btn) {
  var group = btn.closest('.app-name-group');
  if (group.querySelectorAll('.app-name-row').length <= 1) { return; }
  btn.closest('.app-name-row').remove();
  syncDelButtons(group);
}

function syncDelButtons(group) {
  var rows = group.querySelectorAll('.app-name-row');
  rows.forEach(function (row, index) {
    var del = row.querySelector('.app-name-row-del');
    if (del) del.disabled = rows.length <= 1;
  });
}

function appendTreeNameToDatabase() {
  var names = {};
  document.querySelectorAll('.app-name-group').forEach(function (g) {
    var vals = [];
    g.querySelectorAll('.app-name-inp').forEach(function (i) { if (i.value.trim()) { vals.push(i.value.trim()); } });
    names[g.getAttribute('data-lang')] = vals;
  });
  var payload = {
    scientificName: document.getElementById('app-scientific-name').value,
    names: names
  };
  console.log(payload);
  appendTreeName(payload);
  goTo('append-tree-success');
}

function injectAppendTreeFlow() {
  var existing = document.getElementById('page-append-tree-name');
  if (!existing) {
    var screen = document.querySelector('.screen');
    if (screen) screen.insertAdjacentHTML('beforeend', appendTreePages);
    buildAppendNameFields();
  }
}
injectAppendTreeCSS();
injectAppendTreeFlow();