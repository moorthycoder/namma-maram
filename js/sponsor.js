
var TESTING_MODE = true;
var profileFrom = 'sponsor-login';
var albumFrom = 'profile';
var treeLogsFrom = 'trees';
var payLogsFrom = 'sponsor-dash';
var sponsoredCount = 0;
var caredCount = 4;
var logoutTarget = 'sponsor-login';
var payTreeId = '';

function getSponsorLang() {
  if (typeof appLang !== 'undefined' && appLang) return appLang;
  if (typeof filterLang !== 'undefined' && filterLang) return filterLang;
  try { return sessionStorage.getItem('nm-app-lang') || 'en'; } catch (e) { return 'en'; }
}
function sponsorCardName(t) {
  if (!t) return '';
  if (typeof storage !== 'undefined' && storage.treeNameIn) { try { return storage.treeNameIn(t, getSponsorLang()) || ''; } catch (e) {} }
  var n = (t.speciesName) || {};
  var lang = getSponsorLang();
  return n[lang] || n.en || n.ta || t.englishName || t.name || '';
}
function sponsorCardAddr(t) {
  if (!t) return '';
  var lang = getSponsorLang();
  var a = (t.address) || {};
  if (typeof a === 'string') return a;
  return a[lang] || a.en || a.ta || '';
}

function loadCurrentUser() {
  try {
    var s = sessionStorage.getItem('loginCredentialsV1');
    if (!s) { return; }
    var cred = JSON.parse(s);
    var role = cred['tree-login'] && cred['tree-login']['sponsor'];
    if (!role) { return; }
    var nameEl = document.getElementById('user-name');
    var avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = role.name;
    if (avatarEl) avatarEl.textContent = role.avatar;
    window._login = cred;
  } catch (e) {}
}
loadCurrentUser();
function continueAsSponsor() {
  console.log('[sponsor] continueAsSponsor click pending', sessionStorage.getItem('pendingSponsor'));
  updateWaitingListFromPendingSponsor();
}
function updateWaitingListFromPendingSponsor() {
  try {
    var raw_data = sessionStorage.getItem('pendingSponsor');
    console.log('[sponsor] updateWaitingListFromPendingSponsor raw', raw_data);
    if (!raw_data) { goTo('sponsor-dash'); return false; }
    var pending_data = JSON.parse(raw_data);
    var pending_tree_id = null;
    for (var pending_key in pending_data) { if (Object.prototype.hasOwnProperty.call(pending_data, pending_key)) { pending_tree_id = pending_data[pending_key]; break; } }
    if (!pending_tree_id) { goTo('sponsor-dash'); return false; }
    var existing_list = isTreeIdAlreadyInSponsorLists(pending_tree_id);
    if (existing_list) {
      try { sessionStorage.removeItem('pendingSponsor'); } catch (e) {}
      openSponsorConflictModal(pending_tree_id, existing_list);
      return true;
    }
    try { sessionStorage.removeItem('pendingSponsor'); } catch (e) {}
    sponsorATree({ treeId: pending_tree_id });
    return true;
  } catch (e) { console.log('[sponsor] updateWaitingListFromPendingSponsor error', e); goTo('sponsor-dash'); return false; }
}
function isTreeIdAlreadyInSponsorLists(check_tree_id) {
  var login_data = window._login || {};
  var tree_login = login_data['tree-login'] || {};
  var sponsor_role = tree_login.sponsor || {};
  var sponsor_cards = sponsor_role.cards || {};
  var waiting_list = sponsor_cards.waiting || [];
  var current_list = sponsor_cards.current || [];
  var past_list = sponsor_cards.past || [];
  var waiting_ids = waiting_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var current_ids = current_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var past_ids = past_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var is_in_waiting = waiting_ids.indexOf(check_tree_id) > -1;
  var is_in_current = current_ids.indexOf(check_tree_id) > -1;
  var is_in_past = past_ids.indexOf(check_tree_id) > -1;
  return is_in_waiting ? 'waiting' : is_in_current ? 'current' : is_in_past ? 'past' : null;
}
function openSponsorConflictModal(conflict_tree_id, conflict_list) {
  var title_el = document.getElementById('conflict-title');
  var text_el = document.getElementById('conflict-text');
  if (title_el) title_el.textContent = 'Already in ' + conflict_list;
  if (text_el) text_el.textContent = 'Tree ' + conflict_tree_id + ' is already in your ' + conflict_list + ' list.';
  document.getElementById('conflict-resolution-modal').classList.add('open');
}
function closeSponsorConflictModal() {
  document.getElementById('conflict-resolution-modal').classList.remove('open');
}
function handleSponsorLoginOkay() {
  var modal_el = document.getElementById('login-status-modal');
  if (modal_el) modal_el.classList.remove('open');
  updateWaitingListFromPendingSponsor();
}
function sponsorLogout() {
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
    var role = cred && cred['tree-login'] && cred['tree-login']['sponsor'];
    if (role) {
      var btn = document.getElementById('continue-as-btn');
      var name_el = document.getElementById('continue-as-name');
      if (btn) btn.style.display = 'flex';
      if (name_el) name_el.textContent = role.name || 'Sponsor';
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
  existing_member:  { icon:'ti ti-user-check',  color:'#16a34a', bg:'#dcfce7', title:'Already registered',        text:'An account with this email already exists. Please log in instead of registering again.', go:'Login', to:'sponsor-login' },
  blocked:          { icon:'ti ti-ban',         color:'#dc2626', bg:'#fee2e2', title:'Registration blocked',       text:'Your registration has been blocked. Please contact support if you think this is a mistake.', go:'Contact us', to:'sponsor-login' }
};

// Register status modal — waiting / existing_member / blocked
var regTarget = 'sponsor-login';

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
  var target_id = payTreeId || (ram_data[0] && ram_data[0].treeId) || '';
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
  if (page === 'pay-logs') {
    var activePayPage = document.querySelector('.page.active');
    if (activePayPage) {
      var payFrom = activePayPage.id.replace('page-', '');
      if (payFrom !== 'pay-logs') {
        payLogsFrom = payFrom;
      }
    }
  }
  
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('page-'+page).classList.add('active');
  var sb = document.getElementById('sbar');
  sb.className = 'status-bar';
  if (['sponsor-login','sponsor-enroll','ranger-login','ranger-dash','surveyor-login','surveyor-dash','trees','admin-login','admin-dash','admin-trees','admin-edit-tree','admin-add-tree','admin-trackers','admin-sponsors','admin-trackers-prospective','admin-sponsors-prospective','ranger-enroll','sponsor-enroll','surveyor-enroll','role-login'].indexOf(page) > -1) sb.classList.add('dark');
  else if (['sponsor-login','sponsor-dash','sponsor-waiting','sponsor-current','sponsor-past','caregiver-login','caregiver-dash'].indexOf(page) > -1) sb.classList.add('blue');
  var alogout = document.getElementById('alogout-drop');
  if (alogout) alogout.classList.remove('open');
  
  }



function treeLogsBack() {
  goTo(treeLogsFrom);
}

function payLogsBack() {
  goTo(payLogsFrom);
}


// Password toggle

function togglePw(id, btn) {
  var inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.querySelector('i').className = inp.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}


// Open profile

function openProfile(treeId) {
  var from = document.querySelector('.page.active').id.replace('page-','');
  profileFrom = from;
  var id = treeId || '625501-06-0001';
  document.getElementById('profile-id-label').textContent = id;
  goTo('profile');
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
  if (title_el) title_el.textContent = (sponsorCardName(tree) || treeId) + ' — Logs';
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
      html += '<div class="log-tracker-entry" onclick="openAlbumForTree(\'' + treeId + '\', ' + idx + ')"><div class="log-dot" style="background:' + dots[idx % 3] + ';margin-top:4px;flex-shrink:0;width:7px;height:7px;border-radius:50%;"></div><div><div class="log-date">' + (e.registeredDate || e.updatedDate || k) + '</div><div class="log-text" style="font-size:0.8rem;color:var(--color-text-primary);">Height ' + (hs.height || c.height || '—') + ' · Diameter ' + (hs.diameter || c.diameter || '—') + '</div><div class="log-by">By ' + (e.registeredBy || e.updatedBy || '—') + '</div><div class="log-notes"><i class="ti ti-notes" style="font-size:0.7rem;flex-shrink:0"></i><span><b style="color:red">Note</b> ' + (note_val || '—') + '</span></div><div class="log-todo"><i class="ti ti-clipboard-check" style="font-size:0.7rem;flex-shrink:0"></i><span><b style="color:red">Recommendation</b> ' + (rec_val || '—') + '</span></div><div class="log-chips" style="margin-top:4px;">' + (hs.height ? '<span class="chip">' + hs.height + '</span>' : '') + (e.photos && e.photos.snapshots && e.photos.snapshots.length ? '<span class="chip-blue"><i class="ti ti-photo" style="font-size:0.6667rem"></i>' + e.photos.snapshots.length + ' photos</span>' : '') + '</div></div></div>';
    }
    list_el.innerHTML = html || '<div style="font-size:0.8rem;color:var(--color-text-secondary);text-align:center;padding:20px;">No logs yet</div>';
  }
  payTreeId = treeId;
  loadLogsFromRam();
  goTo('tree-logs');
}
function openAlbumForTree(treeId, logIdx) {
  payTreeId = treeId;
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


// Pay modal

function openPayNow() { document.getElementById('pay-modal').classList.add('open'); }

function closePayNow() { document.getElementById('pay-modal').classList.remove('open'); }

function selectAmt(el) {
  document.querySelectorAll('.amt-chip').forEach(function(c){ c.classList.remove('selected'); });
  el.classList.add('selected');
  document.getElementById('pay-now-btn').innerHTML = '<i class="ti ti-credit-card"></i> Pay ' + el.textContent + ' now';
}

function renderPayLogs() {
  var el = document.getElementById('pay-history');
  if (!el) { return; }
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  var list = (role.payments || []).filter(function (p) { return !payTreeId || p.treeId === payTreeId; });
  el.innerHTML = list.map(function (p) {
    var retried = p.status === 'retried';
    return '<div class="pay-entry">' +
      '<div class="pay-icon" style="background:' + (retried ? '#FEF3C7' : 'var(--color-theme-light)') + ';"><i class="ti ' + (retried ? 'ti-alert-triangle' : 'ti-check') + '" style="font-size:0.9333rem;color:' + (retried ? '#B45309' : 'var(--color-theme)') + '"></i></div>' +
      '<div><div class="pay-label">' + p.month + '</div><div class="pay-date">' + p.date + '</div></div>' +
      '<div style="margin-left:auto;text-align:right;"><div style="font-size:0.9333rem;font-weight:500;color:var(--color-text-primary);">' + p.amount + '</div><div style="font-size:0.6667rem;padding:2px 7px;border-radius:20px;background:' + (retried ? '#FEF3C7' : 'var(--color-theme-light)') + ';color:' + (retried ? '#B45309' : 'var(--color-theme)') + ';margin-top:2px;">' + (retried ? 'Retried' : 'Paid') + '</div></div>' +
      '</div>';
  }).join('');
}

function recordPayment() {
  var amtEl = document.querySelector('.amt-chip.selected');
  var amount = amtEl ? amtEl.textContent : '₹300';
  var login = window._login || (window._login = {});
  var tl = login['tree-login'] || (login['tree-login'] = {});
  var role = tl.sponsor || (tl.sponsor = {});
  var payments = role.payments || (role.payments = []);
  payments.push({ treeId: payTreeId, month: 'Jul 2026', date: 'Paid now · ' + new Date().toDateString(), amount: amount, status: 'paid' });
  storage.set('login', login);
  renderPayLogs();
  closePayNow();
}


// Add tree

function sponsorATree(f) {
  console.log('[sponsor] sponsorATree called', f);
  var login = window._login || (window._login = {});
  var tl = login['tree-login'] || (login['tree-login'] = {});
  var role = tl.sponsor || (tl.sponsor = {});
  var cards = role.cards || (role.cards = {});
  var waiting = cards.waiting || (cards.waiting = []);
  var waiting_ids = waiting.map(function(e){ return e.treeId; });
  if (f.treeId && waiting_ids.indexOf(f.treeId) === -1) { waiting.push({ treeId: f.treeId, addedAt: getCurrentAddedAtString() }); console.log('[sponsor] sponsorATree added to waiting', f.treeId); } else { console.log('[sponsor] sponsorATree already in waiting or no treeId', f.treeId); }
  appendSponsorWaitingCard(f);
  storage.set('login', login);
  console.log('[sponsor] sponsorATree saved login waiting', waiting);
  if (window.render && typeof window.render.init === 'function') { window.render.init(); }
  setTimeout(function(){ console.log('[sponsor] sponsorATree open full waiting list'); openSponsorWaitingRequests(); }, 700);
}

function setStatById(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function appendSponsorWaitingCard(form) {
  var titleEl = document.getElementById('swaiting-page-title');
  if (titleEl) titleEl.textContent = 'Sponsor request';
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
  var full_name = tree ? (sponsorCardName(tree) || '') : '';
  var name = form.name || (tree ? (full_name ? full_name + ' #' + id : '#' + id) : '');
  var full_addr = tree ? sponsorCardAddr(tree) : '';
  var loc = form.loc || (tree ? (full_addr ? full_addr.split(', ')[0] : full_addr) : '');
  var bg = form.bg || (tree ? tree.bg || '' : '');
  var emoji = form.emoji || (tree ? tree.emoji || '🌳' : '🌳');
  var height = form.height != null ? form.height : (st.height || (tree && tree.card && tree.card.height) || '—');
  var diam = form.diam || st.diameter || (tree && tree.card && tree.card.diameter) || '—';
  var logs = form.logs != null ? form.logs : (keys.length || (tree && tree.encounters) || 0);
  var cardsEl = document.getElementById('sponsor-waiting-cards');
  var emptyEl = document.getElementById('sponsor-waiting-empty');
  if (emptyEl) emptyEl.style.display = 'none';
  if (!cardsEl) { return; }
  var card = document.createElement('div');
  card.className = 'tree-card-sponsor';
  var height_display = height === '—' ? '—' : String(height).replace(/\s*m$/, '') + 'm';
  card.innerHTML = '<div class="tree-card-hero" style="background:'+bg+';cursor:pointer;position:relative;" onclick="openProfile(\''+id+'\')"><button class="card-pin-btn" type="button" onclick="event.stopPropagation();openTreeMapById(\''+id+'\')"><i class="ti ti-map-pin" style="font-size:0.8rem"></i></button><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>'+emoji+' '+name+'</h3><p><i class="ti ti-map-pin" style="font-size:0.6rem"></i> '+loc+'</p></div></div><div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">'+height_display+'</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">'+diam+'</div></div><div class="tcs"><div class="tcs-label">Logs</div><div class="tcs-val">'+logs+'</div></div></div><div class="tree-card-status"><div class="status-dot" style="background:#f59e0b"></div><div class="status-txt">Waiting approval</div></div></div><div class="tree-card-btns"><button class="tcbtn tcbtn-logs" onclick="goTo(\'tree-logs\')"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button><button class="tcbtn tcbtn-pay" onclick="goTo(\'pay-logs\')"><i class="ti ti-receipt" style="font-size:0.8667rem"></i> Payments</button></div>';
  cardsEl.appendChild(card);
  console.log('[sponsor] appendSponsorWaitingCard added card', id, 'now count', cardsEl.querySelectorAll('.tree-card-sponsor').length);
  setStatById('s-sponsor-waiting', cardsEl.querySelectorAll('.tree-card-sponsor').length);
  setTimeout(function(){ console.log('[sponsor] appendSponsorWaitingCard goTo sponsor-waiting'); goTo('sponsor-waiting'); }, 500);
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
function openSponsorWaitingRequests() {
  var titleEl = document.getElementById('swaiting-page-title');
  if (titleEl) titleEl.textContent = 'Sponsor request';
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  var waiting_raw = (role.cards || {}).waiting || [];
  var sorted_waiting = getSortedWaitingList(waiting_raw, 'desc');
  var ids = sorted_waiting.map(function(e){ return e.treeId; });
  var added_map = {};
  sorted_waiting.forEach(function(e){ added_map[e.treeId] = e.addedAt; });
  var data = window.__TREE_DATA || [];
  var requestList = ids.map(function(id){ for(var i=0;i<data.length;i++){ if(data[i].treeId===id) { var copy_t = {}; for(var k in data[i]) copy_t[k]=data[i][k]; copy_t.addedAt = added_map[id]; return copy_t; } } return null; }).filter(function(t){ return !!t; });
  var cardsEl = document.getElementById('sponsor-waiting-cards');
  var emptyEl = document.getElementById('sponsor-waiting-empty');
  if (cardsEl) cardsEl.innerHTML = requestList.map(sponsorCardHtml).join('');
  if (emptyEl) emptyEl.style.display = requestList.length ? 'none' : 'block';
  goTo('sponsor-waiting');
}




function sponsorCardHtml(t) {
  var q = String.fromCharCode(39);
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var status = c.statusLogged || c.statusChecked || st.health || '';
  var name_txt = sponsorCardName(t) || t.englishName || t.name || '';
  var addr_txt = sponsorCardAddr(t) || c.addr || '';
  return '<div class="tree-card-sponsor">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + t.addedAt + '</span><button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); openDeleteConfirm(\'' + t.treeId + '\')"><i class="ti ti-trash"></i></button></div>' +
    '<div class="tree-card-hero" style="background:' + (t.bg || c.bg || '') + ';cursor:pointer;position:relative;" onclick="openProfile(' + q + t.treeId + q + ')"><button class="card-pin-btn" type="button" onclick="event.stopPropagation();openTreeMapById(' + q + t.treeId + q + ')"><i class="ti ti-map-pin" style="font-size:0.8rem"></i></button><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (t.emoji || c.emoji || '') + ' ' + name_txt + ' <span class="tcard-id">' + t.treeId + '</span></h3><p><i class="ti ti-map-pin" style="font-size:0.6rem"></i> ' + addr_txt + '</p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (st.height || c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (st.diameter || c.diameter || '—') + '</div></div><div class="tcs"><div class="tcs-label">Logs</div><div class="tcs-val">' + (keys.length || c.logs || 0) + '</div></div></div>' +
    '<div class="tree-card-status"><div class="status-dot" style="background:' + (c.statusDot || '#4ade80') + '"></div><div class="status-txt">' + status + '</div></div></div>' +
    '<div class="tree-card-btns"><button class="tcbtn tcbtn-logs" onclick="openTreeLogs(\'' + t.treeId + '\')"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button><button class="tcbtn tcbtn-pay" onclick="goTo(\'pay-logs\')"><i class="ti ti-receipt" style="font-size:0.8667rem"></i> Payments</button></div>' +
    '</div>';
}
function removeSponsorCard(remove_tree_id) {
  var login_data = window._login || {};
  var tree_login = login_data['tree-login'] || {};
  var sponsor_role = tree_login.sponsor || {};
  var sponsor_cards = sponsor_role.cards || {};
  ['waiting','current','past'].forEach(function(list_name){
    var list_data = sponsor_cards[list_name] || [];
    sponsor_cards[list_name] = list_data.filter(function(e){ var id = typeof e === 'string' ? e : e.treeId; return id !== remove_tree_id; });
  });
  storage.set('login', login_data);
  if (window.render && typeof window.render.init === 'function') window.render.init();
}
var pending_delete_id = '';
function openDeleteConfirm(delete_tree_id) {
  pending_delete_id = delete_tree_id;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove tree ' + delete_tree_id + ' from your list?';
  document.getElementById('delete-confirm-modal').classList.add('open');
}
function confirmDeleteCard() {
  document.getElementById('delete-confirm-modal').classList.remove('open');
  if (pending_delete_id) { removeSponsorCard(pending_delete_id); pending_delete_id = ''; }
}
function cancelDeleteCard() {
  pending_delete_id = '';
  document.getElementById('delete-confirm-modal').classList.remove('open');
}
function renderSponsorCards() {
  var data = window.__TREE_DATA || [];
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  var cards = role.cards || {};
  var current_raw = cards.current || [];
  var past_raw = cards.past || [];
  var sorted_current = getSortedWaitingList(current_raw, 'desc');
  var sorted_past = getSortedWaitingList(past_raw, 'desc');
  var currentIds = sorted_current.map(function(e){ return e.treeId || e; });
  var pastIds = sorted_past.map(function(e){ return e.treeId || e; });
  var current_map = {}; sorted_current.forEach(function(e){ if(e && e.treeId) current_map[e.treeId]=e.addedAt; });
  var past_map = {}; sorted_past.forEach(function(e){ if(e && e.treeId) past_map[e.treeId]=e.addedAt; });
  var currentList = currentIds.length ? data.filter(function (t) { return currentIds.indexOf(t.treeId) > -1; }).sort(function(a,b){ return currentIds.indexOf(a.treeId) - currentIds.indexOf(b.treeId); }).map(function(t){ var c={}; for(var k in t) c[k]=t[k]; c.addedAt=current_map[t.treeId]; return c; }) : [];
  var pastList = pastIds.length ? data.filter(function (t) { return pastIds.indexOf(t.treeId) > -1; }).sort(function(a,b){ return pastIds.indexOf(a.treeId) - pastIds.indexOf(b.treeId); }).map(function(t){ var c={}; for(var k in t) c[k]=t[k]; c.addedAt=past_map[t.treeId]; return c; }) : [];
  var currentCards = document.getElementById('sponsor-current-cards');
  if (currentCards) currentCards.innerHTML = currentList.map(sponsorCardHtml).join('');
  var pastCards = document.getElementById('sponsor-past-cards');
  if (pastCards) pastCards.innerHTML = pastList.map(sponsorCardHtml).join('');
  sponsoredCount = currentList.length + pastList.length;
  setStatById('s-tree-current', currentList.length);
  setStatById('s-tree-past', pastList.length);
  setStatById('s-current-count', currentList.length);
  setStatById('s-past-count', pastList.length);
  setStatById('s-sponsor-waiting', (cards.waiting || []).length);
  var monthlyEl = document.getElementById('s-monthly');
  if (monthlyEl) monthlyEl.textContent = '₹' + (sponsoredCount * 300);
}

function consumePendingSponsorRequest() {
  try {
    var raw = sessionStorage.getItem('pendingSponsor');
    console.log('[sponsor] consumePendingSponsor raw', raw);
    if (!raw) return false;
    var pending = JSON.parse(raw);
    var login = storage.get('login') || window._login || {};
    var tl = login['tree-login'] || (login['tree-login'] = {});
    var changed = false;
    for (var userid in pending) {
      if (!Object.prototype.hasOwnProperty.call(pending, userid)) continue;
      var treeId = pending[userid];
      console.log('[sponsor] processing pending', userid, treeId);
      var target = null; var target_key = null;
      for (var k in tl) { if (tl[k] && tl[k].userId === userid) { target = tl[k]; target_key = k; break; } }
      if (!target && userid === 'sponsor') {
        for (var kk in tl) { if (tl[kk] && tl[kk].type === 'sponsor') { target = tl[kk]; target_key = kk; break; } }
      }
      console.log('[sponsor] target found', target_key, !!target);
      if (target) {
        var cards = target.cards || (target.cards = {});
        var waiting = cards.waiting || (cards.waiting = []);
        var waiting_ids = waiting.map(function(e){ return e.treeId; });
        if (waiting_ids.indexOf(treeId) === -1) { waiting.push({treeId: treeId, addedAt: getCurrentAddedAtString()}); changed = true; console.log('[sponsor] added to waiting', treeId); } else { console.log('[sponsor] already in waiting', treeId); }
        cards.waiting = waiting; target.cards = cards; tl[target_key] = target;
      } else { console.log('[sponsor] no target for userid', userid); }
    }
    if (changed) { login['tree-login'] = tl; storage.set('login', login); window._login = login; console.log('[sponsor] saved login', login); }
    sessionStorage.removeItem('pendingSponsor');
    console.log('[sponsor] consume done changed', changed);
    return changed;
  } catch (e) { console.log('[sponsor] consume error', e); try { sessionStorage.removeItem('pendingSponsor'); } catch (e2) {} return false; }
}
window.render = {
  init: function () {
    var had_pending = false;
    if (hubMode === 'sponsor-dash' || hubMode === 'sponsor-waiting') { had_pending = consumePendingSponsorRequest(); }
    var data = storage.get('treeCards') || [];
    window.__TREE_DATA = data;
    albumData = Array.isArray(data) ? data : (data.albumData || []);
    renderSponsorCards();
    var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
    var cards = role.cards || {};
    payTreeId = (cards.current || [])[0] || '';
    renderPayLogs();
    if (had_pending) { openSponsorWaitingRequests(); return; }
    if (hubMode === 'sponsor-waiting') { openSponsorWaitingRequests(); }
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
  var addr_raw = sponsorCardAddr(t) || c.addr || '';
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

function openTreePool() {
  var login = storage.get('login') || window._login || {};
  var role = (login['tree-login'] && login['tree-login']['sponsor']) || (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['sponsor']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var cards = role.cards || {};
  var exclude = [].concat(cards.current || [], cards.past || [], cards.waiting || []).join(',');
  var parent = encodeURIComponent('sponsor.html?hub=sponsor-dash');
  var userid = role.userId || '';
  console.log('[sponsor] openTreePool userid', userid, 'exclude', exclude);
  window.location.href = 'filter.html?userid=' + encodeURIComponent(userid) + '&parent=' + parent + '&exclude=' + encodeURIComponent(exclude);
}

function getSponsorParentUrl() {
  var parent_url = new URLSearchParams(location.search).get('parent');
  return parent_url ? parent_url : null;
}

function goBackFromSponsorLogin() {
  var parent_url = getSponsorParentUrl();
  if (parent_url) { window.location.href = parent_url; return; }
  window.location.href = 'login-hub.html';
}

var hubMode = new URLSearchParams(location.search).get('hub');
console.log('[sponsor] hubMode', hubMode, 'href', location.href);
if (hubMode === 'login') { goTo('sponsor-login'); }
else if (hubMode === 'register') { goTo('sponsor-enroll'); }
else if (hubMode === 'sponsor-dash') { goTo('sponsor-dash'); }
else if (hubMode === 'sponsor-waiting') { goTo('sponsor-waiting'); }
else { console.log('[sponsor] unknown hubMode, redirect to login-hub'); window.location.href = 'login-hub.html'; }

