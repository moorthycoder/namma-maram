// append-a-place-name.js — standalone flow injected into #screen. Reads places from storage and appends new place names.

var appendPlaceNameCSS = "\n\
  .app-name-lbl{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}\n\
  .app-name-script{font-size:0.8rem;color:var(--color-text-secondary);}\n\
  .success-top{background:var(--color-theme-light);padding:24px 20px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;}\n\
  .check-ring{width:58px;height:58px;border-radius:50%;background:var(--color-theme);display:flex;align-items:center;justify-content:center;animation:popIn 0.5s ease forwards;}\n\
  @keyframes popIn{0%{transform:scale(0.4);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}\n\
  .flow-scroll{padding:12px 13px;display:flex;flex-direction:column;gap:10px;min-height:100%;}\n\
";

function injectAppendPlaceCSS() {
  if (document.getElementById('append-place-name-css')) { return; }
  var style = document.createElement('style');
  style.id = 'append-place-name-css';
  style.textContent = appendPlaceNameCSS;
  document.head.appendChild(style);
}

function appendPlaceName(place) {
  var entry = {
    placeId: place.pinCode,
    pinCode: place.pinCode,
    placeName: place.names
  };
  var db = storage.get('places') || [];
  db.push(entry);
  storage.commit('places', db);
  return entry;
}

var appendPlaceNamePlaceholders = {
  en: 'London',
  ta: 'மதுரை',
  te: 'హైదరాబాద్',
  kn: 'ಮೈಸೂರು',
  ml: 'കൊച്ചി',
  mr: 'मुंबई',
  or: 'ପୁରୀ',
  as: 'গুৱাহাটী',
  bn: 'কলকাতা',
  hi: 'वाराणसी',
  ne: 'काठमाडौं',
  si: 'මහනුවර',
  kok: 'पणजी',
  tcy: 'ಮಂಗಳೂರು'
};

function appendNameBoxHtml(placeholder) {
  return '<div class="app-name-row">' +
    '<input class="field-input app-name-inp" type="text" placeholder="' + placeholder + '" />' +
    '<button type="button" class="app-name-row-del" onclick="removeAppNameBox(this)"><i class="ti ti-minus"></i></button>' +
  '</div>';
}

function buildAppendPlaceFields() {
  var wrap = document.getElementById('app-place-name-fields');
  if (!wrap) { return; }
  var langs = (storage.get('languages') || []).slice().sort(function (a, b) {
    if (a.code === 'en') { return -1; }
    if (b.code === 'en') { return 1; }
    return a.name.localeCompare(b.name);
  });
  wrap.innerHTML = langs.map(function (l) {
    return '<div class="field-wrap app-name-group" data-lang="' + l.code + '">' +
      '<div class="field-label app-name-lbl"><i class="ti ti-language" style="font-size:0.8667rem"></i> ' + l.name + ' <span class="app-name-script">' + l.script + '</span></div>' +
      '<input class="field-input app-name-inp" type="text" placeholder="' + (appendPlaceNamePlaceholders[l.code] || ('Type in ' + l.name)) + '" />' +
    '</div>';
  }).join('');
}

var appendPlacePages = "\n\
<div class=\"page\" id=\"page-append-place-name\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Append place name</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Append a place name to the database</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">Add a new place with its name in each language and a pincode. It will be available across the app.</div>\n\
    <div class=\"field-wrap\"><div class=\"field-label\"><i class=\"ti ti-hash\" style=\"font-size:0.8667rem\"></i> Pincode</div><input id=\"app-place-pincode\" class=\"field-input\" type=\"text\" placeholder=\"e.g. 625218\" /></div>\n\
    <div id=\"app-place-name-fields\"></div>\n\
    <button class=\"green-btn\" onclick=\"appendPlaceNameToDatabase()\"><i class=\"ti ti-database-plus\" style=\"font-size:0.9333rem\"></i> Append to database</button>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-append-place-success\">\n\
  <div class=\"success-top\">\n\
    <div class=\"check-ring\"><i class=\"ti ti-check\" style=\"font-size:1.8667rem;color:var(--color-theme-light)\"></i></div>\n\
    <div style=\"font-size:1.1333rem;font-weight:500;color:#27500A;\">Place name added!</div>\n\
    <div style=\"font-size:0.8rem;color:#3B6D11;text-align:center;line-height:1.5;\">The place name has been appended to the database.</div>\n\
  </div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <button class=\"green-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-layout-dashboard\"></i> Back to dashboard</button>\n\
  </div>\n\
</div>\n";

function appendPlaceNameToDatabase() {
  var names = {};
  document.querySelectorAll('.app-name-group').forEach(function (g) {
    var vals = [];
    g.querySelectorAll('.app-name-inp').forEach(function (i) { if (i.value.trim()) { vals.push(i.value.trim()); } });
    names[g.getAttribute('data-lang')] = vals;
  });
  var payload = {
    pinCode: document.getElementById('app-place-pincode').value,
    names: names
  };
  console.log(payload);
  appendPlaceName(payload);
  goTo('append-place-success');
}

function injectAppendPlaceFlow() {
  var existing = document.getElementById('page-append-place-name');
  if (!existing) {
    var screen = document.querySelector('.screen');
    if (screen) screen.insertAdjacentHTML('beforeend', appendPlacePages);
    buildAppendPlaceFields();
  }
}
injectAppendPlaceCSS();
injectAppendPlaceFlow();