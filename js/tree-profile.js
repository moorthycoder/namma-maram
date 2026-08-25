// tree-profile.js — standalone tree profile page (loaded by tree-profile.html)

var albumData = [];
var profileTreeId = new URLSearchParams(location.search).get('treeId') || '625501-06-0001';

var urlFLang = new URLSearchParams(location.search).get('flang');
if (urlFLang) setFilterLang(urlFLang);

// Navigation between profile and album views
function goTo(page) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('page-'+page).classList.add('active');
  document.getElementById('sbar').className = 'status-bar blue';
}

function profileBack() {
  var parent = new URLSearchParams(location.search).get('parent');
  if (parent) { window.location.href = parent; return; }
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = 'filter.html';
  }
}

function findTree(id) {
  for (var i = 0; i < albumData.length; i++) {
    if (albumData[i].treeId === id) { return albumData[i]; }
  }
  return null;
}

function formatDate(iso) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return m ? parseInt(m[3], 10) + ' ' + months[parseInt(m[2], 10) - 1] + ' ' + m[1] : (iso || '—');
}

function renderProfile() {
  document.getElementById('profile-id-label').textContent = profileTreeId;
  var tree = findTree(profileTreeId);
  if (tree) {
    var localAddr = cardAddressText(tree, filterLang);
    var last = tree.cards[tree.cards.length - 1] || {};
    var first = tree.cards[0] || {};
    document.getElementById('profile-hero-title').textContent = storage.treeNameIn(tree, filterLang);
    document.getElementById('profile-hero-addr').innerHTML = '<i class="ti ti-map-pin" style="font-size:0.6667rem"></i> ' + (localAddr || '') + ' <button class="map-pin-btn" type="button" onclick="openTreeMap()"><i class="ti ti-map-pin" style="font-size:0.8667rem"></i></button>';
    document.getElementById('profile-health-badge').textContent = tree.health ? tree.health.charAt(0).toUpperCase() + tree.health.slice(1) : '—';
    document.getElementById('profile-stat-height').textContent = parseFloat(last.height) || '—';
    document.getElementById('profile-stat-diam').textContent = parseInt(last.diam, 10) || '—';
    document.getElementById('profile-stat-logs').textContent = tree.logs;
    document.getElementById('profile-health-score').textContent = (typeof last.score === 'number' ? last.score : '—') + ' / 100';
    document.querySelector('.health-fill').style.width = (typeof last.score === 'number' ? last.score : 0) + '%';
    document.getElementById('profile-species').textContent = (tree.speciesName && tree.speciesName.sn) || '—';
    document.getElementById('profile-added-by').textContent = first.registeredBy || tree['care-giver'] || '—';
    document.getElementById('profile-first-logged').textContent = formatDate(first.date);
    document.getElementById('profile-total-logs').textContent = tree.logs + ' entries';
    renderLogs(tree);
  }
}

function renderLogs(tree) {
  var wrap = document.getElementById('profile-logs');
  wrap.innerHTML = '';
  var dots = ['#3B6D11', '#9FE1CB', '#C0DD97'];
  for (var i = tree.cards.length - 1; i >= 0; i--) {
    var c = tree.cards[i];
    var prev = tree.cards[i - 1];
    var delta = (prev && parseFloat(c.height) && parseFloat(prev.height)) ? '+' + (parseFloat(c.height) - parseFloat(prev.height)).toFixed(1) + ' m' : '';
    var entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.onclick = (function (idx) { return function () { openAlbum(idx); }; })(i);
    entry.innerHTML = '<div class="log-dot" style="background:' + dots[i % 3] + '"></div>'
      + '<div class="log-body"><div class="log-date">' + formatDate(c.date) + '</div>'
      + '<div class="log-text">' + c.height + ' · ' + c.diam + ' diameter</div>'
      + '<div class="log-notes"><i class="ti ti-notes" style="font-size:0.7rem;flex-shrink:0"></i><span><b>Notes</b> ' + (c.note || '—') + '</span></div>'
      + '<div class="log-recommendations"><i class="ti ti-clipboard-check" style="font-size:0.7rem;flex-shrink:0"></i><span><b>Recommendations</b> ' + (c.recommendations || '—') + '</span></div>'
      + '<div class="log-chips">' + (delta ? '<span class="chip">' + delta + '</span>' : '')
      + (c.photos ? '<span class="chip-blue"><i class="ti ti-photo" style="font-size:0.6667rem"></i>' + c.photos + ' photo' + (c.photos > 1 ? 's' : '') + '</span>' : '<span style="font-size:0.6667rem;color:var(--color-text-secondary);font-style:italic;">No photos</span>')
      + '</div></div>'
      + '<div class="log-thumb" style="background:' + (tree.bg || '#2d4a2d') + ';">' + (c.emoji || tree.emoji || '🌳') + '</div>';
    wrap.appendChild(entry);
  }
}

// Helpers: language-keyed readers for nested name/address on a tree card
function cardNameText(card, lang_key) {
  var names = (card && card.speciesName) || {};
  return names[lang_key] || names.en || names.ta || '';
}

function cardAddressText(card, lang_key) {
  var addr = (card && card.address) || {};
  return addr[lang_key] || addr.en || addr.ta || '';
}

function treeLoc(t) { var addr = cardAddressText(t, 'en'); return addr ? addr.split(', ')[0] : ''; }

function addToSponsor() {
  var tree = findTree(profileTreeId) || {};
  var form = {
    treeId: profileTreeId,
    name: cardNameText(tree, 'en') + ' #' + profileTreeId,
    loc: treeLoc(tree),
    bg: tree.bg || '',
    emoji: tree.emoji || '🌳',
    height: parseFloat(tree.height) || 0,
    diam: tree.diameter || '—',
    logs: tree.logs || 0
  };
  try { sessionStorage.setItem('pendingSponsorV1', JSON.stringify(form)); } catch (e) {}
  window.location.href = 'sponsor.html?hub=login&parent=' + encodeURIComponent('tree-profile.html' + location.search);
}

// Open the map pinned to the tree shown in the profile
function openTreeMap() {
  var tree = findTree(profileTreeId);
  if (hasTreeGis(tree)) {
    showInMap([tree.treeId]);
  } else {
    alert('Location not available for this tree.');
  }
}

function closeMapModal() {
  document.getElementById('map-modal').classList.remove('open');
  document.getElementById('map-frame').src = '';
}

// Album (log photos)
function openAlbum(i) {
  var tree = findTree(profileTreeId);
  var log = tree && tree.cards[i];
  if (!log || !log.photos) return;
  document.getElementById('album-title').textContent = 'Log · ' + formatDate(log.date);
  document.getElementById('album-date').textContent = formatDate(log.date);
  document.getElementById('album-h').textContent = log.height;
  document.getElementById('album-d').textContent = log.diam;
  document.getElementById('album-c').textContent = log.photos + ' photo' + (log.photos === 1 ? '' : 's');
  document.getElementById('album-note').textContent = log.note;
  var grid = document.getElementById('album-grid-page');
  grid.innerHTML = '';
  var bgs = ['linear-gradient(135deg,#2d5a1b,#4a7c2f)', 'linear-gradient(135deg,#1a3a0a,#2d5a1b)', 'linear-gradient(135deg,#3B6D11,#639922)', 'linear-gradient(135deg,#1e3d0f,#2d5a1b)', 'linear-gradient(135deg,#27500A,#3B6D11)'];
  for (var p = 0; p < log.photos; p++) {
    var div = document.createElement('div');
    div.className = 'album-photo' + (p === 0 ? ' album-photo-main' : '');
    div.style.background = bgs[(i + p) % bgs.length];
    div.innerHTML = '<div style="font-size:' + (p === 0 ? '38px' : '26px') + '">' + (log.emoji || tree.emoji || '🌳') + '</div><div class="photo-label">Photo ' + (p + 1) + '</div>';
    grid.appendChild(div);
  }
  goTo('album');
}

function normalizeAlbum(t) {
  var out = {};
  for (var k in t) { if (Object.prototype.hasOwnProperty.call(t, k)) { out[k] = t[k]; } }
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var c = t.card || {};
  out.id = t.treeId;
  out.name = cardNameText(t, 'en') || c.addr || '';
  out.emoji = t.emoji || c.emoji || '🌳';
  out.bg = t.bg || c.bg || '';
  out.pincode = t.pincode || '';
  out.height = st.height || c.height || '—';
  out.diameter = st.diameter || c.diameter || '—';
  out.health = st.health || '';
  out.logs = t.encounters || keys.length || c.logs || 0;
  out.cards = keys.map(function (key) {
    var e = enc[key];
    var hs = e['health-status'] || {};
    return { encounter: key, date: e.registeredDate || e.updatedDate || '—', registeredBy: e.registeredBy || e.updatedBy || '—', height: hs.height || '—', diam: hs.diameter || '—', health: hs.health || '', score: hs['health-score'], emoji: e.thumb || t.emoji || '🌳', note: (e.fieldObservation && e.fieldObservation.notes) || '', recommendations: (e.fieldObservation && e.fieldObservation.recommendations) || '', photos: ((e.photos && e.photos.snapshots) || []).length };
  });
  return out;
}

window.render = {
  init: function () {
    storage.syncTreeCards();
    albumData = (window.__TREE_DATA || []).map(normalizeAlbum);
    renderProfile();
  }
};