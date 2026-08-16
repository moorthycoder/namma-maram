
var TESTING_MODE = true;
var profileFrom = 'main';
var albumFrom = 'profile';
var treeLogsFrom = 'trees';
var sponsoredCount = 2;
var caredCount = 4;
var max_register_ten_trees_ranger = 10;
var logoutTarget = 'main';

function loadCurrentUser() {
  try {
    var s = sessionStorage.getItem('loginCredentialsV1');
    if (!s) { return; }
    var cred = JSON.parse(s);
    var role = cred['tree-login'] && cred['tree-login']['ten-trees-ranger'];
    if (!role) { return; }
    var nameEl = document.getElementById('user-name');
    var avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = role.name;
    if (avatarEl) avatarEl.textContent = role.avatar;
    window._login = cred;
  } catch (e) {}
}
loadCurrentUser();

var loginStatusData = {
  waiting:   { icon:'ti ti-clock',        color:'#f59e0b', bg:'#fef3c7', title:'Application under review',  text:'Your login request is waiting for admin approval. We will notify you once it is reviewed.' },
  rejected:  { icon:'ti ti-x',            color:'#dc2626', bg:'#fee2e2', title:'Application rejected',      text:'Your login request was rejected. Please contact support if you think this is a mistake.' },
  approved:  { icon:'ti ti-check',        color:'#16a34a', bg:'#dcfce7', title:'Login approved',            text:'Welcome! Your login was approved. You can now continue to your dashboard.' },
  withdrawn: { icon:'ti ti-user-off',     color:'#64748b', bg:'#e2e8f0', title:'Access withdrawn',          text:'Your access has been withdrawn. Please contact the administrator for details.' }
};

var registerStatusData = {
  waiting:          { icon:'ti ti-clock',       color:'#f59e0b', bg:'#fef3c7', title:'Application under review',  text:'Your registration is waiting for admin approval. We will notify you once it is reviewed.', go:'Login' },
  existing_member:  { icon:'ti ti-user-check',  color:'#16a34a', bg:'#dcfce7', title:'Already registered',        text:'An account with this email already exists. Please log in instead of registering again.', go:'Login', to:'role-login' },
  blocked:          { icon:'ti ti-ban',         color:'#dc2626', bg:'#fee2e2', title:'Registration blocked',       text:'Your registration has been blocked. Please contact support if you think this is a mistake.', go:'Contact us', to:'role-login' },
  limit:            { icon:'ti ti-circle-x',    color:'#dc2626', bg:'#fee2e2', title:'Limit reached',              text:'Your limit reached. Kindly contact your ten tree ranger.' }
};

// Register status modal — waiting / existing_member / blocked
var regTarget = 'main';

function showRegisterStatus(status, page) {
  if (page) regTarget = page;
  var d = registerStatusData[status] || registerStatusData.waiting;
  if (d.to) regTarget = d.to;
  var icon = document.getElementById('rsm-icon');
  icon.style.background = d.bg;
  icon.style.color = d.color;
  icon.innerHTML = '<i class="' + d.icon + '" style="font-size:24px;"></i>';
  document.getElementById('rsm-title').textContent = d.title;
  document.getElementById('rsm-text').textContent = d.text;
  var ok = document.getElementById('rsm-ok-btn');
  if (status === 'existing_member') {
    ok.innerHTML = '<i class="ti ti-login"></i> ' + d.go;
  } else {
    ok.innerHTML = '<i class="ti ti-check"></i> Okay';
  }
  if (status === 'blocked') {
    ok.style.background = '#dc2626';
  } else {
    ok.style.background = 'var(--color-theme)';
  }
  var test = document.getElementById('rsm-test');
  if (test) test.style.display = TESTING_MODE ? 'block' : 'none';
  document.getElementById('register-status-modal').classList.add('open');
}



function closeRegisterStatus(go) {
  document.getElementById('register-status-modal').classList.remove('open');
  if (go) goTo(regTarget);
}


// Google OAuth — simulates result in TESTING_MODE, else real OAuth redirect

function googleAuth(page, status) {
  status = status || (TESTING_MODE ? 'approved' : null);
  if (TESTING_MODE) {
    showLoginStatus(page, status);
    return;
  }
  var clientId = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
  var redirect = encodeURIComponent(window.location.origin + window.location.pathname);
  window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?client_id=' + clientId +
    '&redirect_uri=' + redirect + '&response_type=code&scope=openid%20email%20profile';
}


// Open the shared role login page (Care-giver, Ten Tree Ranger, Surveyor)
var currentRole = 'caregiver';

function openRoleLogin(title, role) {
  currentRole = role;
  document.getElementById('role-login-title').textContent = title + ' login';
  document.getElementById('role-login-sub').textContent = 'Sign in as a ' + title.toLowerCase();
  logoutTarget = 'role-login';
  goTo('role-login');
}



function roleDash() {
  return currentRole === 'surveyor' ? 'surveyor-dash' : 'ranger-dash';
}


// Show login-result modal based on status

function showLoginStatus(page, status) {
  var d = loginStatusData[status] || loginStatusData.waiting;
  var icon = document.getElementById('lsm-icon');
  icon.style.background = d.bg;
  icon.style.color = d.color;
  icon.innerHTML = '<i class="' + d.icon + '" style="font-size:24px;"></i>';
  document.getElementById('lsm-title').textContent = d.title;
  document.getElementById('lsm-text').textContent = d.text;
  var test = document.getElementById('lsm-test');
  if (test) test.style.display = TESTING_MODE ? 'block' : 'none';
  logoutTarget = page;
  document.getElementById('login-status-modal').classList.add('open');
}



function closeLoginStatus(go) {
  document.getElementById('login-status-modal').classList.remove('open');
  if (go) goTo(logoutTarget);
}


// Font size (S/M/L) — text-only scaling via root html font-size (all fonts are rem)
var fontSizeLevel = 1; // 0=S, 1=M, 2=L
var fontLevels = [
  { label:'S', mul:0.85 },
  { label:'M', mul:1.0 },
  { label:'L', mul:1.15 }
];

function fontSize(dir) {
  if (dir === 'up') { if (fontSizeLevel < 2) fontSizeLevel++; }
  else { if (fontSizeLevel > 0) fontSizeLevel--; }
  applyFontSize();
}

function applyFontSize() {
  var lv = fontLevels[fontSizeLevel];
  document.getElementById('fs-val').textContent = lv.label;
  document.getElementById('fs-minus').disabled = fontSizeLevel === 0;
  document.getElementById('fs-plus').disabled = fontSizeLevel === 2;
  document.documentElement.style.fontSize = (15 * lv.mul) + 'px';
}

function pickLang(tile, name) {
  document.querySelectorAll('.lang-tile').forEach(function(t){ t.classList.remove('sel'); });
  tile.classList.add('sel');
  alert('Language set to ' + name);
}


// Notifications on/off switch

function toggleNotif(btn) {
  var on = btn.getAttribute('aria-checked') === 'true';
  btn.setAttribute('aria-checked', String(!on));
}


// Tree data for album — read from cache populated by filter.js (only index reads the JSON)
var albumData = [];
loadTreeData(function () {
  var data = window.__TREE_DATA || [];
  albumData = Array.isArray(data) ? data : (data.albumData || []);
  applyFilters();
});

var logs = [
  { date:'12 Jun 2026', height:'8.4 m', diam:'22 cm', note:'Canopy looking dense. New shoots visible on upper branches. No signs of disease.', photos:[{bg:'linear-gradient(135deg,#2d5a1b,#4a7c2f)',emoji:'🌿',label:'Full canopy',time:'9:12 AM',main:true},{bg:'linear-gradient(135deg,#1a3a0a,#2d5a1b)',emoji:'🌲',label:'Trunk close-up',time:'9:14 AM'},{bg:'linear-gradient(135deg,#3B6D11,#639922)',emoji:'🍃',label:'New shoots',time:'9:16 AM'}] },
  { date:'10 Jan 2026', height:'8.1 m', diam:'21 cm', note:'Some yellowing on lower leaves — likely seasonal.', photos:[{bg:'linear-gradient(135deg,#1e3d0f,#2d5a1b)',emoji:'🌳',label:'Full tree',time:'10:05 AM',main:true},{bg:'linear-gradient(135deg,#27500A,#3B6D11)',emoji:'🍂',label:'Lower leaves',time:'10:08 AM'}] },
  { date:'15 Jul 2025', height:'7.6 m', diam:'21 cm', note:'Measurement only. Camera not available. Tree looks healthy overall.', photos:[] }
];

// Toggle dropdown

function toggleDD() {
  var dd = document.getElementById('dropdown');
  dd.classList.toggle('open');
}


// Close dropdown on outside click
document.addEventListener('click', function(e) {
  var dd = document.getElementById('dropdown');
  if (!e.target.closest('.main-topbar')) {
    dd.classList.remove('open');
  }
  var ld = document.getElementById('logout-drop');
  if (ld && !e.target.closest('.avatar')) {
    ld.classList.remove('open');
  }
  var lsd = document.getElementById('logout-drop-surveyor');
  if (lsd && !e.target.closest('.avatar')) {
    lsd.classList.remove('open');
  }
  var sld = document.getElementById('slogout-drop');
  if (sld && !e.target.closest('.savatar')) {
    sld.classList.remove('open');
  }
  var cld = document.getElementById('clogout-drop');
  if (cld && !e.target.closest('.savatar')) {
    cld.classList.remove('open');
  }
  var ald = document.getElementById('alogout-drop');
  if (ald && !e.target.closest('.avatar')) {
    ald.classList.remove('open');
  }
});


function toggleLogoutDrop() {
  document.getElementById('logout-drop').classList.toggle('open');
}

function toggleTreeCard(btn) {
  var card = btn.closest('.tcard');
  if (!card) return;
  var coll = card.querySelector('.tcard-collapse');
  var ic = btn.querySelector('i');
  var open = coll.style.display === 'block';
  coll.style.display = open ? 'none' : 'block';
  ic.className = open ? 'ti ti-chevron-down' : 'ti ti-chevron-up';
}

function rangerRegister() {
  var cards = document.getElementById('ranger-tree-cards');
  var n = cards ? cards.querySelectorAll('.tree-card-sponsor').length : 0;
  if (n >= max_register_ten_trees_ranger) {
    showRegisterStatus('limit');
    return;
  }
  goTo('scan');
}










// Navigation

function goTo(page) {
  if (page === 'tree-logs') {
    var activePage = document.querySelector('.page.active');
    if (activePage) {
      var fromPage = activePage.id.replace('page-', '');
      if (fromPage !== 'album' && fromPage !== 'profile') {
        treeLogsFrom = fromPage;
      }
    }
  }
  
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('page-'+page).classList.add('active');
  var sb = document.getElementById('sbar');
  sb.className = 'status-bar';
  if (['main','role-login','role-login','ranger-login','ranger-dash','surveyor-login','surveyor-dash','trees','admin-login','admin-dash','admin-trees','admin-edit-tree','admin-add-tree','admin-trackers','admin-sponsors','admin-trackers-prospective','admin-sponsors-prospective','ranger-enroll','sponsor-enroll','surveyor-enroll','role-login'].indexOf(page) > -1) sb.classList.add('dark');
  else if (['sponsor-login','sponsor-dash','caregiver-login','caregiver-dash'].indexOf(page) > -1) sb.classList.add('blue');
  document.getElementById('dropdown').classList.remove('open');
  var alogout = document.getElementById('alogout-drop');
  if (alogout) alogout.classList.remove('open');
  
  if (page === 'main') {
    applyFilters();
  }
}



function treeLogsBack() {
  goTo(treeLogsFrom);
}


// Password toggle

function togglePw(id, btn) {
  var inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.querySelector('i').className = inp.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}


// Search tree - searches scientific, english and local names

function searchById() {
  applyFilters();
}



function searchTree() {
  searchById();
}


// Open profile

function openProfile(treeId) {
  var from = document.querySelector('.page.active').id.replace('page-','');
  profileFrom = from;
  var id = treeId || '625001-06-0001';
  document.getElementById('profile-id-label').textContent = id;
  goTo('profile');
}


// Open the map pinned to a tree by its ID (from a card)

function openTreeMapById(id) {
  var tree = null;
  for (var i = 0; i < albumData.length; i++) {
    if (albumData[i].treeId === id) { tree = albumData[i]; break; }
  }
  if (tree && typeof tree.latitude === 'number' && typeof tree.longitude === 'number') {
    showMap(tree.latitude + ',' + tree.longitude);
  } else {
    alert('Location not available for this tree.');
  }
}



function profileBack() { goTo(profileFrom); }


// Open the map pinned to the tree currently shown in the profile

function openTreeMap() {
  var id = document.getElementById('profile-id-label').textContent;
  var tree = null;
  for (var i = 0; i < albumData.length; i++) {
    if (albumData[i].treeId === id) { tree = albumData[i]; break; }
  }
  if (tree && typeof tree.latitude === 'number' && typeof tree.longitude === 'number') {
    showMap(tree.latitude + ',' + tree.longitude);
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


// Album

function openAlbum(i) {
  var log = logs[i];
  if (!log.photos.length) return;
  albumFrom = document.querySelector('.page.active').id.replace('page-','');
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


// Helper: location read from address ("School, pincode, Tamil Nadu" -> "School")


// Helper: location read from address ("School, pincode, Tamil Nadu" -> "School")

function treeLoc(t) { return t.address ? t.address.split(', ')[0] : ''; }


// Album render - additive filters: place (address) + tree name (scientific/english/local)

function renderAlbum(place, tree) {
  var grid = document.getElementById('album-grid');
  if (!grid) return;
  grid.innerHTML = '';
  
  var q = function(s){ return s ? String(s).toLowerCase() : ''; };
  place = q(place);
  tree = q(tree);
  
  var filtered = albumData.filter(function(t) {
    var matchPlace = true;
    var matchTree = true;
    if (place) matchPlace = q(t.address).indexOf(place) > -1 || q(t.addressLocalLang || '').indexOf(place) > -1 || q(t.pincode || '').indexOf(place) > -1 || q(t.project || '').indexOf(place) > -1;
    if (tree) {
      matchTree = q(t.scientificName).indexOf(tree) > -1 ||
                  q(t.englishName).indexOf(tree) > -1 ||
                  q(t.localName).indexOf(tree) > -1;
    }
    return matchPlace && matchTree;
  });
  
  var countEl = document.getElementById('album-count');
  if (countEl) countEl.textContent = filtered.length + ' trees';

  var summaryEl = document.getElementById('album-summary');
  window._mapTrees = filtered;
  if (summaryEl) {
    if (filtered.length > 0) {
      var groups = {};
      filtered.forEach(function(t) {
        groups[t.englishName] = (groups[t.englishName] || 0) + 1;
      });
      var chips = Object.keys(groups).map(function(k) {
        return '<span class="album-chip chip-click" onclick="filterByTree(\'' + k + '\')">' + k + ' <b>– ' + groups[k] + '</b></span>';
      }).join('');
      summaryEl.innerHTML = chips;
      var mapBtn = document.createElement('button');
      mapBtn.type = 'button';
      mapBtn.className = 'map-btn';
      mapBtn.innerHTML = '<i class="ti ti-map-2"></i> Show in map';
      mapBtn.onclick = openMap;
      summaryEl.appendChild(mapBtn);
      summaryEl.style.display = window._summaryOpen === false ? 'none' : 'flex';
    } else {
      summaryEl.style.display = 'none';
      summaryEl.innerHTML = '';
    }
    var toggle = document.getElementById('summary-toggle');
    if (toggle) toggle.classList.toggle('off', window._summaryOpen === false);
  }
  
  if (filtered.length === 0) {
    grid.innerHTML = '<div class="no-trees">No trees found</div>';
    return;
  }
  
  filtered.forEach(function(t) {
    var card = document.createElement('div');
    card.className = 'tree-card';
    card.onclick = function() {
      openProfile(t.treeId);
    };
    
    var photo = document.createElement('div');
    photo.className = 'tree-photo';
    photo.style.background = t.bg;
    photo.innerHTML = '<button class="card-pin-btn" type="button" title="Show in map" onclick="event.stopPropagation();openTreeMapById(\'' + t.treeId + '\')"><i class="ti ti-map-pin" style="font-size:0.8rem"></i></button><div class="tree-emoji">' + t.emoji + '</div><div class="tree-location">' + treeLoc(t) + '</div>';
    
    var info = document.createElement('div');
    info.className = 'tree-info';
    info.innerHTML = 
      '<div class="tree-id">' + t.treeId + '</div>' +
      '<div class="tree-name">' + t.englishName + '</div>' +
      '<div class="tree-stats">' +
        '<span>📏 ' + t.height + '</span>' +
        '<span>📐 ' + t.diameter + '</span>' +
        '<span>📋 ' + t.logs + '</span>' +
      '</div>' +
      '<div class="tree-meta">' +
        (function(){ var c = t.cards && t.cards[t.cards.length - 1] || {}; return '' +
        '<div>👀 Encounter <b>' + (c.encounter != null ? c.encounter : 0) + '</b> · 📋 Logs <b>' + t.logs + '</b></div>' +
        '<div>Registered by <b>' + (c.registeredBy || '—') + '</b> · ' + (c.registrationDate || '—') + '</div>' +
        '<div>ID <b>' + (c.updaterId || c.registererId || '—') + '</b> · Updated by <b>' + (c.updatedBy || '—') + '</b> · ' + (c.updatedDate || '—') + '</div>'; })() +
      '</div>';
    
    card.appendChild(photo);
    card.appendChild(info);
    grid.appendChild(card);
  });
}



function applyFilters() {
  var place = document.getElementById('album-place').value.trim();
  var tree = document.getElementById('album-tree').value.trim();
  renderAlbum(place, tree);
}


// Toggle summary panel visibility (sticky via re-render)

function toggleSummary() {
  window._summaryOpen = window._summaryOpen === false ? true : false;
  var toggle = document.getElementById('summary-toggle');
  if (toggle) toggle.classList.toggle('off', window._summaryOpen === false);
  applyFilters();
}


// Clicking a summary chip fills the tree-name box and re-applies (additive)

function filterByTree(name) {
  var el = document.getElementById('album-tree');
  el.value = name;
  var btn = el.parentNode.querySelector('.clear-btn');
  if (btn) btn.disabled = false;
  applyFilters();
}


// Dirty-state: X clear button disabled (greyed) when the filter has no value

function onInput(el) {
  var btn = el.parentNode.querySelector('.clear-btn');
  if (btn) btn.disabled = !el.value;
  applyFilters();
}


// Clear a filter's value

function clearInput(id) {
  var el = document.getElementById(id);
  el.value = '';
  var btn = el.parentNode.querySelector('.clear-btn');
  if (btn) btn.disabled = true;
  applyFilters();
}


// Spread the current result set over Google Maps (one pin per tree)

function openMap() {
  var trees = window._mapTrees || albumData;
  var coords = trees.filter(function(t){
    return typeof t.latitude === 'number' && typeof t.longitude === 'number';
  }).map(function(t){
    return t.latitude + ',' + t.longitude;
  });
  if (coords.length > 0) {
    showMap(coords.join('|'));
  } else {
    alert('No tree locations found to show on the map.');
  }
}


function loadTreeData(cb) {
  if (window.TREE_CARDS_DATA) { window.__TREE_DATA = window.TREE_CARDS_DATA; if (cb) { cb(); } return; }
  var d = null;
  try { if (window.name && window.name.indexOf('TREE_DATA_V1=') === 0) { d = window.name.slice(13); } } catch (e) {}
  if (d) { try { window.__TREE_DATA = JSON.parse(d); if (cb) { cb(); } return; } catch (e) {} }
  try { var s = localStorage.getItem('treeDataV1'); if (s) { window.__TREE_DATA = JSON.parse(s); if (cb) { cb(); } return; } } catch (e) {}
  if (cb) { cb(); }
}
function treeCardHtml(t, cfg) {
  var q = String.fromCharCode(39);
  cfg = cfg || {};
  var c = t.card || {};
  var enc = t.encounter || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last.status || {};
  var addr = (cfg.addrMode === 'full' && c.addrFull) ? c.addrFull : (t.address || c.addr || '');
  var status = t.past ? (c.status || '') : (cfg.verb === 'logged' ? (c.statusLogged || c.statusChecked || st.health || '') : (c.statusChecked || c.statusLogged || st.health || ''));
  var latest = (cfg.showLatest && c.latest) ? '<div class="tcard-latest"><i class="ti ti-timeline" style="font-size:0.7333rem;flex-shrink:0"></i><span>' + c.latest + '</span></div>' : '';
  var todo = (cfg.showTodo && c.todo) ? '<div class="tcard-todo"><i class="ti ti-clipboard-check" style="font-size:0.7333rem;flex-shrink:0"></i><span>' + c.todo + '</span></div>' : '';
  var btn2Type = (cfg.btn2 !== undefined) ? cfg.btn2 : (c.btn2 || null);
  var btn2 = '';
  if (btn2Type === 'profile') {
    btn2 = cfg.btn2GoTo ? '<button class="tcbtn tcbtn-pay" onclick="goTo(' + q + 'profile' + q + ')"><i class="ti ti-leaf" style="font-size:0.8667rem"></i> Tree profile</button>'
                       : '<button class="tcbtn tcbtn-pay" onclick="openProfile(' + q + t.treeId + q + ')"><i class="ti ti-leaf" style="font-size:0.8667rem"></i> Tree profile</button>';
  }
  if (btn2Type === 'payments') { btn2 = '<button class="tcbtn tcbtn-pay" onclick="goTo(' + q + 'pay-logs' + q + ')"><i class="ti ti-receipt" style="font-size:0.8667rem"></i> Payments</button>'; }
  return '<div class="tree-card-sponsor tcard">' +
    '<div class="tcard-head"><div class="tcard-row"><span class="tcard-id">' + (t.emoji || c.emoji || '') + ' ' + t.treeId + '</span><button class="tcard-toggle" type="button" onclick="toggleTreeCard(this)"><i class="ti ti-chevron-down"></i></button></div>' +
    '<div class="tcard-addr"><i class="ti ti-map-pin" style="font-size:0.6667rem"></i> ' + addr + '</div></div>' +
    '<div class="tcard-collapse" style="display:none;"><div class="tcard-img" style="background:' + (t.bg || c.bg || '') + ';">' + (t.emoji || c.emoji || '') + '</div>' + latest +
    '<div class="tcard-stats"><div class="tcard-stat"><div class="tcard-stat-lbl">Height</div><div class="tcard-stat-val">' + (st.height || c.height || '—') + '</div></div><div class="tcard-stat"><div class="tcard-stat-lbl">Diameter</div><div class="tcard-stat-val">' + (st.diameter || c.diameter || '—') + '</div></div><div class="tcard-stat"><div class="tcard-stat-lbl">Logs</div><div class="tcard-stat-val">' + (keys.length || c.logs || 0) + '</div></div></div>' +
    '<div class="tcard-status"><div class="status-dot" style="background:' + (c.statusDot || '#4ade80') + '"></div><div class="status-txt">' + status + '</div></div>' + todo +
    '<div class="tcard-btns"><button class="tcbtn tcbtn-logs" onclick="goTo(' + q + 'tree-logs' + q + ')"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button>' + btn2 + '</div></div></div>';
}
function renderRoleCards(target, role, cfg) {
  var el = document.getElementById(target);
  if (!el) { return; }
  var data = window.__TREE_DATA || [];
  var list = data.filter(function (t) { return t.roles && t.roles.indexOf(role) > -1; });
  el.innerHTML = list.map(function (t) { return treeCardHtml(t, cfg); }).join('');
}

loadTreeData(function () { renderRoleCards('page-trees-cards', 'ten-trees-ranger', { verb: 'logged', showLatest: false, showTodo: false, btn2: 'profile', btn2GoTo: true, addrMode: 'short' }); });

var hubMode = new URLSearchParams(location.search).get('hub');
if (hubMode === 'login') { goTo('role-login'); }
else if (hubMode === 'register') { goTo('role-login'); }

