
var TESTING_MODE = true;
var profileFrom = 'caregiver-login';
var albumFrom = 'profile';
var treeLogsFrom = 'trees';
var caregiveredCount = 0;
var caredCount = 4;
var logoutTarget = 'caregiver-login';

function getCaregiverLang() {
  if (typeof appLang !== 'undefined' && appLang) return appLang;
  if (typeof filterLang !== 'undefined' && filterLang) return filterLang;
  try { return sessionStorage.getItem('nm-app-lang') || 'en'; } catch (e) { return 'en'; }
}
function caregiverCardName(t) {
  if (!t) return '';
  if (typeof storage !== 'undefined' && storage.treeNameIn) { try { return storage.treeNameIn(t, getCaregiverLang()) || ''; } catch (e) {} }
  var n = (t.speciesName) || {};
  var lang = getCaregiverLang();
  return n[lang] || n.en || n.ta || t.englishName || t.name || '';
}
function caregiverCardAddr(t) {
  if (!t) return '';
  var lang = getCaregiverLang();
  var a = (t.address) || {};
  if (typeof a === 'string') return a;
  return a[lang] || a.en || a.ta || '';
}

function loginCheckCaregiver() {
  var r = window._login || null;
  if (r && r['tree-login'] && r['tree-login'].caregiver && r['tree-login'].caregiver.loggedIn) {
    return true;
  }
  goTo('caregiver-login');
  return false;
}
function loadCurrentUser() {
  try {
    var s = sessionStorage.getItem('loginCredentialsV1');
    if (!s) { return; }
    var cred = JSON.parse(s);
    var role = cred['tree-login'] && cred['tree-login']['caregiver'];
    if (!role) { return; }
    var nameEl = document.getElementById('user-name');
    var avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = role.name;
    if (avatarEl) avatarEl.textContent = role.avatar;
    window._login = cred;
  } catch (e) {}
}
loadCurrentUser();

function checkNewCaregiverTrees() {
  var caregiver_waiting_str = sessionStorage.getItem('caregiverWaiting');
  if (caregiver_waiting_str === null) return [];
  var new_ids = [];
  try { var arr = JSON.parse(caregiver_waiting_str); if (Array.isArray(arr)) new_ids = arr.filter(function(e){ return typeof e === 'string' && e; }); } catch (e) { new_ids = []; }
  if (!new_ids.length) return [];
  try {
    var _login_chk = storage.get('login') || window._login || null;
    if (!_login_chk) { var _s = sessionStorage.getItem('loginCredentialsV1'); if (_s) _login_chk = JSON.parse(_s); }
    var _caregiver_chk = _login_chk && _login_chk['tree-login'] && _login_chk['tree-login']['caregiver'];
    if (!_caregiver_chk || !_caregiver_chk.userId) {
      goTo('caregiver-login');
      return new_ids;
    }
  } catch (e) {}
  var ram_data = storage.get('treeCards') || window.__TREE_DATA || [];
  var pending_trees = [];
  for (var i = 0; i < new_ids.length; i++) { var id = new_ids[i]; for (var r = 0; r < ram_data.length; r++) { if (ram_data[r].treeId === id) { pending_trees.push(ram_data[r]); break; } } }
  if (pending_trees.length) openCaregiverSeeingModal(pending_trees);
  return new_ids;
}

function continueAsCaregiver() {
  console.log('[caregiver] continueAsCaregiver click pending', sessionStorage.getItem('pendingCare'));
  try {
    var _lc = window._login || storage.get('login') || {};
    if (_lc && _lc['tree-login'] && _lc['tree-login'].caregiver) { _lc['tree-login'].caregiver.loggedIn = true; storage.set('login', _lc); window._login = _lc; }
  } catch (e) {}
  var _r2 = updateWaitingListFromPendingCaregiver();
  if (!_r2) { goTo('caregiver-dash'); loadDashboard(); }
}
function updateWaitingListFromPendingCaregiver() {
  try {
    var raw_data = sessionStorage.getItem('pendingCare');
    console.log('[caregiver] updateWaitingListFromPendingCaregiver raw', raw_data);
    if (!raw_data) { goTo('caregiver-dash'); return false; }
    var pending_data = JSON.parse(raw_data);
    var pending_tree_id = null;
    for (var pending_key in pending_data) { if (Object.prototype.hasOwnProperty.call(pending_data, pending_key)) { pending_tree_id = pending_data[pending_key]; break; } }
    if (!pending_tree_id) { goTo('caregiver-dash'); return false; }
    var existing_list = isTreeIdAlreadyInCaregiverLists(pending_tree_id);
    if (existing_list) {
      try { sessionStorage.removeItem('pendingCare'); } catch (e) {}
      openCaregiverConflictModal(pending_tree_id, existing_list);
      return true;
    }
    try { sessionStorage.removeItem('pendingCare'); } catch (e) {}
    caregiverATree({ treeId: pending_tree_id });
    return true;
  } catch (e) { console.log('[caregiver] updateWaitingListFromPendingCaregiver error', e); goTo('caregiver-dash'); return false; }
}
function isTreeIdAlreadyInCaregiverLists(check_tree_id) {
  var login_data = window._login || {};
  var tree_login = login_data['tree-login'] || {};
  var caregiver_role = tree_login.caregiver || {};
  var caregiver_cards = caregiver_role.cards || {};
  var waiting_list = caregiver_cards.waiting || [];
  var current_list = caregiver_cards.current || [];
  var past_list = caregiver_cards.past || [];
  var waiting_ids = waiting_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var current_ids = current_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var past_ids = past_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var is_in_waiting = waiting_ids.indexOf(check_tree_id) > -1;
  var is_in_current = current_ids.indexOf(check_tree_id) > -1;
  var is_in_past = past_ids.indexOf(check_tree_id) > -1;
  return is_in_waiting ? 'waiting' : is_in_current ? 'current' : is_in_past ? 'past' : null;
}
function openCaregiverConflictModal(conflict_tree_id, conflict_list) {
  var title_el = document.getElementById('conflict-title');
  var text_el = document.getElementById('conflict-text');
  if (title_el) title_el.textContent = 'Already in ' + conflict_list;
  if (text_el) text_el.textContent = 'Tree ' + conflict_tree_id + ' is already in your ' + conflict_list + ' list.';
  document.getElementById('conflict-resolution-modal').classList.add('open');
}
function closeCaregiverConflictModal() {
  document.getElementById('conflict-resolution-modal').classList.remove('open');
}
function handleCaregiverLoginOkay() {
  var modal_el = document.getElementById('login-status-modal');
  if (modal_el) modal_el.classList.remove('open');
  try {
    var _lc2 = window._login || storage.get('login') || {};
    if (_lc2 && _lc2['tree-login'] && _lc2['tree-login'].caregiver) { _lc2['tree-login'].caregiver.loggedIn = true; storage.set('login', _lc2); window._login = _lc2; }
  } catch (e) {}
  var _r = updateWaitingListFromPendingCaregiver();
  if (!_r) { goTo('caregiver-dash'); loadDashboard(); }
}
function caregiverLogout() {
  try {
    if (window.parent && window.parent.goNav) { window.parent.goNav('login-hub.html'); return; }
    if (window.top && window.top.goNav) { window.top.goNav('login-hub.html'); return; }
  } catch (e) {}
  window.top.location.href = 'login-hub.html';
}
document.addEventListener('DOMContentLoaded', function() {
  try {
    var cred = null;
    try { cred = storage.get('login'); } catch (e) {}
    if (!cred) { var s = sessionStorage.getItem('loginCredentialsV1'); if (s) cred = JSON.parse(s); }
    var role = cred && cred['tree-login'] && cred['tree-login']['caregiver'];
    if (role) {
      var btn = document.getElementById('continue-as-btn');
      var name_el = document.getElementById('continue-as-name');
      if (btn) btn.style.display = 'flex';
      if (name_el) name_el.textContent = role.name || 'Caregiver';
    }
  } catch (e) {}
});

var loginStatusData = {
  waiting:   { icon:'ti ti-clock',        color:'#f59e0b', bg:'#fef3c7', title:'Application under review',  text:'Your login request is waiting for admin approval. We will notify you once it is reviewed.' },
  rejected:  { icon:'ti ti-x',            color:'#dc2626', bg:'#fee2e2', title:'Application rejected',      text:'Your login request was rejected. Please contact support if you think this is a mistake.' },
  approved:  { icon:'ti ti-check',        color:'#16a34a', bg:'#dcfce7', title:'Login approved',            text:'Welcome! Your login was approved. You can now continue to your dashboard.' },
  withdrawn: { icon:'ti ti-user-off',     color:'#64748b', bg:'#e2e8f0', title:'Access withdrawn',          text:'Your access has been withdrawn. Please contact the administrator for details.' }
};

var registerStatusData = {
  waiting:          { icon:'ti ti-clock',       color:'#f59e0b', bg:'#fef3c7', title:'Application under review',  text:'Your registration is waiting for admin approval. We will notify you once it is reviewed.', go:'Login' },
  existing_member:  { icon:'ti ti-user-check',  color:'#16a34a', bg:'#dcfce7', title:'Already registered',        text:'An account with this email already exists. Please log in instead of registering again.', go:'Login', to:'caregiver-login' },
  blocked:          { icon:'ti ti-ban',         color:'#dc2626', bg:'#fee2e2', title:'Registration blocked',       text:'Your registration has been blocked. Please contact support if you think this is a mistake.', go:'Contact us', to:'caregiver-login' }
};

// Register status modal — waiting / existing_member / blocked
var regTarget = 'caregiver-login';

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


// Tree data for album — read from storage
var albumData = [];

var logs = [];
function loadLogsFromRam() {
  var ram_data = window.__TREE_DATA || storage.get('treeCards') || [];
  var target_id = (ram_data[0] && ram_data[0].treeId) || '';
  var target_tree = null;
  for (var i = 0; i < ram_data.length; i++) { if (ram_data[i].treeId === target_id) { target_tree = ram_data[i]; break; } }
  if (!target_tree && ram_data.length) target_tree = ram_data[0];
  if (!target_tree) { logs = []; return; }
  var enc = target_tree['encounters-list'] || {};
  var keys = Object.keys(enc);
  logs = keys.map(function(k){
    var e = enc[k] || {};
    var hs = e['health-status'] || {};
    var photos = (e.photos && e.photos.snapshots) || [];
    return {
      date: e.registeredDate || e.updatedDate || k,
      height: hs.height || '—',
      diam: hs.diameter || '—',
      note: (e.fieldObservation && e.fieldObservation.notes) || '',
      photos: photos.map(function(p, idx){ return {bg:'linear-gradient(135deg,#2d5a1b,#4a7c2f)', emoji: target_tree.emoji || '🌳', label:'Photo '+(idx+1), time: e.registeredDate || '', main: idx===0}; })
    };
  });
}



// Close dropdown on outside click
document.addEventListener('click', function(e) {
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






function toggleSLogoutDrop() {
  document.getElementById('slogout-drop').classList.toggle('open');
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
  if (['caregiver-login','caregiver-enroll','ranger-login','ranger-dash','surveyor-login','surveyor-dash','trees','admin-login','admin-dash','admin-trees','admin-edit-tree','admin-add-tree','admin-trackers','admin-caregivers','admin-trackers-prospective','admin-caregivers-prospective','ranger-enroll','caregiver-enroll','surveyor-enroll','role-login'].indexOf(page) > -1) sb.classList.add('dark');
  else if (['caregiver-login','caregiver-dash','caregiver-waiting','caregiver-current','caregiver-past','caregiver-seeing','caregiver-checks-due','caregiver-checks-finished','caregiver-logs-approved','caregiver-logs-submitted','caregiver-browse','selfie','register-tree','caregiver-login','caregiver-dash'].indexOf(page) > -1) sb.classList.add('blue');
  var alogout = document.getElementById('alogout-drop');
  if (alogout) alogout.classList.remove('open');
  
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


// Open profile — clone sponsor: navigate to tree-profile.html with treeId

function openProfile(treeId) {
  var id = treeId || '625501-06-0001';
  var active_el = document.querySelector('.page.active');
  var current_hub = active_el ? active_el.id.replace('page-','') : 'caregiver-dash';
  var parent_url = encodeURIComponent('care-giver.html?hub=' + current_hub);
  try { sessionStorage.setItem('gobackFromTreeProfile', decodeURIComponent(parent_url)); } catch (e) {}
  var user_id = '';
  try {
    var login_data = storage.get('login') || window._login || {};
    var caregiver_role = (login_data['tree-login'] && login_data['tree-login']['caregiver']) || {};
    user_id = caregiver_role.userId || new URLSearchParams(location.search).get('userid') || '';
  } catch (e) {}
  var user_param = user_id ? '&userid=' + encodeURIComponent(user_id) : '';
  var flang_val = (typeof filterLang !== 'undefined' ? filterLang : (typeof appLang !== 'undefined' ? appLang : 'en'));
  window.location.href = 'tree-profile.html?treeId=' + encodeURIComponent(id) + '&parent=' + parent_url + '&flang=' + encodeURIComponent(flang_val) + user_param;
}


// Open the map pinned to a tree by its ID (from a card)

function openTreeMapById(id) {
  var tree = null;
  for (var i = 0; i < albumData.length; i++) {
    if (albumData[i].treeId === id) { tree = albumData[i]; break; }
  }
  if (hasTreeGis(tree)) {
    showInMap([id]);
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
  if (hasTreeGis(tree)) {
    showInMap([id]);
  } else {
    alert('Location not available for this tree.');
  }
}


function closeMapModal() {
  document.getElementById('map-modal').classList.remove('open');
  document.getElementById('map-frame').src = '';
}

function openTreeLogs(treeId) {
  var data = window.__TREE_DATA || storage.get('treeCards') || [];
  var tree = null;
  for (var i = 0; i < data.length; i++) { if (data[i].treeId === treeId) { tree = data[i]; break; } }
  if (!tree) return;
  var title_el = document.getElementById('tree-logs-title');
  if (title_el) title_el.textContent = (caregiverCardName(tree) || treeId) + ' — Logs';
  var list_el = document.getElementById('tree-logs-list');
  if (list_el) {
    var enc = tree['encounters-list'] || {};
    var keys = Object.keys(enc);
    var dots = ['#3B6D11','#9FE1CB','#C0DD97'];
    var html = '';
    for (var idx = keys.length - 1; idx >= 0; idx--) {
      var k = keys[idx];
      var e = enc[k] || {};
      var hs = e['health-status'] || {};
      var note_val = e.notes || (e.fieldObservation && e.fieldObservation.notes) || '';
      var rec_val = e.recommendations || (e.fieldObservation && e.fieldObservation.recommendations) || '';
      var c = tree.card || {};
      html += '<div class="log-tracker-entry" onclick="openAlbumForTree(\'' + treeId + '\', ' + idx + ')"><div class="log-dot" style="background:' + dots[idx % 3] + ';margin-top:4px;flex-shrink:0;width:7px;height:7px;border-radius:50%;"></div><div><div class="log-header"><span>#' + k + '</span><span>' + (e.registeredDate || e.updatedDate || k) + '</span></div><div class="log-text">Height ' + formatLength(hs.height||c.height,'height') + ' · Diameter ' + formatLength(hs.diameter||c.diameter,'diameter') + '</div><div class="log-text"><span style="color:#dc2626">Note:</span> ' + (note_val || '—') + '</div><div class="log-text"><span style="color:#dc2626">Recommendation:</span> ' + (rec_val || '—') + '</div>' + (e.photos && e.photos.snapshots && e.photos.snapshots.length ? '<div class="log-text"><span class="chip-blue"><i class="ti ti-photo" style="font-size:0.6667rem"></i>' + e.photos.snapshots.length + ' photos</span></div>' : '<div class="log-text">No photos</div>') + '</div></div>';
    }
    list_el.innerHTML = html || '<div style="font-size:0.8rem;color:var(--color-text-secondary);text-align:center;padding:20px;">No logs yet</div>';
  }
  loadLogsFromRam();
  goTo('tree-logs');
}
function openAlbumForTree(treeId, logIdx) {
  loadLogsFromRam();
  openAlbum(logIdx);
}


// Album

function openAlbum(i) {
  if (!logs.length) loadLogsFromRam();
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


// Add tree

function caregiverATree(f) {
  console.log('[caregiver] caregiverATree called', f);
  var login = window._login || (window._login = {});
  var tl = login['tree-login'] || (login['tree-login'] = {});
  var role = tl.caregiver || (tl.caregiver = {});
  var cards = role.cards || (role.cards = {});
  var waiting = cards.waiting || (cards.waiting = []);
  var waiting_ids = waiting.map(function(e){ return e.treeId; });
  if (f.treeId && waiting_ids.indexOf(f.treeId) === -1) { waiting.push({ treeId: f.treeId, addedAt: getCurrentAddedAtString() }); console.log('[caregiver] caregiverATree added to waiting', f.treeId); } else { console.log('[caregiver] caregiverATree already in waiting or no treeId', f.treeId); }
  appendCaregiverWaitingCard(f);
  storage.set('login', login);
  console.log('[caregiver] caregiverATree saved login waiting', waiting);
  if (window.render && typeof window.render.init === 'function') { window.render.init(); }
  setTimeout(function(){ console.log('[caregiver] caregiverATree open full waiting list'); openCaregiverWaitingRequests(); }, 700);
}

function setStatById(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function appendCaregiverWaitingCard(form) {
  var titleEl = document.getElementById('swaiting-page-title');
  if (titleEl) titleEl.textContent = 'Caregiver request';
  var btn = form.btn;
  if (btn) {
    btn.classList.add('added');
    btn.innerHTML = '<i class="ti ti-check"></i>';
    btn.onclick = null;
  }
  var id = form.treeId || (form.name && form.name.split('#')[1]) || '';
  var tree = null;
  try { tree = storage.pullTreeDetail ? storage.pullTreeDetail(id) : null; } catch (e) {}
  if (!tree) {
    var data = window.__TREE_DATA || storage.get('treeCards') || [];
    for (var i = 0; i < data.length; i++) { if (data[i].treeId === id) { tree = data[i]; break; } }
  }
  var enc = tree && tree['encounters-list'] || {};
  var keys = tree ? Object.keys(enc) : [];
  var last = tree && enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var full_name = tree ? (caregiverCardName(tree) || '') : '';
  var name = form.name || (tree ? (full_name ? full_name + ' #' + id : '#' + id) : '');
  var full_addr = tree ? caregiverCardAddr(tree) : '';
  var loc = form.loc || (tree ? (full_addr ? full_addr.split(', ')[0] : full_addr) : '');
  var bg = form.bg || (tree ? tree.bg || '' : '');
  var emoji = form.emoji || (tree ? tree.emoji || '🌳' : '🌳');
  var height = form.height != null ? form.height : (st.height || (tree && tree.card && tree.card.height) || '—');
  var diam = form.diam || st.diameter || (tree && tree.card && tree.card.diameter) || '—';
  var logs = form.logs != null ? form.logs : (keys.length || (tree && tree.encounters) || 0);
  var cardsEl = document.getElementById('caregiver-waiting-cards');
  var emptyEl = document.getElementById('caregiver-waiting-empty');
  if (emptyEl) emptyEl.style.display = 'none';
  if (!cardsEl) { return; }
  var card = document.createElement('div');
  card.className = 'tree-card-caregiver';
  var height_display = height === '—' ? '—' : String(height).replace(/\s*m$/, '') + 'm';
  card.innerHTML = '<div class="tree-card-hero" style="background:'+bg+';cursor:pointer;position:relative;" onclick="openProfile(\''+id+'\')"><button class="card-pin-btn" type="button" onclick="event.stopPropagation();openTreeMapById(\''+id+'\')"><i class="ti ti-map-pin" style="font-size:0.8rem"></i></button><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>'+emoji+' '+name+'</h3><p><i class="ti ti-map-pin" style="font-size:0.6rem"></i> '+loc+'</p></div></div><div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">'+height_display+'</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">'+diam+'</div></div><div class="tcs"><div class="tcs-label">Logs</div><div class="tcs-val">'+logs+'</div></div></div><div class="tree-card-status"><div class="status-dot" style="background:#f59e0b"></div><div class="status-txt">Waiting approval</div></div></div><div class="tree-card-btns"><button class="tcbtn tcbtn-logs" onclick="goTo(\'tree-logs\')" style="width:100%"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button></div>';
  cardsEl.appendChild(card);
  console.log('[caregiver] appendCaregiverWaitingCard added card', id, 'now count', cardsEl.querySelectorAll('.tree-card-caregiver').length);
  setStatById('c-care-waiting', cardsEl.querySelectorAll('.tree-card-caregiver').length);
  setTimeout(function(){ console.log('[caregiver] appendCaregiverWaitingCard goTo caregiver-waiting'); goTo('caregiver-waiting'); }, 500);
}

function getCurrentAddedAtString() {
  var now_date = new Date();
  var yyyy = String(now_date.getFullYear());
  var mm = String(now_date.getMonth() + 1).padStart(2, '0');
  var dd = String(now_date.getDate()).padStart(2, '0');
  var hh = String(now_date.getHours()).padStart(2, '0');
  var mi = String(now_date.getMinutes()).padStart(2, '0');
  var ss = String(now_date.getSeconds()).padStart(2, '0');
  return yyyy + mm + dd + 'T' + hh + mi + ss;
}
function getSortedWaitingList(waiting_list, sort_order) {
  var sorted_list = (waiting_list || []).slice();
  sorted_list.sort(function(a, b) {
    var a_time = a.addedAt || 0;
    var b_time = b.addedAt || 0;
    var a_is_str = typeof a_time === 'string';
    var b_is_str = typeof b_time === 'string';
    if (a_is_str && b_is_str) { return sort_order === 'asc' ? a_time.localeCompare(b_time) : b_time.localeCompare(a_time); }
    if (a_is_str) { a_time = parseInt(a_time.replace(/\D/g, ''), 10) || 0; }
    if (b_is_str) { b_time = parseInt(b_time.replace(/\D/g, ''), 10) || 0; }
    return sort_order === 'asc' ? a_time - b_time : b_time - a_time;
  });
  return sorted_list;
}
function openCaregiverWaitingRequests() {
  var titleEl = document.getElementById('swaiting-page-title');
  if (titleEl) titleEl.textContent = 'Caregiver request';
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  var waiting_raw = (role.cards || {}).waiting || [];
  var sorted_waiting = getSortedWaitingList(waiting_raw, 'desc');
  var ids = sorted_waiting.map(function(e){ return e.treeId; });
  var added_map = {};
  sorted_waiting.forEach(function(e){ added_map[e.treeId] = e.addedAt; });
  var data = window.__TREE_DATA || [];
  var requestList = ids.map(function(id){ for(var i=0;i<data.length;i++){ if(data[i].treeId===id) { var copy_t = {}; for(var k in data[i]) copy_t[k]=data[i][k]; copy_t.addedAt = added_map[id]; return copy_t; } } return null; }).filter(function(t){ return !!t; });
  var cardsEl = document.getElementById('caregiver-waiting-cards');
  var emptyEl = document.getElementById('caregiver-waiting-empty');
  if (cardsEl) cardsEl.innerHTML = requestList.map(caregiverSubmittedCardHtml).join('');
  if (emptyEl) emptyEl.style.display = requestList.length ? 'none' : 'block';
  goTo('caregiver-waiting');
}

function openWaitingRequests(type) {
  var is_care = String(type || 'care').toLowerCase().indexOf('care') > -1;
  var care_el = document.getElementById('care-waiting-section');
  var reg_el = document.getElementById('register-waiting-section');
  var title_el = document.getElementById('waiting-page-title') || document.getElementById('swaiting-page-title');
  if (title_el) title_el.textContent = is_care ? 'Care requests' : 'Register requests';
  if (care_el) care_el.style.display = is_care ? '' : 'none';
  if (reg_el) reg_el.style.display = is_care ? 'none' : '';
  var waiting_cards = document.getElementById('caregiver-waiting-cards');
  var register_cards = document.getElementById('register-waiting-cards');
  if (is_care) {
    openCaregiverWaitingRequests();
    if (reg_el) reg_el.style.display = 'none';
    if (care_el) care_el.style.display = '';
  } else {
    if (waiting_cards) waiting_cards.innerHTML = '';
    if (register_cards) register_cards.innerHTML = '<div class="waiting-empty">No register requests</div>';
    goTo('caregiver-waiting');
    if (care_el) care_el.style.display = 'none';
    if (reg_el) reg_el.style.display = '';
  }
}

function openCaregiverSeeing() {
  checkNewCaregiverTrees();
}

function caregiverSeeingCardHtml(t) {
  var q = String.fromCharCode(39);
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var status = c.statusLogged || c.statusChecked || st.health || '';
  var name_txt = caregiverCardName(t) || t.englishName || t.name || '';
  var addr_txt = caregiverCardAddr(t) || c.addr || '';
  return '<div class="sponsor-tree-card">'
    + '<div class="tree-card-hero" style="background:' + (t.bg || c.bg || '') + '" onclick="openProfile(' + q + t.treeId + q + ')"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (t.emoji || c.emoji || '') + ' ' + name_txt + ' <span class="tcard-id">' + t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + q + t.treeId + q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + addr_txt + '</span></p></div></div>'
    + '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Health</div><div class="tcs-val">' + (st.health || status || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (formatLength(st.height||c.height,'height') || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (formatLength(st.diameter||c.diameter,'diameter') || '—') + '</div></div></div></div>'
    + '<div class="caregiver-seeing-actions"><button class="tcbtn tcbtn-logs" onclick="event.stopPropagation();confirmPendingCaregiver(' + q + t.treeId + q + ')"><i class="ti ti-check"></i> Confirm</button><button class="tcbtn tcbtn-danger" onclick="event.stopPropagation();removePendingCaregiver(' + q + t.treeId + q + ')"><i class="ti ti-trash"></i> Decline</button></div>'
    + '</div>';
}

function openCaregiverSeeingModal(pending_trees) {
  var grid = document.getElementById('caregiver-seeing-grid');
  var empty = document.getElementById('caregiver-seeing-empty');
  if (grid) grid.innerHTML = pending_trees.map(caregiverSeeingCardHtml).join('');
  if (empty) empty.style.display = pending_trees.length ? 'none' : 'block';
  goTo('caregiver-seeing');
  window._caregiverSeeingBack = 'caregiver-dash';
}

function closeCaregiverSeeingModal() { goTo('caregiver-dash'); }

function confirmPendingCaregiver(tree_id) {
  try {
    var list = JSON.parse(sessionStorage.getItem('caregiverWaiting') || '[]');
    caregiverATree({ treeId: tree_id });
    var idx = list.indexOf(tree_id);
    if (idx > -1) { list.splice(idx, 1); sessionStorage.setItem('caregiverWaiting', JSON.stringify(list)); }
  } catch (e) {}
  closeCaregiverSeeingModal(); if (window.render && typeof window.render.init === 'function') window.render.init();
}

function removePendingCaregiver(tree_id) {
  var list = [];
  try { list = JSON.parse(sessionStorage.getItem('caregiverWaiting') || '[]'); } catch (e) {}
  var idx = list.indexOf(tree_id);
  if (idx > -1) list.splice(idx, 1);
  sessionStorage.setItem('caregiverWaiting', JSON.stringify(list));
  if (list.length) checkNewCaregiverTrees();
  else { closeCaregiverSeeingModal(); if (window.render && typeof window.render.init === 'function') window.render.init(); }
}

function caregiverBaseData(t) {
  var q = String.fromCharCode(39);
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var status = c.statusLogged || c.statusChecked || st.health || '';
  var name_txt = caregiverCardName(t) || t.englishName || t.name || '';
  var addr_txt = caregiverCardAddr(t) || c.addr || '';
  var due_raw = t['encounter-due-date'] || '';
  var due_display = '';
  if (due_raw) { var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due_raw); due_display = dm ? dm[3] + '-' + dm[2] + '-' + dm[1] : due_raw; }
  var logs_display = keys.length || c.logs || 0;
  return { t:t, q:q, c:c, enc:enc, keys:keys, last:last, st:st, status:status, name_txt:name_txt, addr_txt:addr_txt, due_raw:due_raw, due_display:due_display, logs_display:logs_display };
}
function caregiverCurrentCardHtml(t) {
  var d = caregiverBaseData(t);
  var view_logs_btn = '<button class="tcbtn tcbtn-logs" onclick="event.stopPropagation();openTreeLogs(\'' + d.t.treeId + '\')" style="width:100%"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button>';
  return '<div class="tree-card-caregiver caregiver-current-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + d.t.addedAt + '</span><button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); openDeleteConfirm(\'' + d.t.treeId + '\')"><i class="ti ti-trash"></i></button></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' +
    '<div class="tree-card-btns">' + view_logs_btn + '</div></div>';
}
function caregiverPastCardHtml(t) {
  var d = caregiverBaseData(t);
  var view_logs_btn = '<button class="tcbtn tcbtn-logs" onclick="event.stopPropagation();openTreeLogs(\'' + d.t.treeId + '\')" style="width:100%"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button>';
  return '<div class="tree-card-caregiver caregiver-past-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + d.t.addedAt + '</span></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' +
    '<div class="tree-card-btns">' + view_logs_btn + '</div></div>';
}
function caregiverSubmittedCardHtml(t) {
  var d = caregiverBaseData(t);
  var view_logs_btn = '<button class="tcbtn tcbtn-logs" onclick="event.stopPropagation();openTreeLogs(\'' + d.t.treeId + '\')" style="width:100%"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button>';
  return '<div class="tree-card-caregiver caregiver-submitted-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + d.t.addedAt + '</span><button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); openDeleteConfirm(\'' + d.t.treeId + '\')"><i class="ti ti-trash"></i></button></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' +
    '<div class="tree-card-status"><div class="status-dot status-dot-warn"></div><div class="status-txt">Waiting approval</div></div><div class="tree-card-btns">' + view_logs_btn + '</div></div>';
}
function caregiverDueCardHtml(t) {
  var d = caregiverBaseData(t);
  var view_logs_btn = '<button class="tcbtn tcbtn-logs" onclick="event.stopPropagation();openTreeLogs(\'' + d.t.treeId + '\')" style="width:100%"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button>';
  return '<div class="tree-card-caregiver caregiver-due-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Due: ' + d.due_display + '</span></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' +
    '<div class="tree-card-btns">' + view_logs_btn + '</div></div>';
}
function caregiverFinishedCardHtml(t) {
  var d = caregiverBaseData(t);
  var view_logs_btn = '<button class="tcbtn tcbtn-logs" onclick="event.stopPropagation();openTreeLogs(\'' + d.t.treeId + '\')" style="width:100%"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button>';
  return '<div class="tree-card-caregiver caregiver-finished-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + d.t.addedAt + '</span></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' +
    '<div class="tree-card-btns">' + view_logs_btn + '</div></div>';
}
function caregiverCardHtml(t) { return caregiverSubmittedCardHtml(t); }
function removeCaregiverCard(remove_tree_id) {
  var login_data = window._login || {};
  var tree_login = login_data['tree-login'] || {};
  var caregiver_role = tree_login.caregiver || {};
  var caregiver_cards = caregiver_role.cards || {};
  ['waiting','current','past'].forEach(function(list_name){
    var list_data = caregiver_cards[list_name] || [];
    caregiver_cards[list_name] = list_data.filter(function(e){ var id = typeof e === 'string' ? e : e.treeId; return id !== remove_tree_id; });
  });
  storage.set('login', login_data);
  if (window.render && typeof window.render.init === 'function') window.render.init();
}
var pending_delete_id = '';
var pending_caregiver_log_type = '';
var pending_caregiver_log_key = '';
function openDeleteConfirm(delete_tree_id) {
  pending_delete_id = delete_tree_id;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove tree ' + delete_tree_id + ' from your list?';
  document.getElementById('delete-confirm-modal').classList.add('open');
}
function deleteCaregiverLog(tree_id, log_type) {
  var tid = tree_id || '';
  var type_key = log_type || 'register-log';
  pending_caregiver_log_type = type_key;
  pending_caregiver_log_key = tid;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove ' + (type_key === 'survey-log' ? 'survey' : 'register') + ' log "' + tid + '"? This will remove it from your submitted logs.';
  document.getElementById('delete-confirm-modal').classList.add('open');
}
function confirmDeleteCard() {
  document.getElementById('delete-confirm-modal').classList.remove('open');
  if (pending_caregiver_log_type && pending_caregiver_log_key) {
    var log_type = pending_caregiver_log_type;
    var log_key = pending_caregiver_log_key;
    pending_caregiver_log_type = '';
    pending_caregiver_log_key = '';
    var login_data = window._login || storage.get('login') || {};
    var caregiver_role = (login_data['tree-login'] && login_data['tree-login']['caregiver']) || {};
    var cards = caregiver_role.cards || {};
    var log_list = (cards[log_type] && cards[log_type].submitted) || [];
    var filtered = log_list.filter(function (e) { return String(e.treeId || e) !== String(log_key); });
    if (cards[log_type]) cards[log_type].submitted = filtered;
    caregiver_role.cards = cards;
    login_data['tree-login'] = login_data['tree-login'] || {};
    login_data['tree-login']['caregiver'] = caregiver_role;
    try { storage.set('login', login_data); window._login = login_data; } catch (e) {}
    try { var is_survey = log_type === 'survey-log'; setStatById(is_survey ? 'c-survey-log-submitted' : 'c-register-log-submitted', filtered.length); } catch (e) {}
    renderCaregiverLogs(log_type, 'submitted');
    return;
  }
  if (pending_delete_id) { removeCaregiverCard(pending_delete_id); pending_delete_id = ''; }
}
function cancelDeleteCard() {
  pending_delete_id = '';
  pending_caregiver_log_type = '';
  pending_caregiver_log_key = '';
  document.getElementById('delete-confirm-modal').classList.remove('open');
}
function renderCaregiverCards() {
  var data = window.__TREE_DATA || [];
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  var cards = role.cards || {};
  var current_raw = cards.current || [];
  var past_raw = cards.past || [];
  var sorted_current = getSortedWaitingList(current_raw, 'desc');
  var sorted_past = getSortedWaitingList(past_raw, 'desc');
  var currentIds = sorted_current.map(function(e){ return e.treeId || e; });
  var pastIds = sorted_past.map(function(e){ return e.treeId || e; });
  var current_map = {}; sorted_current.forEach(function(e){ if(e && e.treeId) current_map[e.treeId]=e.addedAt; });
  var past_map = {}; sorted_past.forEach(function(e){ if(e && e.treeId) past_map[e.treeId]=e.addedAt; });
  var currentList = currentIds.length ? data.filter(function (t) { return currentIds.indexOf(t.treeId) > -1; }).sort(function(a,b){ return currentIds.indexOf(a.treeId) - currentIds.indexOf(b.treeId); }).map(function(t){ var c={}; for(var k in t) c[k]=t[k]; c.addedAt=current_map[t.treeId]; c.isCurrentSurvey=true; return c; }) : [];
  var pastList = pastIds.length ? data.filter(function (t) { return pastIds.indexOf(t.treeId) > -1; }).sort(function(a,b){ return pastIds.indexOf(a.treeId) - pastIds.indexOf(b.treeId); }).map(function(t){ var c={}; for(var k in t) c[k]=t[k]; c.addedAt=past_map[t.treeId]; c.isPast=true; return c; }) : [];
  var currentCards = document.getElementById('caregiver-current-cards');
  if (currentCards) currentCards.innerHTML = currentList.map(caregiverCurrentCardHtml).join('');
  var pastCards = document.getElementById('caregiver-past-cards');
  if (pastCards) pastCards.innerHTML = pastList.map(caregiverPastCardHtml).join('');
  caregiveredCount = currentList.length + pastList.length;
  setStatById('c-tree-current', currentList.length);
  setStatById('c-tree-past', pastList.length);
  setStatById('s-current-count', currentList.length);
  setStatById('s-past-count', pastList.length);
  setStatById('c-care-waiting', (cards.waiting || []).length);
  var monthlyEl = document.getElementById('c-monthly');
  if (monthlyEl) monthlyEl.textContent = '₹' + (caregiveredCount * 300);
}

function consumePendingCaregiverRequest() {
  try {
    var raw = sessionStorage.getItem('pendingCare');
    console.log('[caregiver] consumePendingCaregiver raw', raw);
    if (!raw) return false;
    var pending = JSON.parse(raw);
    var login = storage.get('login') || window._login || {};
    var tl = login['tree-login'] || (login['tree-login'] = {});
    var changed = false;
    for (var userid in pending) {
      if (!Object.prototype.hasOwnProperty.call(pending, userid)) continue;
      var treeId = pending[userid];
      console.log('[caregiver] processing pending', userid, treeId);
      var target = null; var target_key = null;
      for (var k in tl) { if (tl[k] && tl[k].userId === userid) { target = tl[k]; target_key = k; break; } }
      if (!target && userid === 'caregiver') {
        for (var kk in tl) { if (tl[kk] && tl[kk].type === 'caregiver') { target = tl[kk]; target_key = kk; break; } }
      }
      console.log('[caregiver] target found', target_key, !!target);
      if (target) {
        var cards = target.cards || (target.cards = {});
        var waiting = cards.waiting || (cards.waiting = []);
        var waiting_ids = waiting.map(function(e){ return e.treeId; });
        if (waiting_ids.indexOf(treeId) === -1) { waiting.push({treeId: treeId, addedAt: getCurrentAddedAtString()}); changed = true; console.log('[caregiver] added to waiting', treeId); } else { console.log('[caregiver] already in waiting', treeId); }
        cards.waiting = waiting; target.cards = cards; tl[target_key] = target;
      } else { console.log('[caregiver] no target for userid', userid); }
    }
    if (changed) { login['tree-login'] = tl; storage.set('login', login); window._login = login; console.log('[caregiver] saved login', login); }
    sessionStorage.removeItem('pendingCare');
    console.log('[caregiver] consume done changed', changed);
    return changed;
  } catch (e) { console.log('[caregiver] consume error', e); try { sessionStorage.removeItem('pendingCare'); } catch (e2) {} return false; }
}
function updateChecksThisMonthStats() {
  var data = window.__TREE_DATA || storage.get('treeCards') || [];
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  var cards = role.cards || {};
  var currentIds = (cards.current || []).map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var currentList = currentIds.length ? data.filter(function (t) { return currentIds.indexOf(t.treeId) > -1; }) : data.filter(function (t) { return t.roles && t.roles.indexOf('caregiver') > -1; });
  var encounterDates = [];
  currentList.forEach(function (t) {
    var enc = t['encounters-list'] || {};
    Object.keys(enc).forEach(function (key) {
      var entry = enc[key];
      var dateValue = (entry && (entry.registeredDate || entry.updatedDate)) || '';
      if (dateValue) encounterDates.push(dateValue);
    });
  });
  var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var nowDate = new Date();
  var currentYearMonth = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0');
  var todayStr = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0') + '-' + String(nowDate.getDate()).padStart(2, '0');
  var latestEncounterDate = function (t) {
    var enc = t['encounters-list'] || {};
    var lastValue = '';
    Object.keys(enc).forEach(function (key) {
      var entry = enc[key];
      var dateValue = (entry && (entry.registeredDate || entry.updatedDate)) || '';
      if (dateValue > lastValue) { lastValue = dateValue; }
    });
    return lastValue;
  };
  function isTreeFinishedByLastEncounterInCurrentMonth(tree, current_year_month, today_str) {
    var last_encounter_date = latestEncounterDate(tree);
    if (!last_encounter_date) return false;
    var is_in_current_month = last_encounter_date.slice(0, 7) === current_year_month;
    var is_prior_or_today = last_encounter_date <= today_str;
    return is_in_current_month && is_prior_or_today;
  }
  var dueStatDecider = function (tree) {
    var dueDay = tree['encounter-due-date'] || '';
    if (!dueDay || dueDay.slice(0, 7) !== currentYearMonth) { return ''; }
    var lastEncounter = latestEncounterDate(tree);
    if (todayStr > dueDay) {
      if (lastEncounter && lastEncounter < todayStr && lastEncounter.slice(0, 7) === currentYearMonth) {
        return 'finished';
      }
    }
    return 'due';
  };
  var finishedTrees = currentList.filter(function(t){ return isTreeFinishedByLastEncounterInCurrentMonth(t, currentYearMonth, todayStr); });
  var dueTrees = currentList.filter(function(t){
    var due_day = t['encounter-due-date'] || '';
    if (!due_day || due_day.slice(0, 7) !== currentYearMonth) return false;
    return !isTreeFinishedByLastEncounterInCurrentMonth(t, currentYearMonth, todayStr);
  });
  var currentMapForChecks = {};
  try {
    var sorted_current_for_checks = getSortedWaitingList((cards.current || []), 'desc');
    sorted_current_for_checks.forEach(function(e){ if(e && e.treeId) currentMapForChecks[e.treeId]=e.addedAt; });
  } catch(e) {}
  var checksCardsEl = document.getElementById('caregiver-checks-cards');
  if (checksCardsEl) {
    checksCardsEl.innerHTML = finishedTrees.map(function (t) { var c={}; for(var k in t) c[k]=t[k]; c.addedAt=currentMapForChecks[t.treeId]||''; return caregiverFinishedCardHtml(c); }).join('');
    var checksEmptyEl = document.getElementById('caregiver-checks-empty');
    if (checksEmptyEl) checksEmptyEl.style.display = finishedTrees.length ? 'none' : 'block';
  }
  var checksDueEl = document.getElementById('caregiver-checks-due-cards');
  if (checksDueEl) {
    checksDueEl.innerHTML = dueTrees.map(function (t) { var c={}; for(var k in t) c[k]=t[k]; c.addedAt=currentMapForChecks[t.treeId]||''; return caregiverDueCardHtml(c); }).join('');
    var checksDueEmptyEl = document.getElementById('caregiver-checks-due-empty');
    if (checksDueEmptyEl) checksDueEmptyEl.style.display = dueTrees.length ? 'none' : 'block';
  }
  var dueListForNext = currentList.map(function(t){ return {tree: t, due: t['encounter-due-date'] || ''}; }).filter(function(x){ return x.due; }).sort(function(a,b){ return a.due.localeCompare(b.due); });
  var nextCheckLabel = '—';
  var nextCheckTreeForLabel = null;
  if (dueListForNext.length) {
    var todayStrForNext = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0') + '-' + String(nowDate.getDate()).padStart(2, '0');
    var futureDue = dueListForNext.filter(function(x){ return x.due >= todayStrForNext; });
    var chosenNext = futureDue.length ? futureDue[0] : dueListForNext[dueListForNext.length - 1];
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(chosenNext.due);
    nextCheckLabel = m ? parseInt(m[3],10) + ' ' + monthNames[parseInt(m[2],10)-1] : chosenNext.due;
    nextCheckTreeForLabel = chosenNext.tree;
  } else if (encounterDates.length) {
    encounterDates.sort();
    var latestDate = new Date(encounterDates[encounterDates.length - 1]);
    latestDate.setDate(latestDate.getDate() + 90);
    nextCheckLabel = latestDate.getDate() + ' ' + monthNames[latestDate.getMonth()];
  }
  window._nextCheckTreeId = nextCheckTreeForLabel ? nextCheckTreeForLabel.treeId : '';
  window._caregiverNextDueList = dueListForNext.slice(0,3).map(function(x){ return x.tree.treeId; });
  window._caregiverNextDueId = window._nextCheckTreeId;
  var c_next_due_list_el = document.getElementById('c-next-due-list');
  if(c_next_due_list_el){
    var next3 = dueListForNext.slice(0,3);
    if(!next3.length && nextCheckTreeForLabel){ next3 = [{tree: nextCheckTreeForLabel, due: chosenNext ? chosenNext.due : ''}]; window._caregiverNextDueList = next3.map(function(x){ return x.tree.treeId; }); }
    c_next_due_list_el.innerHTML = next3.length ? next3.map(function(x, idx){
      var dm=/^(\d{4})-(\d{2})-(\d{2})$/.exec(x.due);
      var lbl=dm? parseInt(dm[3],10)+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(dm[2],10)-1]:x.due;
      return '<div class="next-due-row"><span class="next-due-id" onclick="openNextCheckTreeCard(event,' + idx + ')">'+x.tree.treeId+'</span><span class="next-due-date">'+lbl+'</span></div>';
    }).join('') : '<span class="next-due-date">—</span>';
  }
  setStatById('c-monthly', finishedTrees.length);
  setStatById('c-checks-due', dueTrees.length);
  setStatById('c-next', nextCheckLabel);
  setStatById('c-register-waiting', (cards.waiting || []).length);
}

function openNextCheckTree() {
  try { sessionStorage.removeItem('caregiverNextDueSingle'); } catch (e) {}
  if (window._nextCheckTreeId && typeof openProfile === 'function') { openProfile(window._nextCheckTreeId); return; }
  var data = window.__TREE_DATA || storage.get('treeCards') || [];
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  var cards = role.cards || {};
  var currentIds = (cards.current || []).map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var currentList = currentIds.length ? data.filter(function(t){ return currentIds.indexOf(t.treeId) > -1; }) : data.filter(function(t){ return t.roles && t.roles.indexOf('caregiver') > -1; });
  if (!currentList.length) { goTo('caregiver-current'); return; }
  var dueList = currentList.map(function(t){ return {tree: t, due: t['encounter-due-date'] || ''}; }).filter(function(x){ return x.due; }).sort(function(a,b){ return a.due.localeCompare(b.due); });
  if (dueList.length) {
    var nowDate = new Date();
    var todayStr = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0') + '-' + String(nowDate.getDate()).padStart(2, '0');
    var future = dueList.filter(function(x){ return x.due >= todayStr; });
    var chosen = future.length ? future[0] : dueList[dueList.length - 1];
    openProfile(chosen.tree.treeId);
    return;
  }
  goTo('caregiver-current');
}
function renderCaregiverNextDueSingleCard(single_tid) {
  if (!single_tid) return false;
  var ram = storage.get('treeCards') || window.__TREE_DATA || [];
  var t = null; for (var i = 0; i < ram.length; i++) if (ram[i].treeId === single_tid) { t = ram[i]; break; }
  if (!t) return false;
  var login_data = storage.get('login') || window._login || {};
  var cards = ((login_data['tree-login'] && login_data['tree-login']['caregiver']) || {}).cards || {};
  var sorted = getSortedWaitingList(cards.current || [], 'desc'); var m = {}; sorted.forEach(function(e){ if(e && e.treeId) m[e.treeId] = e.addedAt; });
  var c = {}; for (var k in t) c[k] = t[k]; c.addedAt = m[single_tid] || ''; c.isDueCard = true;
  var cardEl = document.getElementById('caregiver-checks-due-cards'); var emptyEl = document.getElementById('caregiver-checks-due-empty');
  if (emptyEl) emptyEl.style.display = 'none'; if (cardEl) cardEl.innerHTML = caregiverCardHtml(c);
  return true;
}
function openNextCheckTreeCard(caregiver_next_due_event, caregiver_next_due_idx) {
  if (caregiver_next_due_event) caregiver_next_due_event.stopPropagation();
  var caregiver_next_due_list_local = window._caregiverNextDueList || [];
  var caregiver_next_due_tree_id = '';
  if (typeof caregiver_next_due_idx === 'number' && caregiver_next_due_list_local[caregiver_next_due_idx]) {
    caregiver_next_due_tree_id = caregiver_next_due_list_local[caregiver_next_due_idx];
  } else {
    caregiver_next_due_tree_id = window._caregiverNextDueId || window._nextCheckTreeId || '';
  }
  if (!caregiver_next_due_tree_id) return;
  if (!renderCaregiverNextDueSingleCard(caregiver_next_due_tree_id)) return;
  try { sessionStorage.setItem('caregiverNextDueSingle', caregiver_next_due_tree_id); } catch (e) {}
  goTo('caregiver-checks-due');
}
function openCaregiverDueList() {
  try { sessionStorage.removeItem('caregiverNextDueSingle'); } catch (e) {}
  goTo('caregiver-checks-due');
}

function loadDashboard() {
  var ram_data = storage.get('treeCards') || window.__TREE_DATA || [];
  console.log('[caregiver] loadDashboard RAM', ram_data.length, 'login', (storage.get('login')||{}));
  window.__TREE_DATA = ram_data;
  albumData = Array.isArray(ram_data) ? ram_data : (ram_data.albumData || []);
  renderCaregiverCards();
  updateChecksThisMonthStats();
  var new_caregiver_ids = checkNewCaregiverTrees();
  setStatById('c-care-seeing', new_caregiver_ids.length);
  var dash_role = (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  var dash_register = dash_role.cards && dash_role.cards["register-log"];
  var dash_survey = dash_role.cards && dash_role.cards["survey-log"];
  var register_approved = (dash_register && Array.isArray(dash_register.approved)) ? dash_register.approved : [];
  var register_submitted = (dash_register && Array.isArray(dash_register.submitted)) ? dash_register.submitted : [];
  var survey_approved = (dash_survey && Array.isArray(dash_survey.approved)) ? dash_survey.approved : [];
  var survey_submitted = (dash_survey && Array.isArray(dash_survey.submitted)) ? dash_survey.submitted : [];
  setStatById('c-register-log-approved', register_approved.length);
  setStatById('c-register-log-submitted', register_submitted.length);
  setStatById('c-survey-log-approved', survey_approved.length);
  setStatById('c-survey-log-submitted', survey_submitted.length);
  if (!ram_data.length) console.warn('[caregiver] loadDashboard: RAM empty');
  return { ram_data: ram_data, new_caregiver_ids: new_caregiver_ids, register_approved: register_approved, register_submitted: register_submitted, survey_approved: survey_approved, survey_submitted: survey_submitted };
}

window.render = {
  init: function () {
    if (hubMode === 'login' || hubMode === 'register') { return; }
    if (!loginCheckCaregiver()) return;
    var had_pending = false;
    if (hubMode === 'caregiver-dash' || hubMode === 'caregiver-waiting') { had_pending = consumePendingCaregiverRequest(); }
    loadDashboard();
    var role = (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
    var cards = role.cards || {};
    if (had_pending) { openCaregiverWaitingRequests(); return; }
    if (hubMode === 'caregiver-waiting') { openCaregiverWaitingRequests(); }
    if (hubMode === 'caregiver-seeing') { checkNewCaregiverTrees(); }
    if (hubMode === 'caregiver-checks-due') {
      var single = null; try { single = sessionStorage.getItem('caregiverNextDueSingle'); } catch (e) {}
      if (single && renderCaregiverNextDueSingleCard(single)) { goTo('caregiver-checks-due'); }
    }
  }
};
function treeCardHtml(t, cfg) {
  var q = String.fromCharCode(39);
  cfg = cfg || {};
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var addr_raw = caregiverCardAddr(t) || c.addr || '';
  var addr = (cfg.addrMode === 'full' && c.addrFull) ? c.addrFull : addr_raw;
  var status = t.past ? (c.status || '') : (cfg.verb === 'logged' ? (c.statusLogged || c.statusChecked || st.health || '') : (c.statusChecked || c.statusLogged || st.health || ''));
  var latest = (cfg.showLatest && c.latest) ? '<div class="tcard-latest"><i class="ti ti-timeline" style="font-size:0.7333rem;flex-shrink:0"></i><span>' + c.latest + '</span></div>' : '';
  var todo = (cfg.showTodo && c.todo) ? '<div class="tcard-todo"><i class="ti ti-clipboard-check" style="font-size:0.7333rem;flex-shrink:0"></i><span>' + c.todo + '</span></div>' : '';
  var btn2Type = (cfg.btn2 !== undefined) ? cfg.btn2 : (c.btn2 || null);
  var btn2 = '';
  if (btn2Type === 'profile') {
    btn2 = cfg.btn2GoTo ? '<button class="tcbtn tcbtn-pay" onclick="goTo(' + q + 'profile' + q + ')"><i class="ti ti-leaf" style="font-size:0.8667rem"></i> Tree profile</button>'
                       : '<button class="tcbtn tcbtn-pay" onclick="openProfile(' + q + t.treeId + q + ')"><i class="ti ti-leaf" style="font-size:0.8667rem"></i> Tree profile</button>';
  }
  return '<div class="tree-card-caregiver tcard">' +
    '<div class="tcard-head"><div class="tcard-row"><span class="tcard-id">' + (t.emoji || c.emoji || '') + ' ' + t.treeId + '</span><button class="tcard-toggle" type="button" onclick="toggleTreeCard(this)"><i class="ti ti-chevron-down"></i></button></div>' +
    '<div class="tcard-addr"><i class="ti ti-map-pin" style="font-size:0.6667rem"></i> ' + addr + '</div></div>' +
    '<div class="tcard-collapse" style="display:none;"><div class="tcard-img" style="background:' + (t.bg || c.bg || '') + ';">' + (t.emoji || c.emoji || '') + '</div>' + latest +
    '<div class="tcard-stats"><div class="tcard-stat"><div class="tcard-stat-lbl">Height</div><div class="tcard-stat-val">' + (formatLength(st.height||c.height,'height') || '—') + '</div></div><div class="tcard-stat"><div class="tcard-stat-lbl">Diameter</div><div class="tcard-stat-val">' + (formatLength(st.diameter||c.diameter,'diameter') || '—') + '</div></div><div class="tcard-stat"><div class="tcard-stat-lbl">Logs</div><div class="tcard-stat-val">' + (keys.length || c.logs || 0) + '</div></div></div>' +
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

function openTreePool() {
  var login = storage.get('login') || window._login || {};
  var role = (login['tree-login'] && login['tree-login']['caregiver']) || (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['caregiver']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var cards = role.cards || {};
  var caregiver_waiting = []; try { caregiver_waiting = JSON.parse(sessionStorage.getItem('caregiverWaiting') || '[]'); } catch (e) {}
  var exclude = [].concat(
    (cards.current || []).map(function(c){ return c.treeId; }),
    (cards.past || []).map(function(c){ return c.treeId; }),
    (cards.waiting || []).map(function(c){ return c.treeId; }),
    caregiver_waiting
  ).join(',');
  var parent = encodeURIComponent('care-giver.html?hub=caregiver-dash');
  var userid = role.userId || '';
  var url = 'filter.html?userid=' + encodeURIComponent(userid) + '&parent=' + parent + '&exclude=' + encodeURIComponent(exclude);
  sessionStorage.setItem('gobackFromTreeProfile', url);
  console.log('[caregiver] openTreePool ->', url);
  window.location.href = url;
}
function openSurveyATreePage() {
  var login = storage.get('login') || window._login || {};
  var role = (login['tree-login'] && login['tree-login']['caregiver']) || (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['caregiver']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var parent = encodeURIComponent('care-giver.html?hub=caregiver-dash');
  var userid = role.userId || '';
  var url = 'survey-a-tree.html?parent=' + parent + '&userid=' + encodeURIComponent(userid);
  window.location.href = url;
}
function surveyDueTree(treeId) {
  var login = storage.get('login') || window._login || {};
  var role = (login['tree-login'] && login['tree-login']['caregiver']) || (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['caregiver']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var active_el = document.querySelector('.page.active');
  var current_hub = active_el ? active_el.id.replace('page-','') : 'caregiver-dash';
  var parent = encodeURIComponent('care-giver.html?hub=' + current_hub);
  var userid = role.userId || '';
  var url = 'survey-a-tree.html?parent=' + parent + '&userid=' + encodeURIComponent(userid) + '&treeid=' + encodeURIComponent(treeId);
  window.location.href = url;
}
function openRegisterATreePage() {
  var login = storage.get('login') || window._login || {};
  var role = (login['tree-login'] && login['tree-login']['caregiver']) || (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['caregiver']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var parent = encodeURIComponent('care-giver.html?hub=caregiver-dash');
  var userid = role.userId || '';
  var url = 'register-a-tree.html?parent=' + parent + '&userid=' + encodeURIComponent(userid);
  window.location.href = url;
}
function openLogsPage() {
  var login = storage.get('login') || window._login || {};
  var role = (login['tree-login'] && login['tree-login']['caregiver']) || (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['caregiver']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var parent = encodeURIComponent('care-giver.html?hub=caregiver-dash');
  var userid = role.userId || '';
  var url = 'care-giver.html?hub=caregiver-logs-approved&parent=' + parent + '&userid=' + encodeURIComponent(userid);
  window.location.href = url;
}
function openLogsByType(logType, status) {
  var typeKey = (logType === 'survey-log') ? 'survey-log' : 'register-log';
  var st = (status === 'submitted') ? 'submitted' : 'approved';
  if (st === 'approved') { goTo('caregiver-logs-approved'); renderCaregiverLogs(typeKey, 'approved'); }
  else { goTo('caregiver-logs-submitted'); renderCaregiverLogs(typeKey, 'submitted'); }
}
function renderCaregiverLogs(logType, status) {
  if (typeof status === 'undefined') { status = logType; logType = 'register-log'; }
  var typeKey = (logType === 'survey-log') ? 'survey-log' : 'register-log';
  var type = (status === 'submitted') ? 'submitted' : 'approved';
  var list_el = document.getElementById(type === 'submitted' ? 'caregiver-logs-submitted-list' : 'caregiver-logs-approved-list');
  var empty_el = document.getElementById(type === 'submitted' ? 'caregiver-logs-submitted-empty' : 'caregiver-logs-approved-empty');
  var login = storage.get('login') || window._login || {};
  var caregiver_cards = ((login['tree-login'] && login['tree-login']['caregiver'] && login['tree-login']['caregiver'].cards) || {});
  var logs = (caregiver_cards[typeKey] && caregiver_cards[typeKey][type]) || [];
  if (!list_el) return 0;
  if (!logs.length) { list_el.innerHTML = ''; if (empty_el) empty_el.style.display = 'block'; return 0; }
  if (empty_el) empty_el.style.display = 'none';
  var html = '';
  var is_submitted = type === 'submitted' ? true : false;
  for (var i = logs.length - 1; i >= 0; i--) {
    var entry = logs[i]; var tid = entry.treeId || ''; var t = null;
    try { t = storage.pullTreeDetail ? storage.pullTreeDetail(tid) : null; } catch (e) {}
    if (!t) { var d = window.__TREE_DATA || storage.get('treeCards') || []; for (var r = 0; r < d.length; r++) if (d[r].treeId === tid) { t = d[r]; break; } }
    var name = t ? (caregiverCardName(t) || tid) : tid;
    var addr = t ? caregiverCardAddr(t) : '';
    var enc = t ? (t['encounters-list'] || {}) : {}; var keys = t ? Object.keys(enc) : []; var last = t ? enc[keys[keys.length - 1]] || {} : {}; var st = last['health-status'] || {};
    var date = entry.loggedAt || ''; var dm = /^(\d{4})(\d{2})(\d{2})T/.exec(date); var label = dm ? dm[3] + '-' + dm[2] + '-' + dm[1] : date;
    var date_param = date || '';
    var delete_btn = is_submitted ? '<button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); deleteCaregiverLog(\'' + tid + '\',\'' + typeKey + '\')"><i class="ti ti-trash"></i></button>' : '';
    var header_html = is_submitted ? '<div class="caregiver-log-header"><span class="caregiver-log-header-title">' + (typeKey === 'survey-log' ? 'Survey log' : 'Register request') + '</span>' + delete_btn + '</div>' : '';
    html += '<div class="log-entry" style="cursor:pointer;flex-direction:column;align-items:stretch;">' + header_html + '<div style="display:flex;gap:9px;align-items:center;cursor:pointer;" onclick="openCaregiverReviewPage(\'' + tid + '\',\'' + date_param + '\')"><div class="log-dot" style="background:#16a34a"></div><div class="log-body"><div class="log-date">' + label + '</div><div class="log-text">' + name + ' · ' + tid + '</div><div class="log-addr" style="font-size:0.7333rem;color:var(--color-text-secondary)">' + addr + '</div><div class="log-text">Health: ' + (st.health || '—') + '</div><div class="log-text">Height: ' + formatLength(st.height,'height') + '</div><div class="log-text">Diameter: ' + formatLength(st.diameter,'diameter') + '</div><div class="log-text"><span style="color:#dc2626">Note:</span> ' + ((t && t['encounters-list'] && t['encounters-list'][Object.keys(t['encounters-list'])[0]] && t['encounters-list'][Object.keys(t['encounters-list'])[0]].fieldObservation && t['encounters-list'][Object.keys(t['encounters-list'])[0]].fieldObservation.notes) || '—') + '</div><div class="log-text"><span style="color:#dc2626">Recommendation:</span> ' + ((t && t['encounters-list'] && t['encounters-list'][Object.keys(t['encounters-list'])[0]] && t['encounters-list'][Object.keys(t['encounters-list'])[0]].fieldObservation && t['encounters-list'][Object.keys(t['encounters-list'])[0]].fieldObservation.recommendations) || '—') + '</div><div class="log-text"><span class="chip-blue" onclick="event.stopPropagation();openCaregiverReviewPage(\'' + tid + '\',\'' + date_param + '\')"><i class="ti ti-eye"></i> Review</span></div></div></div></div>';
  }
  list_el.innerHTML = html;
  return logs.length;
}

function openCaregiverReviewPage(treeId, loggedAt) {
  var parent = encodeURIComponent('care-giver.html?hub=caregiver-dash');
  try { var active = document.querySelector('.page.active'); if (active) parent = encodeURIComponent('care-giver.html?hub=' + active.id.replace('page-','')); } catch (e) {}
  window.location.href = 'review-page.html?treeId=' + encodeURIComponent(treeId) + '&loggedAt=' + encodeURIComponent(loggedAt || '') + '&parent=' + parent;
}


function getCaregiverParentUrl() {
  var parent_url = new URLSearchParams(location.search).get('parent');
  return parent_url ? parent_url : null;
}

function goBackFromCaregiverLogin() {
  var parent_url = getCaregiverParentUrl();
  if (parent_url) { window.location.href = parent_url; return; }
  window.location.href = 'login-hub.html';
}

var hubMode = new URLSearchParams(location.search).get('hub');
console.log('[caregiver] hubMode', hubMode, 'href', location.href);
if (hubMode === 'login') { goTo('caregiver-login'); }
else if (hubMode === 'register') { goTo('caregiver-enroll'); }
else if (hubMode === 'caregiver-dash') { goTo('caregiver-dash'); }
else if (hubMode === 'caregiver-waiting') { goTo('caregiver-waiting'); }
else if (hubMode === 'caregiver-seeing') { goTo('caregiver-seeing'); }
else if (hubMode === 'caregiver-current') { goTo('caregiver-current'); }
else if (hubMode === 'caregiver-past') { goTo('caregiver-past'); }
else if (hubMode === 'caregiver-checks-due') { goTo('caregiver-checks-due'); }
else if (hubMode === 'caregiver-checks-finished') { goTo('caregiver-checks-finished'); }
else if (hubMode === 'caregiver-logs-approved') { goTo('caregiver-logs-approved'); renderCaregiverLogs('approved'); }
else if (hubMode === 'caregiver-logs-submitted') { goTo('caregiver-logs-submitted'); renderCaregiverLogs('submitted'); }
else if (hubMode === 'caregiver-browse') { goTo('caregiver-browse'); }
else { console.log('[caregiver] unknown hubMode, redirect to login-hub'); window.location.href = 'login-hub.html'; }

