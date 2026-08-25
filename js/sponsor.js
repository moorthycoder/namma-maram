
var TESTING_MODE = true;
var profileFrom = 'sponsor-login';
var albumFrom = 'profile';
var treeLogsFrom = 'trees';
var payLogsFrom = 'sponsor-dash';
var sponsoredCount = 0;
var caredCount = 4;
var logoutTarget = 'sponsor-login';
var payTreeId = '';

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
  goTo('sponsor-dash');
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



function closeLoginStatus(go) {
  document.getElementById('login-status-modal').classList.remove('open');
  if (!go) return;
  var pending = readPendingSponsor();
  if (pending && pending.treeId) { sponsorATree(pending); return; }
  goTo(logoutTarget);
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

var logs = [
  { date:'12 Jun 2026', height:'8.4 m', diam:'22 cm', note:'Canopy looking dense. New shoots visible on upper branches. No signs of disease.', photos:[{bg:'linear-gradient(135deg,#2d5a1b,#4a7c2f)',emoji:'🌿',label:'Full canopy',time:'9:12 AM',main:true},{bg:'linear-gradient(135deg,#1a3a0a,#2d5a1b)',emoji:'🌲',label:'Trunk close-up',time:'9:14 AM'},{bg:'linear-gradient(135deg,#3B6D11,#639922)',emoji:'🍃',label:'New shoots',time:'9:16 AM'}] },
  { date:'10 Jan 2026', height:'8.1 m', diam:'21 cm', note:'Some yellowing on lower leaves — likely seasonal.', photos:[{bg:'linear-gradient(135deg,#1e3d0f,#2d5a1b)',emoji:'🌳',label:'Full tree',time:'10:05 AM',main:true},{bg:'linear-gradient(135deg,#27500A,#3B6D11)',emoji:'🍂',label:'Lower leaves',time:'10:08 AM'}] },
  { date:'15 Jul 2025', height:'7.6 m', diam:'21 cm', note:'Measurement only. Camera not available. Tree looks healthy overall.', photos:[] }
];



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
    showTreeDetailsInMap(tree);
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
    showTreeDetailsInMap(tree);
  } else {
    alert('Location not available for this tree.');
  }
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
  var login = window._login || (window._login = {});
  var tl = login['tree-login'] || (login['tree-login'] = {});
  var role = tl.sponsor || (tl.sponsor = {});
  var cards = role.cards || (role.cards = {});
  var waiting = cards.waiting || (cards.waiting = []);
  if (f.treeId && waiting.indexOf(f.treeId) === -1) { waiting.push(f.treeId); }
  appendSponsorWaitingCard(f);
  storage.set('login', login);
  if (window.render && typeof window.render.init === 'function') { window.render.init(); }
}

function readPendingSponsor() {
  var s = null;
  try { s = sessionStorage.getItem('pendingSponsorV1'); } catch (e) {}
  if (!s) return null;
  try { sessionStorage.removeItem('pendingSponsorV1'); } catch (e) {}
  try { return JSON.parse(s); } catch (e) { return null; }
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
  var name = form.name || '';
  var loc = form.loc || '';
  var bg = form.bg || '';
  var emoji = form.emoji || '';
  var height = form.height;
  var diam = form.diam;
  var logs = form.logs;
  var id = form.treeId || name.split('#')[1] || '';
  var cardsEl = document.getElementById('sponsor-waiting-cards');
  var emptyEl = document.getElementById('sponsor-waiting-empty');
  if (emptyEl) emptyEl.style.display = 'none';
  if (!cardsEl) { return; }
  var card = document.createElement('div');
  card.className = 'tree-card-sponsor';
  card.innerHTML = '<div class="tree-card-hero" style="background:'+bg+';cursor:pointer;" onclick="openProfile(\''+id+'\')"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>'+emoji+' '+name+'</h3><p><i class="ti ti-map-pin" style="font-size:0.6rem"></i> '+loc+'</p></div></div><div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">'+height+'m</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">'+diam+'</div></div><div class="tcs"><div class="tcs-label">Logs</div><div class="tcs-val">'+logs+'</div></div></div><div class="tree-card-status"><div class="status-dot" style="background:#f59e0b"></div><div class="status-txt">Waiting approval</div></div></div><div class="tree-card-btns"><button class="tcbtn tcbtn-logs" onclick="goTo(\'tree-logs\')"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button><button class="tcbtn tcbtn-pay" onclick="goTo(\'pay-logs\')"><i class="ti ti-receipt" style="font-size:0.8667rem"></i> Payments</button></div>';
  cardsEl.appendChild(card);
  setStatById('s-sponsor-waiting', cardsEl.querySelectorAll('.tree-card-sponsor').length);
  setTimeout(function(){ goTo('sponsor-waiting'); }, 500);
}

function openSponsorWaitingRequests() {
  var titleEl = document.getElementById('swaiting-page-title');
  if (titleEl) titleEl.textContent = 'Sponsor request';
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  var ids = (role.cards || {}).waiting || [];
  var data = window.__TREE_DATA || [];
  var requestList = ids.length ? data.filter(function (t) { return ids.indexOf(t.treeId) > -1; }) : [];
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
  return '<div class="tree-card-sponsor">' +
    '<div class="tree-card-hero" style="background:' + (t.bg || c.bg || '') + ';cursor:pointer;" onclick="openProfile(' + q + t.treeId + q + ')"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (t.emoji || c.emoji || '') + ' ' + (t.englishName || t.name || '') + '</h3><p><i class="ti ti-map-pin" style="font-size:0.6rem"></i> ' + (t.address || c.addr || '') + '</p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (st.height || c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (st.diameter || c.diameter || '—') + '</div></div><div class="tcs"><div class="tcs-label">Logs</div><div class="tcs-val">' + (keys.length || c.logs || 0) + '</div></div></div>' +
    '<div class="tree-card-status"><div class="status-dot" style="background:' + (c.statusDot || '#4ade80') + '"></div><div class="status-txt">' + status + '</div></div></div>' +
    '<div class="tree-card-btns"><button class="tcbtn tcbtn-logs" onclick="goTo(' + q + 'tree-logs' + q + ')"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button><button class="tcbtn tcbtn-pay" onclick="goTo(' + q + 'pay-logs' + q + ')"><i class="ti ti-receipt" style="font-size:0.8667rem"></i> Payments</button></div>' +
    '</div>';
}
function renderSponsorCards() {
  var data = window.__TREE_DATA || [];
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  var cards = role.cards || {};
  var currentIds = cards.current || [];
  var pastIds = cards.past || [];
  var currentList = currentIds.length ? data.filter(function (t) { return currentIds.indexOf(t.treeId) > -1; }) : [];
  var pastList = pastIds.length ? data.filter(function (t) { return pastIds.indexOf(t.treeId) > -1; }) : [];
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

window.render = {
  init: function () {
    var data = storage.get('treeCards') || [];
    window.__TREE_DATA = data;
    albumData = Array.isArray(data) ? data : (data.albumData || []);
    renderSponsorCards();
    var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
    var cards = role.cards || {};
    payTreeId = (cards.current || [])[0] || '';
    renderPayLogs();
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

function openTreePool() {
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  var cards = role.cards || {};
  var exclude = [].concat(cards.current || [], cards.past || [], cards.waiting || []).join(',');
  var parent = encodeURIComponent('sponsor.html?hub=sponsor-dash');
  window.location.href = 'tree-pool.html?parent=' + parent + '&exclude=' + encodeURIComponent(exclude);
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
if (hubMode === 'login') { goTo('sponsor-login'); }
else if (hubMode === 'register') { goTo('sponsor-enroll'); }
else if (hubMode === 'sponsor-dash') { goTo('sponsor-dash'); }
else { window.location.href = 'login-hub.html'; }

