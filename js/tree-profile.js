// tree-profile.js — standalone tree profile page (loaded by tree-profile.html)

var albumData = [];
var profileTreeId = new URLSearchParams(location.search).get('treeId') || '625501-06-0001';

var logs = [
  { date:'12 Jun 2026', height:'8.4 m', diam:'22 cm', note:'Canopy looking dense. New shoots visible on upper branches. No signs of disease.', photos:[{bg:'linear-gradient(135deg,#2d5a1b,#4a7c2f)',emoji:'🌿',label:'Full canopy',time:'9:12 AM',main:true},{bg:'linear-gradient(135deg,#1a3a0a,#2d5a1b)',emoji:'🌲',label:'Trunk close-up',time:'9:14 AM'},{bg:'linear-gradient(135deg,#3B6D11,#639922)',emoji:'🍃',label:'New shoots',time:'9:16 AM'}] },
  { date:'10 Jan 2026', height:'8.1 m', diam:'21 cm', note:'Some yellowing on lower leaves — likely seasonal.', photos:[{bg:'linear-gradient(135deg,#1e3d0f,#2d5a1b)',emoji:'🌳',label:'Full tree',time:'10:05 AM',main:true},{bg:'linear-gradient(135deg,#27500A,#3B6D11)',emoji:'🍂',label:'Lower leaves',time:'10:08 AM'}] },
  { date:'15 Jul 2025', height:'7.6 m', diam:'21 cm', note:'Measurement only. Camera not available. Tree looks healthy overall.', photos:[] }
];

// Navigation between profile and album views
function goTo(page) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('page-'+page).classList.add('active');
  document.getElementById('sbar').className = 'status-bar blue';
}

function profileBack() { window.location.href = 'filter.html'; }

function findTree(id) {
  for (var i = 0; i < albumData.length; i++) {
    if (albumData[i].treeId === id) { return albumData[i]; }
  }
  return null;
}

function renderProfile() {
  document.getElementById('profile-id-label').textContent = profileTreeId;
  var tree = findTree(profileTreeId);
  if (tree) {
    document.getElementById('profile-hero-title').textContent = tree.englishName;
    document.getElementById('profile-hero-addr').innerHTML = '<i class="ti ti-map-pin" style="font-size:0.6667rem"></i> ' + (tree.address || '') + ' <button class="map-pin-btn" type="button" onclick="openTreeMap()"><i class="ti ti-map-pin" style="font-size:0.8667rem"></i></button>';
    document.getElementById('profile-species').textContent = tree.scientificName || '—';
  }
}

function treeLoc(t) { return t.address ? t.address.split(', ')[0] : ''; }

function addToSponsor() {
  var tree = findTree(profileTreeId) || {};
  var form = {
    treeId: profileTreeId,
    name: (tree.englishName || '') + ' #' + profileTreeId,
    loc: treeLoc(tree),
    bg: tree.bg || '',
    emoji: tree.emoji || '🌳',
    height: parseFloat(tree.height) || 0,
    diam: tree.diameter || '—',
    logs: tree.logs || 0
  };
  try { sessionStorage.setItem('pendingSponsorV1', JSON.stringify(form)); } catch (e) {}
  window.location.href = 'sponsor.html?hub=login';
}

// Open the map pinned to the tree shown in the profile
function openTreeMap() {
  var tree = findTree(profileTreeId);
  if (hasTreeGis(tree)) {
    showTreeDetailsInMap(tree);
  } else {
    alert('Location not available for this tree.');
  }
}

// Opening the map as a fullscreen in-app modal
function showMap(coordsParam) {
  document.getElementById('map-frame').src = 'map.html?coords=' + encodeURIComponent(coordsParam);
  document.getElementById('map-modal').classList.add('open');
}

function closeMapModal() {
  document.getElementById('map-modal').classList.remove('open');
  document.getElementById('map-frame').src = '';
}

// Album (log photos)
function openAlbum(i) {
  var log = logs[i];
  if (!log.photos.length) return;
  document.getElementById('album-title').textContent = 'Log · ' + log.date;
  document.getElementById('album-date').textContent = log.date;
  document.getElementById('album-h').textContent = log.height;
  document.getElementById('album-d').textContent = log.diam;
  document.getElementById('album-c').textContent = log.photos.length + ' photo' + (log.photos.length > 1 ? 's' : '');
  document.getElementById('album-note').textContent = log.note;
  var grid = document.getElementById('album-grid-page');
  grid.innerHTML = '';
  log.photos.forEach(function(p){
    var div = document.createElement('div');
    div.className = 'album-photo' + (p.main ? ' album-photo-main' : '');
    div.style.background = p.bg;
    div.innerHTML = '<div style="font-size:'+(p.main?'38px':'26px')+'">' + p.emoji + '</div><div class="photo-label">'+p.label+'</div><div class="photo-time">'+p.time+'</div>';
    grid.appendChild(div);
  });
  goTo('album');
}

function normalizeAlbum(t) {
  var out = {};
  for (var k in t) { if (Object.prototype.hasOwnProperty.call(t, k)) { out[k] = t[k]; } }
  var enc = t.encounter || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last.status || {};
  var c = t.card || {};
  out.id = t.treeId;
  out.name = t.englishName || t.name || c.addr || '';
  out.emoji = t.emoji || c.emoji || '🌳';
  out.bg = t.bg || c.bg || '';
  out.address = t.address || c.addrFull || c.addr || '';
  out.englishName = t.englishName || t.name || '';
  out.localName = t.localName || '';
  out.scientificName = t.scientificName || '';
  out.pincode = t.pincode || '';
  out.height = st.height || c.height || '—';
  out.diameter = st.diameter || c.diameter || '—';
  out.health = st.health || '';
  out.logs = t.encounters || keys.length || c.logs || 0;
  out.cards = keys.map(function (key) {
    var e = enc[key];
    return { encounter: key, registeredBy: e.registeredBy || '—', registrationDate: e.registeredDate || '—', registererId: e.registererId || '—', updatedBy: e.updatedBy || e.registeredBy || '—', updatedDate: e.updatedDate || e.registeredDate || '—', updaterId: e.updaterId || e.registererId || '—' };
  });
  return out;
}

function loadTreeData(cb) {
  try {
    var s = localStorage.getItem('treeDataV1');
    if (s) { window.__TREE_DATA = JSON.parse(s); if (cb) { cb(); } return; }
  } catch (e) {}
  fetch('json/tree_cards.json').then(function (r) { return r.json(); }).then(function (data) {
    window.__TREE_DATA = data;
    try { localStorage.setItem('treeDataV1', JSON.stringify(data)); } catch (e) {}
    if (cb) { cb(); }
  }).catch(function () { if (cb) { cb(); } });
}

loadTreeData(function () {
  albumData = (window.__TREE_DATA || []).filter(function (t) { return !t.mock; }).map(normalizeAlbum);
  renderProfile();
});