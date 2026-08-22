// gis.js — reusable GIS widget (Leaflet + OpenStreetMap) for register/survey flows.

var gisMapRef = null;
var gisMarkerRef = null;
var gisConfigRef = null;
var gisDefaultPrefillLat = '9.919583';
var gisDefaultPrefillLng = '78.118861';

function initGisMap(config) {
  if (gisMapRef || !config || !config.mapId) { return; }
  gisConfigRef = config;
  var lat = parseFloat(config.prefillLat || gisDefaultPrefillLat) || 0;
  var lng = parseFloat(config.prefillLng || gisDefaultPrefillLng) || 0;
  gisMapRef = L.map(config.mapId).setView([lat, lng], 11);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(gisMapRef);
  gisMarkerRef = L.marker([lat, lng], { draggable: true }).addTo(gisMapRef);
  gisMarkerRef.on('dragend', syncGisInputsFromMarker);
  gisMapRef.on('click', onGisMapClick);
  var latEl = document.getElementById(config.latInputId);
  var lngEl = document.getElementById(config.lngInputId);
  if (latEl) { latEl.value = config.prefillLat || gisDefaultPrefillLat; }
  if (lngEl) { lngEl.value = config.prefillLng || gisDefaultPrefillLng; }
}

function moveGisMarker(lat, lng) {
  if (!gisMapRef || !gisMarkerRef || isNaN(lat) || isNaN(lng)) { return; }
  gisMarkerRef.setLatLng([lat, lng]);
  gisMapRef.panTo([lat, lng]);
}

function onGisMapClick(event) {
  var config = gisConfigRef;
  if (!config || !gisMarkerRef) { return; }
  var latEl = document.getElementById(config.latInputId);
  var lngEl = document.getElementById(config.lngInputId);
  if (latEl) { latEl.value = event.latlng.lat.toFixed(6); }
  if (lngEl) { lngEl.value = event.latlng.lng.toFixed(6); }
  gisMarkerRef.setLatLng([event.latlng.lat, event.latlng.lng]);
  gisMapRef.panTo([event.latlng.lat, event.latlng.lng]);
  if (config.onPositionChange) { config.onPositionChange(); }
}

function moveGisMarkerFromInputs() {
  var config = gisConfigRef;
  if (!config) { return; }
  var latEl = document.getElementById(config.latInputId);
  var lngEl = document.getElementById(config.lngInputId);
  var lat = parseFloat(latEl ? latEl.value : '');
  var lng = parseFloat(lngEl ? lngEl.value : '');
  if (isNaN(lat) || isNaN(lng)) { return; }
  moveGisMarker(lat, lng);
  if (config.onPositionChange) { config.onPositionChange(); }
}

function refreshGisMap() {
  if (!gisMapRef) { return; }
  setTimeout(function() { gisMapRef.invalidateSize(); }, 0);
}

function syncGisInputsFromMarker() {
  var config = gisConfigRef;
  if (!config || !gisMarkerRef) { return; }
  var pos = gisMarkerRef.getLatLng();
  var latEl = document.getElementById(config.latInputId);
  var lngEl = document.getElementById(config.lngInputId);
  if (latEl) { latEl.value = pos.lat.toFixed(6); }
  if (lngEl) { lngEl.value = pos.lng.toFixed(6); }
  gisMapRef.panTo([pos.lat, pos.lng]);
  if (config.onPositionChange) { config.onPositionChange(); }
}

function captureGisPosition(config) {
  var lat = config.prefillLat || gisDefaultPrefillLat;
  var lng = config.prefillLng || gisDefaultPrefillLng;
  var latEl = document.getElementById(config.latInputId);
  var lngEl = document.getElementById(config.lngInputId);
  var currentLat = latEl && latEl.value ? latEl.value : '';
  var currentLng = lngEl && lngEl.value ? lngEl.value : '';
  var applyPosition = function() {
    if (latEl) { latEl.value = lat; }
    if (lngEl) { lngEl.value = lng; }
    moveGisMarker(parseFloat(lat), parseFloat(lng));
    if (config.onPositionChange) { config.onPositionChange(); }
  };
  if (!config.useRealCapture || !navigator.geolocation) {
    if (currentLat && currentLng) {
      lat = currentLat;
      lng = currentLng;
    }
    applyPosition();
    return;
  }
  navigator.geolocation.getCurrentPosition(
    function(position) {
      lat = position.coords.latitude.toFixed(6);
      lng = position.coords.longitude.toFixed(6);
      applyPosition();
    },
    function() {
      if (currentLat && currentLng) {
        lat = currentLat;
        lng = currentLng;
      }
      applyPosition();
    }
  );
}