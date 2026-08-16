// register-a-tree.js — shared Register A Tree flow, injected into any role page on load.

var registerFlowCSS = "\n\
  .reg-camera{width:100%;border-radius:var(--border-radius-lg);border:1.5px dashed var(--color-border-secondary);display:flex;align-items:center;justify-content:center;gap:8px;padding:18px 0;cursor:pointer;color:var(--color-text-secondary);font-size:0.8667rem;}\n\
  .reg-selfie-preview{width:100%;border-radius:var(--border-radius-lg);overflow:hidden;display:none;margin-top:10px;}\n\
  .reg-selfie-preview img{width:100%;display:block;}\n\
";

var registerFlowPages = "\n\
<div class=\"page\" id=\"page-append-tree-name\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Append tree name</span></div>\n\
  <div class=\"scrollable\" style=\"flex:1;padding:16px 14px;display:flex;flex-direction:column;gap:14px;\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Append a tree name to the database</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">Add a new tree name with its scientific and local names. It will be available across the app.</div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-leaf\" style=\"font-size:0.8667rem\"></i> Tree name</div><input id=\"app-tree-name\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Rain Tree\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-abc\" style=\"font-size:0.8667rem\"></i> Scientific name</div><input id=\"app-scientific-name\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Samanea saman\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-language\" style=\"font-size:0.8667rem\"></i> Local name</div><input id=\"app-local-name\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Thoongu Moonji Maram\" /></div>\n\
    <button class=\"green-btn\" onclick=\"appendTreeNameToDatabase()\"><i class=\"ti ti-database-plus\" style=\"font-size:0.9333rem\"></i> Append to database</button>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-register-tree\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Register tree</span></div>\n\
  <div class=\"scrollable\" style=\"flex:1;padding:16px 14px;display:flex;flex-direction:column;gap:14px;\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Register a new tree</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">Fill in the tree details. The tree will be added to the registry.</div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-leaf\" style=\"font-size:0.8667rem\"></i> Tree name</div><input id=\"reg-tree-name\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Neem Tree\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-abc\" style=\"font-size:0.8667rem\"></i> Local name</div><input id=\"reg-local-name\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Vembu\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-map-pin\" style=\"font-size:0.8667rem\"></i> Address</div><input id=\"reg-address\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Anna Nagar Govt School\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-language\" style=\"font-size:0.8667rem\"></i> addressLocalLang</div><input id=\"reg-address-lang\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. அண்ணா நகர் அரசு பள்ளி\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-hash\" style=\"font-size:0.8667rem\"></i> Pincode</div><input id=\"reg-pincode\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. 600040\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-building\" style=\"font-size:0.8667rem\"></i> College code</div><input id=\"reg-college-code\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. 625001\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-hash\" style=\"font-size:0.8667rem\"></i> Local Sl No</div><input id=\"reg-local-slno\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. 01\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-camera\" style=\"font-size:0.8667rem\"></i> Selfie with tree</div>\n\
      <div class=\"reg-camera\" onclick=\"document.getElementById('reg-selfie-input').click()\"><i class=\"ti ti-camera\"></i> Selfie with tree</div>\n\
      <div class=\"reg-selfie-preview\" id=\"reg-selfie-preview\"></div>\n\
      <input type=\"file\" id=\"reg-selfie-input\" accept=\"image/*\" capture=\"user\" style=\"display:none\" onchange=\"onRegisterSelfie(this)\" />\n\
    </div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-gps\" style=\"font-size:0.8667rem\"></i> GPS location</div>\n\
      <input id=\"reg-lat\" class=\"field-inp\" type=\"text\" placeholder=\"Latitude (e.g. 12.9791)\" />\n\
      <input id=\"reg-long\" class=\"field-inp\" type=\"text\" placeholder=\"Longitude (e.g. 79.1553)\" />\n\
    </div>\n\
    <button class=\"green-btn\" onclick=\"typeof registerAndAdoptATree === 'function' ? registerAndAdoptATree() : (registerATree(), showRegisterStatus('registered'))\"><i class=\"ti ti-check\"></i> Register tree</button>\n\
  </div>\n\
</div>\n";

function appendTreeNameToDatabase() {
  var tree_name = {
    englishName: document.getElementById('app-tree-name').value,
    scientificName: document.getElementById('app-scientific-name').value,
    localName: document.getElementById('app-local-name').value
  };
  appendTreeName(tree_name);
  showRegisterStatus('added');
}

function registerATree() {
  var pincode    = document.getElementById('reg-pincode').value;
  var collegeCode = document.getElementById('reg-college-code').value;
  var localSlNo  = document.getElementById('reg-local-slno').value;
  var form = {
    treeId: pincode + '-' + collegeCode + '-' + localSlNo,
    englishName: document.getElementById('reg-tree-name').value,
    localName: document.getElementById('reg-local-name').value,
    address: document.getElementById('reg-address').value,
    addressLocalLang: document.getElementById('reg-address-lang').value,
    pincode: pincode,
    collegeCode: collegeCode,
    LocalSlNo: localSlNo,
    latitude: document.getElementById('reg-lat').value,
    longitude: document.getElementById('reg-long').value,
    emoji: '🌳',
    bg: 'linear-gradient(135deg,#2d5a1b,#3B6D11)'
  };
  fetch('/api/register-tree', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form)
  });
  return form;
}

function injectRegisterFlow() {
  var existing = document.getElementById('page-register-tree');
  if (!existing) {
    var styleEl = document.createElement('style');
    styleEl.id = 'register-flow-style';
    styleEl.textContent = registerFlowCSS;
    document.head.appendChild(styleEl);
    var screen = document.querySelector('.screen');
    if (screen) screen.insertAdjacentHTML('beforeend', registerFlowPages);
  }
}

function onRegisterSelfie(input) {
  var preview = document.getElementById('reg-selfie-preview');
  var f = input.files[0];
  if (!f || !preview) return;
  preview.style.display = 'block';
  preview.innerHTML = '<img src="' + URL.createObjectURL(f) + '" alt="Selfie with tree" />';
  document.getElementById('reg-tree-name').value = 'Neem Tree';
  document.getElementById('reg-local-name').value = 'வேம்பு';
  document.getElementById('reg-address').value = 'Mettupatti Sugar Mill School, 625001, Tamil Nadu';
  document.getElementById('reg-address-lang').value = 'மேட்டுப்பட்டி சர்க்கரை ஆலைப் பள்ளி';
  document.getElementById('reg-pincode').value = '625001';
  document.getElementById('reg-college-code').value = '06';
  document.getElementById('reg-local-slno').value = '0001';
  document.getElementById('reg-lat').value = '9.9784';
  document.getElementById('reg-long').value = '77.9876';
}

injectRegisterFlow();
