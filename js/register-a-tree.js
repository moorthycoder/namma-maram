// register-a-tree.js — shared Register A Tree flow, injected into any role page on load.

var registerFlowCSS = "\n\
  .reg-camera{width:100%;border-radius:var(--border-radius-lg);border:1.5px dashed var(--color-border-secondary);display:flex;align-items:center;justify-content:center;gap:8px;padding:34px 0;cursor:pointer;color:var(--color-text-secondary);font-size:0.8667rem;}\n\
  .reg-photo-preview{width:100%;border-radius:var(--border-radius-lg);overflow:hidden;display:none;margin-top:10px;}\n\
  .reg-photo-preview img{width:100%;display:block;}\n\
  .reg-info-box{display:none;border-radius:var(--border-radius-lg);background:var(--color-background-secondary);padding:12px 13px;margin-top:10px;flex-direction:column;gap:8px;}\n\
  .reg-info-row{display:flex;align-items:center;gap:8px;font-size:0.8rem;color:var(--color-text-primary);}\n\
  .reg-info-row i{color:var(--color-theme);font-size:0.9333rem;}\n\
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
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Register tree</span><span class=\"topbar-step\">Step 1 of 2</span></div>\n\
  <div class=\"scrollable\" style=\"flex:1;padding:16px 14px;display:flex;flex-direction:column;gap:14px;\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Take a photo of the tree</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">The photo will capture the place, GPS and timestamp. You can correct the details in the next step.</div>\n\
    <div class=\"reg-camera\" onclick=\"document.getElementById('reg-photo-input').click()\"><i class=\"ti ti-camera\" style=\"font-size:1.2rem\"></i> Take photo with tree</div>\n\
    <div class=\"reg-photo-preview\" id=\"reg-photo-preview\"></div>\n\
    <div class=\"reg-info-box\" id=\"reg-photo-info\"></div>\n\
    <input type=\"file\" id=\"reg-photo-input\" accept=\"image/*\" capture=\"environment\" style=\"display:none\" onchange=\"onRegisterPhoto(this)\" />\n\
    <button class=\"green-btn\" id=\"reg-continue-btn\" style=\"display:none\" onclick=\"prefillRegisterForm(); goTo('register-form')\"><i class=\"ti ti-arrow-right\" style=\"font-size:0.9333rem\"></i> Continue to form</button>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-register-form\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Register tree</span><span class=\"topbar-step\">Step 2 of 2</span></div>\n\
  <div class=\"scrollable\" style=\"flex:1;padding:16px 14px;display:flex;flex-direction:column;gap:14px;\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Confirm tree details</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">Fields were filled from the photo. Correct if needed, then register the tree.</div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-leaf\" style=\"font-size:0.8667rem\"></i> Tree name</div><input id=\"reg-tree-name\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Neem Tree\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-abc\" style=\"font-size:0.8667rem\"></i> Local name</div><input id=\"reg-local-name\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Vembu\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-map-pin\" style=\"font-size:0.8667rem\"></i> Address</div><input id=\"reg-address\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Anna Nagar Govt School\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-language\" style=\"font-size:0.8667rem\"></i> addressLocalLang</div><input id=\"reg-address-lang\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. அண்ணா நகர் அரசு பள்ளி\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-hash\" style=\"font-size:0.8667rem\"></i> Pincode</div><input id=\"reg-pincode\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. 600040\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-building\" style=\"font-size:0.8667rem\"></i> College code</div><input id=\"reg-college-code\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. 625501\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-hash\" style=\"font-size:0.8667rem\"></i> Local Sl No</div><input id=\"reg-local-slno\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. 01\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-gps\" style=\"font-size:0.8667rem\"></i> GPS location</div>\n\
      <input id=\"reg-lat\" class=\"field-inp\" type=\"text\" placeholder=\"Latitude (e.g. 12.9791)\" />\n\
      <input id=\"reg-long\" class=\"field-inp\" type=\"text\" placeholder=\"Longitude (e.g. 79.1553)\" />\n\
    </div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-calendar\" style=\"font-size:0.8667rem\"></i> Registered date</div><input id=\"reg-date\" class=\"field-inp\" type=\"date\" /></div>\n\
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
    GIS: {
      latitude: document.getElementById('reg-lat').value,
      longitude: document.getElementById('reg-long').value
    },
    emoji: '🌳',
    bg: 'linear-gradient(135deg,#2d5a1b,#3B6D11)',
    date: document.getElementById('reg-date') ? document.getElementById('reg-date').value : ''
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

var registerPhotoData = null;

function onRegisterPhoto(input) {
  var file = input.files[0];
  if (!file) return;
  capturePhotoData(function () {
    var photo = new Image();
    photo.onload = function () {
      embedPhotoDataIntoImage(photo);
      var preview = document.getElementById('reg-photo-preview');
      if (preview) {
        preview.style.display = 'block';
        preview.innerHTML = '<img src="' + registerPhotoData.image + '" alt="Tree photo" />';
      }
      var infoBox = document.getElementById('reg-photo-info');
      if (infoBox) {
        infoBox.style.display = 'flex';
        infoBox.innerHTML = '<div class="reg-info-row"><i class="ti ti-gps"></i><span>' + registerPhotoData.lat + ', ' + registerPhotoData.lng + '</span></div>' +
          '<div class="reg-info-row"><i class="ti ti-clock"></i><span>' + registerPhotoData.dateTime + '</span></div>' +
          '<div class="reg-info-row"><i class="ti ti-map-pin"></i><span>' + registerPhotoData.address + '</span></div>';
      }
      var continueBtn = document.getElementById('reg-continue-btn');
      if (continueBtn) continueBtn.style.display = 'block';
    };
    photo.src = URL.createObjectURL(file);
  });
}

function capturePhotoData(callback) {
  registerPhotoData = {
    lat: '',
    lng: '',
    dateTime: formatPhotoDateTime(new Date()),
    address: 'Mettupatti Sugar Mill School, 625501, Tamil Nadu'
  };
  var useDefaultLocation = function () {
    registerPhotoData.lat = '9.9784';
    registerPhotoData.lng = '77.9876';
    callback();
  };
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      registerPhotoData.lat = position.coords.latitude.toFixed(6);
      registerPhotoData.lng = position.coords.longitude.toFixed(6);
      callback();
    }, useDefaultLocation);
  } else {
    useDefaultLocation();
  }
}

function formatPhotoDateTime(date) {
  function pad(value) { return (value < 10 ? '0' : '') + value; }
  return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) + ' ' +
    pad(date.getHours()) + ':' + pad(date.getMinutes()) + ':' + pad(date.getSeconds());
}

function embedPhotoDataIntoImage(photo) {
  var canvas = document.createElement('canvas');
  canvas.width = photo.width;
  canvas.height = photo.height;
  var ctx = canvas.getContext('2d');
  ctx.drawImage(photo, 0, 0);
  var stampHeight = 64;
  ctx.fillStyle = 'rgba(0,0,0,0.62)';
  ctx.fillRect(0, canvas.height - stampHeight, canvas.width, stampHeight);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(registerPhotoData.address, 12, canvas.height - stampHeight + 26);
  ctx.fillStyle = '#cfd8c3';
  ctx.font = '16px sans-serif';
  ctx.fillText(registerPhotoData.lat + ', ' + registerPhotoData.lng + '  \u2022  ' + registerPhotoData.dateTime, 12, canvas.height - stampHeight + 50);
  registerPhotoData.image = canvas.toDataURL('image/jpeg', 0.85);
}

function prefillRegisterForm() {
  var photo = registerPhotoData || {};
  setRegisterField('reg-tree-name', 'Neem Tree');
  setRegisterField('reg-local-name', 'வேம்பு');
  setRegisterField('reg-address', photo.address || 'Mettupatti Sugar Mill School, 625501, Tamil Nadu');
  setRegisterField('reg-address-lang', 'மேட்டுப்பட்டி சர்க்கரை ஆலைப் பள்ளி');
  setRegisterField('reg-pincode', '625501');
  setRegisterField('reg-college-code', '06');
  setRegisterField('reg-local-slno', '0001');
  setRegisterField('reg-lat', photo.lat || '9.9784');
  setRegisterField('reg-long', photo.lng || '77.9876');
  setRegisterField('reg-date', (photo.dateTime || '').slice(0, 10));
}

function setRegisterField(id, value) {
  var el = document.getElementById(id);
  if (el) el.value = value;
}

injectRegisterFlow();
