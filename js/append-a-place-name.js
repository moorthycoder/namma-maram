// append-a-place-name.js — reads places_name.json cache (populated by filter.js; only index reads the JSON) and appends new place names.

var PLACES_DB = [];

function loadPlaces(cb) {
  if (PLACES_DB.length > 0) { if (cb) { cb(); } return; }
  if (window.PLACES_DB) { PLACES_DB = window.PLACES_DB; if (cb) { cb(); } return; }
  try {
    var s = localStorage.getItem('placesV1');
    if (s) { PLACES_DB = JSON.parse(s); if (cb) { cb(); } return; }
  } catch (e) {}
  if (cb) { cb(); }
}

function appendPlaceName(place) {
  var entry = {
    placeId: place.pinCode + '#' + place.englishName,
    pinCode: place.pinCode,
    placeName: {
      ta: place.localName || '',
      en: place.englishName || ''
    }
  };
  PLACES_DB.push(entry);
  return entry;
}

var appendPlacePages = "\n\
<div class=\"page\" id=\"page-append-place-name\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Append place name</span></div>\n\
  <div class=\"scrollable\" style=\"flex:1;padding:16px 14px;display:flex;flex-direction:column;gap:14px;\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Append a place name to the database</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">Add a new place with its local and English names. It will be available across the app.</div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-map-pin\" style=\"font-size:0.8667rem\"></i> Place name (English)</div><input id=\"app-place-en\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. Vadippatti\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-language\" style=\"font-size:0.8667rem\"></i> Place name (Local)</div><input id=\"app-place-ta\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. வாடிப்பட்டி\" /></div>\n\
    <div class=\"field-group\"><div class=\"field-lbl\"><i class=\"ti ti-hash\" style=\"font-size:0.8667rem\"></i> Pincode</div><input id=\"app-place-pincode\" class=\"field-inp\" type=\"text\" placeholder=\"e.g. 625218\" /></div>\n\
    <button class=\"green-btn\" onclick=\"appendPlaceNameToDatabase()\"><i class=\"ti ti-database-plus\" style=\"font-size:0.9333rem\"></i> Append to database</button>\n\
  </div>\n\
</div>\n";

function appendPlaceNameToDatabase() {
  var place = {
    englishName: document.getElementById('app-place-en').value,
    localName: document.getElementById('app-place-ta').value,
    pinCode: document.getElementById('app-place-pincode').value
  };
  loadPlaces(function () {
    appendPlaceName(place);
    showRegisterStatus('place_added');
  });
}

function injectAppendPlaceFlow() {
  var existing = document.getElementById('page-append-place-name');
  if (!existing) {
    var screen = document.querySelector('.screen');
    if (screen) screen.insertAdjacentHTML('beforeend', appendPlacePages);
  }
}
injectAppendPlaceFlow();