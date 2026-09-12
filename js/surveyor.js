
var TESTING_MODE = true;
var profileFrom = 'surveyor-login';
var albumFrom = 'profile';
var treeLogsFrom = 'trees';
var sponsoredCount = 2;
var caredCount = 4;
var logoutTarget = 'surveyor-login';

function loadCurrentUser() {
  try {
    var s = sessionStorage.getItem('loginCredentialsV1');
    if (!s) { return; }
    var cred = JSON.parse(s);
    var role = cred['tree-login'] && cred['tree-login']['surveyor'];
    if (!role) { return; }
    var nameEl = document.getElementById('user-name');
    var avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = role.name;
    if (avatarEl) avatarEl.textContent = role.avatar;
    window._login = cred;
  } catch (e) {}
}
loadCurrentUser();

function continueAsSurveyor() {
  goTo('surveyor-dash');
}

function getSurveyorParentUrl() {
  var parent_url = new URLSearchParams(location.search).get('parent');
  return parent_url ? parent_url : null;
}

function goBackFromSurveyorLogin() {
  var parent_url = getSurveyorParentUrl();
  if (parent_url) { window.location.href = parent_url; return; }
  window.location.href = 'login-hub.html';
}

document.addEventListener('DOMContentLoaded', function() {
  try {
    var cred = null;
    try { cred = storage.get('login'); } catch (e) {}
    if (!cred) { var s = sessionStorage.getItem('loginCredentialsV1'); if (s) cred = JSON.parse(s); }
    var role = cred && cred['tree-login'] && cred['tree-login']['surveyor'];
    if (role) {
      var btn = document.getElementById('continue-as-btn');
      var name_el = document.getElementById('continue-as-name');
      if (btn) btn.style.display = 'flex';
      if (name_el) name_el.textContent = role.name || 'Surveyor';
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
  existing_member:  { icon:'ti ti-user-check',  color:'#16a34a', bg:'#dcfce7', title:'Already registered',        text:'An account with this email already exists. Please log in instead of registering again.', go:'Login', to:'surveyor-login' },
  blocked:          { icon:'ti ti-ban',         color:'#dc2626', bg:'#fee2e2', title:'Registration blocked',       text:'Your registration has been blocked. Please contact support if you think this is a mistake.', go:'Contact us', to:'surveyor-login' },
  registered:       { icon:'ti ti-tree',        color:'#16a34a', bg:'#dcfce7', title:'Tree registered',           text:'The tree has been added to the registry.' },
  added:            { icon:'ti ti-database-plus',color:'#16a34a', bg:'#dcfce7', title:'Tree name added',           text:'The tree name has been appended to the database.' },
  place_added:      { icon:'ti ti-database-plus',color:'#16a34a', bg:'#dcfce7', title:'Place name added',          text:'The place name has been appended to the database.' }
};

// Register status modal — waiting / existing_member / blocked
var regTarget = 'surveyor-login';

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




function toggleSurveyorLogoutDrop() {
  document.getElementById('logout-drop-surveyor').classList.toggle('open');
}
function surveyorLogout() {
  try {
    if (window.parent && window.parent.goNav) { window.parent.goNav('login-hub.html'); return; }
    if (window.top && window.top.goNav) { window.top.goNav('login-hub.html'); return; }
  } catch (e) {}
  window.top.location.href = 'login-hub.html';
}

function switchSurveyorPanel(snake_case) {
  var is_action = snake_case === 'action';
  var action_panel = document.getElementById('panel-surveyor-action');
  var stat_panel = document.getElementById('panel-surveyor-stat');
  var action_btn = document.getElementById('dash-btn-action');
  var stat_btn = document.getElementById('dash-btn-stat');
  if (action_panel) action_panel.style.display = is_action ? 'grid' : 'none';
  if (stat_panel) stat_panel.style.display = is_action ? 'none' : 'grid';
  if (action_btn) action_btn.classList.toggle('active', is_action);
  if (stat_btn) stat_btn.classList.toggle('active', !is_action);
}

function goBackToSurveyorStats() {
  goTo('surveyor-dash');
  switchSurveyorPanel('stat');
}

function openRegisterATreePage() {
  var login_data = storage.get('login') || window._login || {};
  var surveyor_role = (login_data['tree-login'] && login_data['tree-login']['surveyor']) || {};
  try {
    if (!surveyor_role.userId) {
      var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1') || '{}');
      var sp = sess['tree-login'] && sess['tree-login']['surveyor'];
      if (sp && sp.userId) { surveyor_role = sp; }
    }
  } catch (e) {}
  var parent = encodeURIComponent('surveyor.html?hub=surveyor-dash');
  var user_id = surveyor_role.userId || '';
  window.location.href = 'register-a-tree.html?parent=' + parent + '&userid=' + encodeURIComponent(user_id);
}

function openSurveyATreePage() {
  var login_data = storage.get('login') || window._login || {};
  var surveyor_role = (login_data['tree-login'] && login_data['tree-login']['surveyor']) || {};
  try {
    if (!surveyor_role.userId) {
      var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1') || '{}');
      var sp = sess['tree-login'] && sess['tree-login']['surveyor'];
      if (sp && sp.userId) { surveyor_role = sp; }
    }
  } catch (e) {}
  var parent = encodeURIComponent('surveyor.html?hub=surveyor-dash');
  var user_id = surveyor_role.userId || '';
  window.location.href = 'survey-a-tree.html?parent=' + parent + '&userid=' + encodeURIComponent(user_id);
}

function openAppendTreeName() {
  var login_data = storage.get('login') || window._login || {};
  var surveyor_role = (login_data['tree-login'] && login_data['tree-login']['surveyor']) || {};
  try {
    if (!surveyor_role.userId) {
      var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1') || '{}');
      var sp = sess['tree-login'] && sess['tree-login']['surveyor'];
      if (sp && sp.userId) { surveyor_role = sp; }
    }
  } catch (e) {}
  var user_id = surveyor_role.userId || 'SVY-TEST-003';
  var frame = document.createElement('iframe');
  frame.className = 'app-frame';
  frame.id = 'app-frame';
  frame.title = 'Append Tree Name';
  frame.src = 'append-a-tree-name.html?parent=' + encodeURIComponent('surveyor.html?hub=surveyor-tree-name-submitted') + '&userid=' + encodeURIComponent(user_id);
  var dash_page = document.getElementById('page-surveyor-dash');
  if (dash_page) dash_page.style.display = 'none';
  var screen = document.querySelector('.screen');
  if (screen) screen.insertBefore(frame, dash_page ? dash_page.nextSibling : null);
}

function openAppendPlaceName() {
  var login_data = storage.get('login') || window._login || {};
  var surveyor_role = (login_data['tree-login'] && login_data['tree-login']['surveyor']) || {};
  try {
    if (!surveyor_role.userId) {
      var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1') || '{}');
      var sp = sess['tree-login'] && sess['tree-login']['surveyor'];
      if (sp && sp.userId) { surveyor_role = sp; }
    }
  } catch (e) {}
  var user_id = surveyor_role.userId || 'SVY-TEST-003';
  var frame = document.createElement('iframe');
  frame.className = 'app-frame';
  frame.id = 'app-frame';
  frame.title = 'Append Place Name';
  frame.src = 'append-a-place-name.html?parent=' + encodeURIComponent('surveyor.html?hub=surveyor-place-name-submitted') + '&userid=' + encodeURIComponent(user_id);
  var dash_page = document.getElementById('page-surveyor-dash');
  if (dash_page) dash_page.style.display = 'none';
  var screen = document.querySelector('.screen');
  if (screen) screen.insertBefore(frame, dash_page ? dash_page.nextSibling : null);
}

function requestTreeForSurvey() {
  var login_data = storage.get('login') || window._login || {};
  var surveyor_role = (login_data['tree-login'] && login_data['tree-login']['surveyor']) || {};
  try {
    if (!surveyor_role.userId) {
      var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1') || '{}');
      var sp = sess['tree-login'] && sess['tree-login']['surveyor'];
      if (sp && sp.userId) surveyor_role = sp;
    }
  } catch (e) {}
  var surveyor_cards = surveyor_role.cards || {};
  var role_cfg = getRoleConfig('surveyor');
  var tiles_my = (role_cfg.tiles && role_cfg.tiles['my-trees']) || {};
  var stats_req = (role_cfg.stats && role_cfg.stats['survey-requests']) || {};
  var surveyor_waiting = [];
  try { surveyor_waiting = JSON.parse(sessionStorage.getItem('surveyorSurveyWaiting') || '[]'); } catch (e) {}
  var exclude_list = [].concat(
    (tiles_my.current || []).map(function (c) { return c.treeId || c; }),
    (tiles_my.past || []).map(function (c) { return c.treeId || c; }),
    (surveyor_cards.current || []).map(function (c) { return c.treeId || c; }),
    (surveyor_cards.past || []).map(function (c) { return c.treeId || c; }),
    (stats_req.approved || []).map(function (c) { return c.treeId || c; }),
    (stats_req.submitted || []).map(function (c) { return c.treeId || c; }),
    surveyor_waiting
  ).filter(Boolean);
  var exclude_param = exclude_list.join(',');
  var parent_param = encodeURIComponent('surveyor.html?hub=surveyor-dash');
  var user_id = surveyor_role.userId || '';
  var target_url = 'filter.html?userid=' + encodeURIComponent(user_id) + '&parent=' + parent_param + '&exclude=' + encodeURIComponent(exclude_param);
  try { sessionStorage.setItem('gobackFromTreeProfile', target_url); } catch (e) {}
  window.location.href = target_url;
}

function getCurrentAddedAtStringSurveyor() {
  var now_date = new Date();
  var yyyy = String(now_date.getFullYear());
  var mm = String(now_date.getMonth() + 1).padStart(2, '0');
  var dd = String(now_date.getDate()).padStart(2, '0');
  var hh = String(now_date.getHours()).padStart(2, '0');
  var mi = String(now_date.getMinutes()).padStart(2, '0');
  var ss = String(now_date.getSeconds()).padStart(2, '0');
  return yyyy + mm + dd + 'T' + hh + mi + ss;
}

function surveyorRequestATree(form_data) {
  var login_data = window._login || {};
  var tree_login = login_data['tree-login'] || {};
  var surveyor_role = tree_login.surveyor || {};
  var stats = (function () { try { return getRoleConfig('surveyor').stats || {}; } catch (e) { return {}; } })();
  stats['survey-requests'] = stats['survey-requests'] || { approved: [], submitted: [] };
  var submitted_list = stats['survey-requests'].submitted || [];
  var submitted_ids = submitted_list.map(function (e) { return e.treeId || e; });
  var tree_id = form_data.treeId || '';
  var is_already = submitted_ids.indexOf(tree_id) > -1 ? true : false;
  var can_push = !is_already && !!tree_id;
  if (can_push) submitted_list.push({ treeId: tree_id, loggedAt: getCurrentAddedAtStringSurveyor() });
  stats['survey-requests'].submitted = submitted_list;
  try { storage.set('login', login_data); } catch (e) {}
  if (typeof renderSurveyorStats === 'function') renderSurveyorStats();
  if (typeof openSurveyorSurveyRequests === 'function') setTimeout(function () { openSurveyorSurveyRequests('submitted'); }, 500);
}

function checkNewSurveyorTrees() {
  var waiting_str = sessionStorage.getItem('surveyorSurveyWaiting');
  if (waiting_str === null) return [];
  var new_ids = [];
  try { var arr = JSON.parse(waiting_str); if (Array.isArray(arr)) new_ids = arr.filter(function (e) { return typeof e === 'string' && e; }); } catch (e) { new_ids = []; }
  if (!new_ids.length) return [];
  var ram_data = storage.get('treeCards') || window.__TREE_DATA || [];
  var pending_trees = [];
  for (var i = 0; i < new_ids.length; i++) {
    var tree_id = new_ids[i];
    for (var r = 0; r < ram_data.length; r++) { if (ram_data[r].treeId === tree_id) { pending_trees.push(ram_data[r]); break; } }
  }
  if (pending_trees.length) {
    var login_data = window._login || {};
    var tree_login = login_data['tree-login'] || {};
    var surveyor_role = tree_login.surveyor || {};
    var role_cfg = getRoleConfig('surveyor');
    role_cfg.stats = role_cfg.stats || {};
    role_cfg.stats['survey-requests'] = role_cfg.stats['survey-requests'] || { approved: [], submitted: [] };
    var submitted_list = role_cfg.stats['survey-requests'].submitted || [];
    var submitted_ids = submitted_list.map(function (e) { return e.treeId || e; });
    var added_count = 0;
    for (var p = 0; p < new_ids.length; p++) {
      var pid = new_ids[p];
      var already = submitted_ids.indexOf(pid) > -1;
      if (!already) { submitted_list.push({ treeId: pid, loggedAt: getCurrentAddedAtStringSurveyor() }); added_count++; }
    }
    role_cfg.stats['survey-requests'].submitted = submitted_list;
    try { storage.set('login', login_data); window._login = login_data; } catch (e) {}
    sessionStorage.removeItem('surveyorSurveyWaiting');
    try { renderSurveyorStats(); } catch (e) {}
    if (added_count) setTimeout(function () { if (typeof openSurveyorSurveyRequests === 'function') openSurveyorSurveyRequests('submitted'); }, 300);
  }
  return new_ids;
}

function backToStart() {
  var frame = document.getElementById('app-frame');
  var return_to = '';
  if (frame) {
    try {
      var query_string = (frame.getAttribute('src') || '').split('?')[1] || '';
      var parent_param = new URLSearchParams(query_string).get('parent') || '';
      if (parent_param && parent_param.indexOf('surveyor.html') > -1) { return_to = parent_param; }
    } catch (e) {}
  }
  if (frame && frame.parentNode) { frame.parentNode.removeChild(frame); }
  var dash_page = document.getElementById('page-surveyor-dash');
  if (dash_page) dash_page.style.display = '';
  if (return_to && return_to.indexOf('hub=surveyor-tree-name') > -1) {
    try { renderSurveyorStats(); } catch (e) {}
    if (return_to.indexOf('submitted') > -1) openSurveyorTreeName('submitted'); else openSurveyorTreeName('approved');
    return;
  }
  if (return_to && return_to.indexOf('hub=surveyor-place-name') > -1) {
    try { renderSurveyorStats(); } catch (e) {}
    if (return_to.indexOf('submitted') > -1) openSurveyorPlaceName('submitted'); else openSurveyorPlaceName('approved');
    return;
  }
  if (return_to) { window.top.location.href = return_to; return; }
  if (dash_page) { dash_page.style.display = 'flex'; dash_page.classList.add('active'); }
}








// Navigation

function toggleTreeCard(btn) {
  var card = btn.closest('.tcard');
  if (!card) return;
  var coll = card.querySelector('.tcard-collapse');
  var ic = btn.querySelector('i');
  var open = coll.style.display === 'block';
  coll.style.display = open ? 'none' : 'block';
  ic.className = open ? 'ti ti-chevron-down' : 'ti ti-chevron-up';
}

function goTo(page) {
  console.log('[goTo]', page, !!document.getElementById('page-'+page));
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
  var target_page = document.getElementById('page-'+page);
  if (target_page) { target_page.classList.add('active'); }
  else { console.warn('goTo: page not found', page); return; }
  if (page === 'selfie' && typeof renderSurveySelfie === 'function') { try { renderSurveySelfie(); } catch (e) {} }
  if (page === 'snapshots' && typeof renderSurveySnapGrid === 'function') { try { renderSurveySnapGrid(); } catch (e) {} }
  if (page === 'capture' && typeof renderSurveyCapturePage === 'function') { try { renderSurveyCapturePage(); } catch (e) {} }
  var sb = document.getElementById('sbar');
  sb.className = 'status-bar';
  if (['surveyor-login','surveyor-enroll','ranger-login','ranger-dash','surveyor-login','surveyor-dash','append-tree-name','append-place-name','register-tree','trees','admin-login','admin-dash','admin-trees','admin-edit-tree','admin-add-tree','admin-trackers','admin-sponsors','admin-trackers-prospective','admin-sponsors-prospective','ranger-enroll','sponsor-enroll','surveyor-enroll','role-login'].indexOf(page) > -1) sb.classList.add('dark');
  else if (['sponsor-login','sponsor-dash','caregiver-login','caregiver-dash'].indexOf(page) > -1) sb.classList.add('blue');
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


// Search tree - searches scientific, english and local names

function searchById() {
  applyFilters();
}



function searchTree() {
  searchById();
}


// Open profile

function openProfile(treeId) {
  var id = treeId || '625501-06-0001';
  var active = document.querySelector('.page.active');
  var current_hub = active ? active.id.replace('page-','') : 'surveyor-dash';
  var parent = encodeURIComponent('surveyor.html?hub=' + current_hub);
  try { sessionStorage.setItem('gobackFromTreeProfile', decodeURIComponent(parent)); } catch (e) {}
  var userid = '';
  try {
    var login = storage.get('login') || window._login || {};
    var role = (login['tree-login'] && login['tree-login']['surveyor']) || {};
    userid = role.userId || new URLSearchParams(location.search).get('userid') || '';
  } catch (e) {}
  var userid_param = userid ? '&userid=' + encodeURIComponent(userid) : '';
  var flang = (typeof filterLang !== 'undefined' ? filterLang : (typeof appLang !== 'undefined' ? appLang : 'en'));
  window.location.href = 'tree-profile.html?treeId=' + encodeURIComponent(id) + '&parent=' + parent + '&flang=' + encodeURIComponent(flang) + userid_param;
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
  var place_el = document.getElementById('album-place');
  var tree_el = document.getElementById('album-tree');
  if (!place_el || !tree_el) { return; }
  renderAlbum(place_el.value.trim(), tree_el.value.trim());
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
    return hasTreeGis(t);
  }).map(function(t){
    return treeMapCoords(t);
  });
  if (coords.length > 0) {
    showMap(coords.join('|'));
  } else {
    alert('No tree locations found to show on the map.');
  }
}


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
function renderSurveyorStats() {
  var stats = getRoleConfig('surveyor').stats || {};
  var role_cfg = getRoleConfig('surveyor');
  var tiles_my = role_cfg.tiles && role_cfg.tiles['my-trees'] || {};
  var my_current_len = Array.isArray(tiles_my.current) ? tiles_my.current.length : 0;
  var my_past_len = Array.isArray(tiles_my.past) ? tiles_my.past.length : 0;
  if (!my_current_len && stats['my-trees'] && typeof stats['my-trees'].current === 'number') my_current_len = stats['my-trees'].current;
  if (!my_past_len && stats['my-trees'] && typeof stats['my-trees'].past === 'number') my_past_len = stats['my-trees'].past;
  var zone = stats.zone || {};
  var logs = stats["survey-log"] || {};
  var approved_val = Array.isArray(logs.approved) ? logs.approved.length : logs.approved;
  var submitted_val = Array.isArray(logs.submitted) ? logs.submitted.length : logs.submitted;
  setStatById('svy-logs-approved', approved_val != null ? approved_val : '—');
  setStatById('svy-logs-submitted', submitted_val != null ? submitted_val : '—');
  var tree_name = stats['tree-name'] || stats.treeName || stats.tree_name || {};
  var tree_name_approved = Array.isArray(tree_name.approved) ? tree_name.approved.length : tree_name.approved;
  var tree_name_submitted = Array.isArray(tree_name.submitted) ? tree_name.submitted.length : tree_name.submitted;
  setStatById('svy-tree-name-approved', tree_name_approved != null ? tree_name_approved : 0);
  setStatById('svy-tree-name-submitted', tree_name_submitted != null ? tree_name_submitted : 0);
  var place_name = stats['place-name'] || stats.placeName || stats.place_name || {};
  var place_approved = Array.isArray(place_name.approved) ? place_name.approved.length : place_name.approved;
  var place_submitted = Array.isArray(place_name.submitted) ? place_name.submitted.length : place_name.submitted;
  setStatById('svy-place-approved', place_approved != null ? place_approved : 0);
  setStatById('svy-place-submitted', place_submitted != null ? place_submitted : 0);
  var register = stats["register-log"] || {};
  var register_approved = Array.isArray(register.approved) ? register.approved.length : register.approved;
  var register_submitted = Array.isArray(register.submitted) ? register.submitted.length : register.submitted;
  setStatById('svy-register-approved', register_approved != null ? register_approved : 0);
  setStatById('svy-register-submitted', register_submitted != null ? register_submitted : 0);
  var survey_req = stats["survey-requests"] || {};
  var survey_req_approved = Array.isArray(survey_req.approved) ? survey_req.approved.length : survey_req.approved;
  var survey_req_submitted = Array.isArray(survey_req.submitted) ? survey_req.submitted.length : survey_req.submitted;
  setStatById('svy-survey-requests-approved', survey_req_approved != null ? survey_req_approved : 0);
  setStatById('svy-survey-requests-submitted', survey_req_submitted != null ? survey_req_submitted : 0);
  var month = stats.month || {};
  var c = (typeof countRoleLogs === 'function') ? countRoleLogs('surveyor') : { total: null, month: null, covered: null };
  var month_logs = (c.month != null ? c.month : month.logs);
  var month_trees = month.trees;
  if (typeof roleTreeIds === 'function' && typeof storage !== 'undefined' && storage.pullTreeDetail) {
    try {
      var now = new Date();
      var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      var ids = roleTreeIds('surveyor');
      var month_set = {};
      var month_log_cnt = 0;
      for (var i = 0; i < ids.length; i++) {
        var t = storage.pullTreeDetail(ids[i]);
        if (!t || !t['encounters-list']) continue;
        var keys = Object.keys(t['encounters-list']);
        for (var k = 0; k < keys.length; k++) {
          var e = t['encounters-list'][keys[k]];
          var d = e.updatedDate || e.registeredDate || '';
          if (String(d).slice(0, 7) === ym) { month_log_cnt++; month_set[ids[i]] = true; }
        }
      }
      if (Object.keys(month_set).length || month_log_cnt) {
        month_trees = Object.keys(month_set).length;
        month_logs = month_log_cnt;
      }
    } catch (e) {}
  }
  setStatById('svy-month-trees', month_trees != null ? month_trees : '—');
  setStatById('svy-month-logs', month_logs != null ? month_logs : '—');
  var now_ym = (function(){ var d=new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0'); })();
  function getYmFromTimestamp(ts){ var s=String(ts||''); return s.indexOf('-')>-1 ? s.slice(0,7) : s.slice(0,4)+'-'+s.slice(4,6); }
  var this_month_log_approved = Array.isArray(logs.approved) ? logs.approved.filter(function(e){ return getYmFromTimestamp(e.loggedAt)===now_ym; }).length : 0;
  var this_month_log_submitted = Array.isArray(logs.submitted) ? logs.submitted.filter(function(e){ return getYmFromTimestamp(e.loggedAt)===now_ym; }).length : 0;
  setStatById('svy-this-month-log-approved', this_month_log_approved);
  setStatById('svy-this-month-log-submitted', this_month_log_submitted);
  var waiting_list_raw = Array.isArray(tiles_my.waiting) ? tiles_my.waiting : Array.isArray(stats.waiting) ? stats.waiting : [];
  var waiting_this_month = waiting_list_raw.filter(function(e){ return getYmFromTimestamp(e.addedAt||'')===now_ym; });
  var waiting_len = waiting_this_month.length;
  if (!waiting_len && waiting_list_raw.length) waiting_len = waiting_list_raw.length;
  var covered_val = (c.covered != null ? c.covered : (my_current_len + my_past_len));
  if (typeof month_trees === 'number' && month_trees) covered_val = month_trees;
  setStatById('svy-covered', covered_val != null ? covered_val : 0);
  setStatById('svy-waiting', waiting_len != null ? waiting_len : 0);
  setStatById('svy-my-current', my_current_len);
  setStatById('svy-my-past', my_past_len);
  setStatById('svy-my-trees-current', my_current_len);
  setStatById('svy-my-trees-past', my_past_len);
  setStatById('svy-zone-place', zone.place || '—');
  setStatById('svy-zone-future', zone.future != null ? zone.future : '—');
}

function openSurveyorLogsApproved() {
  var stats = getRoleConfig('surveyor').stats || {};
  var logs = stats["survey-log"] || {};
  var approved_list = Array.isArray(logs.approved) ? logs.approved : [];
  var approved_ids = approved_list.map(function (e) { return e.treeId || e; }).filter(Boolean);
  var map = {};
  approved_list.forEach(function (e) { if (e.treeId) map[e.treeId] = e.loggedAt || ''; });
  renderSurveyorLogCards('surveyor-logs-approved-cards', 'surveyor-logs-approved-empty', approved_ids, map);
  goTo('surveyor-logs-approved');
}

function openSurveyorLogsSubmitted() {
  var stats = getRoleConfig('surveyor').stats || {};
  var logs = stats["survey-log"] || {};
  var submitted_list = Array.isArray(logs.submitted) ? logs.submitted : [];
  var submitted_ids = submitted_list.map(function (e) { return e.treeId || e; }).filter(Boolean);
  var map = {};
  submitted_list.forEach(function (e) { if (e.treeId) map[e.treeId] = e.loggedAt || ''; });
  renderSurveyorLogCards('surveyor-logs-submitted-cards', 'surveyor-logs-submitted-empty', submitted_ids, map);
  goTo('surveyor-logs-submitted');
}

function openTreeNameEditForm(sci) {
  var parent = encodeURIComponent('surveyor.html?hub=surveyor-dash');
  try { var active=document.querySelector('.page.active'); if(active) parent=encodeURIComponent('surveyor.html?hub='+active.id.replace('page-','')); } catch(e){}
  window.location.href='append-a-tree-name.html?parent='+parent+'&editSci='+encodeURIComponent(sci);
}
function surveyorTreeNameCardHtml(entry, is_submitted) {
  var sci = entry.scientificName || entry.sn || '—';
  var names = entry.names || {};
  var en = (names.en && names.en.join(', ')) || '—';
  var ta = (names.ta && names.ta.join(', ')) || '';
  var revised = entry.revisedAt || entry.time || '—';
  var status = entry.status || '—';
  var updatedBy = entry.updatedBy || '—';
  var dm = /^(\d{4})(\d{2})(\d{2})T/.exec(revised);
  var label = dm ? dm[3] + '-' + dm[2] + '-' + dm[1] : revised;
  var q=String.fromCharCode(39);
  var delete_btn = is_submitted ? '<button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); deleteSurveyorTreeName('+q+sci.replace(/\'/g,"\\'")+q+')"><i class="ti ti-trash"></i></button>' : '';
  var header_html = is_submitted ? '<div class="surveyor-card-header"><span class="surveyor-card-header-title">Tree name request</span>' + delete_btn + '</div>' : '';
  return '<div class="info-card surveyor-card surveyor-clickable" onclick="openTreeNameEditForm('+q+sci.replace(/\'/g,"\\'")+q+')">' + header_html + '<div class="info-row"><span class="info-key"><i class="ti ti-leaf field-icon-sm"></i>Scientific</span><span class="info-val surveyor-val-strong">' + sci + '</span></div>' +
    '<div class="info-row"><span class="info-key"><i class="ti ti-language field-icon-sm"></i>EN</span><span class="info-val">' + en + '</span></div>' +
    (ta ? '<div class="info-row"><span class="info-key"><i class="ti ti-language field-icon-sm"></i>TA</span><span class="info-val">' + ta + '</span></div>' : '') +
    '<div class="info-row"><span class="info-key"><i class="ti ti-calendar field-icon-sm"></i>Revised</span><span class="info-val">' + label + '</span></div>' +
    '<div class="info-row"><span class="info-key"><i class="ti ti-check field-icon-sm"></i>Status</span><span class="info-val">' + status + '</span></div>' +
    '<div class="info-row"><span class="info-key"><i class="ti ti-user field-icon-sm"></i>By</span><span class="info-val">' + updatedBy + '</span></div></div>';
}
var pending_surveyor_delete_type = '';
var pending_surveyor_delete_key = '';
function deleteSurveyorTreeName(sci_name) {
  var sci = sci_name || '';
  pending_surveyor_delete_type = 'tree';
  pending_surveyor_delete_key = sci;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove tree name request "' + sci + '"? This will remove it from your submitted list.';
  var modal_el = document.getElementById('delete-confirm-modal');
  if (modal_el) modal_el.classList.add('open');
}
function confirmDeleteSurveyorCard() {
  var modal_el = document.getElementById('delete-confirm-modal');
  if (modal_el) modal_el.classList.remove('open');
  var type = pending_surveyor_delete_type;
  var key = pending_surveyor_delete_key;
  pending_surveyor_delete_type = '';
  pending_surveyor_delete_key = '';
  if (type === 'tree') {
    var sci = key;
    var role_cfg = getRoleConfig('surveyor');
    var stats = role_cfg.stats || {};
    var tree_name = stats['tree-name'] || {};
    var submitted_list = tree_name.submitted || [];
    var filtered_list = submitted_list.filter(function (e) { return (e.scientificName || e.sn) !== sci; });
    tree_name.submitted = filtered_list;
    stats['tree-name'] = tree_name;
    role_cfg.stats = stats;
    try { var login_data = window._login || storage.get('login') || {}; login_data['tree-login'] = login_data['tree-login'] || {}; login_data['tree-login']['surveyor'] = role_cfg; storage.set('login', login_data); window._login = login_data; } catch (e) {}
    try { renderSurveyorStats(); } catch (e) {}
    var target_el = document.getElementById('surveyor-tree-name-submitted-cards');
    if (target_el) target_el.innerHTML = filtered_list.length ? filtered_list.map(function (e) { return surveyorTreeNameCardHtml(e, true); }).join('') : '';
    var empty_el = document.getElementById('surveyor-tree-name-submitted-empty');
    if (empty_el) empty_el.style.display = filtered_list.length ? 'none' : 'block';
  } else if (type === 'place') {
    var pin = key;
    var role_cfg2 = getRoleConfig('surveyor');
    var stats2 = role_cfg2.stats || {};
    var place_name = stats2['place-name'] || {};
    var submitted_list2 = place_name.submitted || [];
    var filtered_list2 = submitted_list2.filter(function (e) { return String(e.pinCode || e.pincode) !== String(pin); });
    place_name.submitted = filtered_list2;
    stats2['place-name'] = place_name;
    role_cfg2.stats = stats2;
    try { var login_data2 = window._login || storage.get('login') || {}; login_data2['tree-login'] = login_data2['tree-login'] || {}; login_data2['tree-login']['surveyor'] = role_cfg2; storage.set('login', login_data2); window._login = login_data2; } catch (e) {}
    try { renderSurveyorStats(); } catch (e) {}
    var target_el2 = document.getElementById('surveyor-place-name-submitted-cards');
    if (target_el2) target_el2.innerHTML = filtered_list2.length ? filtered_list2.map(function (e) { return surveyorPlaceNameCardHtml(e, true); }).join('') : '';
    var empty_el2 = document.getElementById('surveyor-place-name-submitted-empty');
    if (empty_el2) empty_el2.style.display = filtered_list2.length ? 'none' : 'block';
  } else if (type === 'survey') {
    var tid = key;
    var role_cfg3 = getRoleConfig('surveyor');
    var stats3 = role_cfg3.stats || {};
    var survey_req = stats3['survey-requests'] || {};
    var submitted_list3 = survey_req.submitted || [];
    var approved_list3 = survey_req.approved || [];
    var filtered_submitted3 = submitted_list3.filter(function (e) { return String(e.treeId || e) !== String(tid); });
    var filtered_approved3 = approved_list3.filter(function (e) { return String(e.treeId || e) !== String(tid); });
    survey_req.submitted = filtered_submitted3;
    survey_req.approved = filtered_approved3;
    stats3['survey-requests'] = survey_req;
    role_cfg3.stats = stats3;
    try { var login_data3 = window._login || storage.get('login') || {}; login_data3['tree-login'] = login_data3['tree-login'] || {}; login_data3['tree-login']['surveyor'] = role_cfg3; storage.set('login', login_data3); window._login = login_data3; } catch (e) {}
    try { renderSurveyorStats(); } catch (e) {}
    var active_el = document.querySelector('.page.active');
    var active_id = active_el ? active_el.id : '';
    var is_approved_page = active_id.indexOf('survey-requests-approved') > -1 ? true : false;
    if (is_approved_page) {
      var mapA = {}; filtered_approved3.forEach(function (e) { if (e.treeId) mapA[e.treeId] = e.loggedAt || ''; });
      var idsA = filtered_approved3.map(function (e) { return e.treeId || e; }).filter(Boolean);
      renderSurveyorLogCards('surveyor-survey-requests-approved-cards', 'surveyor-survey-requests-approved-empty', idsA, mapA);
    } else {
      var map3 = {}; filtered_submitted3.forEach(function (e) { if (e.treeId) map3[e.treeId] = e.loggedAt || ''; });
      var ids3 = filtered_submitted3.map(function (e) { return e.treeId || e; }).filter(Boolean);
      renderSurveyorLogCards('surveyor-survey-requests-submitted-cards', 'surveyor-survey-requests-submitted-empty', ids3, map3);
    }
  } else if (type === 'register') {
    var tid_reg = key;
    var role_cfg4 = getRoleConfig('surveyor');
    var stats4 = role_cfg4.stats || {};
    var reg_log = stats4['register-log'] || {};
    var submitted_list4 = reg_log.submitted || [];
    var filtered_list4 = submitted_list4.filter(function (e) { return String(e.treeId || e) !== String(tid_reg); });
    reg_log.submitted = filtered_list4;
    stats4['register-log'] = reg_log;
    role_cfg4.stats = stats4;
    try { var login_data4 = window._login || storage.get('login') || {}; login_data4['tree-login'] = login_data4['tree-login'] || {}; login_data4['tree-login']['surveyor'] = role_cfg4; storage.set('login', login_data4); window._login = login_data4; } catch (e) {}
    try { renderSurveyorStats(); } catch (e) {}
    var map4 = {}; filtered_list4.forEach(function (e) { if (e.treeId) map4[e.treeId] = e.loggedAt || ''; });
    var ids4 = filtered_list4.map(function (e) { return e.treeId || e; }).filter(Boolean);
    renderSurveyorLogCards('surveyor-register-log-submitted-cards', 'surveyor-register-log-submitted-empty', ids4, map4, true);
  } else if (type === 'mycurrent') {
    var tid_my = key;
    var role_cfg5 = getRoleConfig('surveyor');
    var tiles_my = role_cfg5.tiles && role_cfg5.tiles['my-trees'] || {};
    var current_list = tiles_my.current || [];
    var filtered_current = current_list.filter(function (e) { return String(e.treeId || e) !== String(tid_my); });
    tiles_my.current = filtered_current;
    role_cfg5.tiles = role_cfg5.tiles || {};
    role_cfg5.tiles['my-trees'] = tiles_my;
    try { var login_data5 = window._login || storage.get('login') || {}; login_data5['tree-login'] = login_data5['tree-login'] || {}; login_data5['tree-login']['surveyor'] = role_cfg5; storage.set('login', login_data5); window._login = login_data5; } catch (e) {}
    try { renderSurveyorStats(); } catch (e) {}
    var map5 = {}; filtered_current.forEach(function (e) { if (e.treeId) map5[e.treeId] = e.addedAt || ''; });
    var ids5 = filtered_current.map(function (e) { return e.treeId || e; }).filter(Boolean);
    renderSurveyorMyTreeCards('surveyor-my-current-cards', 'surveyor-my-current-empty', ids5, map5);
  } else if (type === 'log') {
    var tid_log = key;
    var role_cfg6 = getRoleConfig('surveyor');
    var stats6 = role_cfg6.stats || {};
    var log_data = stats6['survey-log'] || {};
    var submitted_list6 = log_data.submitted || [];
    var filtered_list6 = submitted_list6.filter(function (e) { return String(e.treeId || e) !== String(tid_log); });
    log_data.submitted = filtered_list6;
    stats6['survey-log'] = log_data;
    role_cfg6.stats = stats6;
    try { var login_data6 = window._login || storage.get('login') || {}; login_data6['tree-login'] = login_data6['tree-login'] || {}; login_data6['tree-login']['surveyor'] = role_cfg6; storage.set('login', login_data6); window._login = login_data6; } catch (e) {}
    try { renderSurveyorStats(); } catch (e) {}
    var map6 = {}; filtered_list6.forEach(function (e) { if (e.treeId) map6[e.treeId] = e.loggedAt || ''; });
    var ids6 = filtered_list6.map(function (e) { return e.treeId || e; }).filter(Boolean);
    renderSurveyorLogCards('surveyor-logs-submitted-cards', 'surveyor-logs-submitted-empty', ids6, map6);
  }
}
function cancelDeleteSurveyorCard() {
  pending_surveyor_delete_type = '';
  pending_surveyor_delete_key = '';
  var modal_el = document.getElementById('delete-confirm-modal');
  if (modal_el) modal_el.classList.remove('open');
}
function openPlaceNameEditForm(pin) {
  var parent=encodeURIComponent('surveyor.html?hub=surveyor-dash');
  try{ var active=document.querySelector('.page.active'); if(active) parent=encodeURIComponent('surveyor.html?hub='+active.id.replace('page-','')); }catch(e){}
  window.location.href='append-a-place-name.html?parent='+parent+'&editPin='+encodeURIComponent(pin);
}
function surveyorPlaceNameCardHtml(entry, is_submitted) {
  var pin = entry.pinCode || entry.pincode || '—';
  var names = entry.names || entry.placeName || {};
  var en = (Array.isArray(names.en) ? names.en.join(', ') : names.en) || (names.en || '—');
  if (Array.isArray(en)) en = en.join(', ');
  var ta = (Array.isArray(names.ta) ? names.ta.join(', ') : names.ta) || '';
  var revised = entry.revisedAt || entry.time || '—';
  var status = entry.status || '—';
  var updatedBy = entry.updatedBy || '—';
  var dm = /^(\d{4})(\d{2})(\d{2})T/.exec(revised);
  var label = dm ? dm[3] + '-' + dm[2] + '-' + dm[1] : revised;
  var q=String.fromCharCode(39);
  var delete_btn = is_submitted ? '<button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); deleteSurveyorPlaceName('+q+pin.replace(/\'/g,"\\'")+q+')"><i class="ti ti-trash"></i></button>' : '';
  var header_html = is_submitted ? '<div class="surveyor-card-header"><span class="surveyor-card-header-title">Place name request</span>' + delete_btn + '</div>' : '';
  return '<div class="info-card surveyor-card surveyor-clickable" onclick="openPlaceNameEditForm('+q+pin.replace(/\'/g,"\\'")+q+')">' + header_html + '<div class="info-row"><span class="info-key"><i class="ti ti-map-pin field-icon-sm"></i>Pin</span><span class="info-val">' + pin + '</span></div>' +
    '<div class="info-row"><span class="info-key"><i class="ti ti-language field-icon-sm"></i>EN</span><span class="info-val">' + en + '</span></div>' +
    (ta ? '<div class="info-row"><span class="info-key"><i class="ti ti-language field-icon-sm"></i>TA</span><span class="info-val">' + ta + '</span></div>' : '') +
    '<div class="info-row"><span class="info-key"><i class="ti ti-calendar field-icon-sm"></i>Revised</span><span class="info-val">' + label + '</span></div>' +
    '<div class="info-row"><span class="info-key"><i class="ti ti-check field-icon-sm"></i>Status</span><span class="info-val">' + status + '</span></div>' +
    '<div class="info-row"><span class="info-key"><i class="ti ti-user field-icon-sm"></i>By</span><span class="info-val">' + updatedBy + '</span></div></div>';
}
function deleteSurveyorPlaceName(pin_code) {
  var pin = pin_code || '';
  pending_surveyor_delete_type = 'place';
  pending_surveyor_delete_key = pin;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove place name request "' + pin + '"? This will remove it from your submitted list.';
  var modal_el = document.getElementById('delete-confirm-modal');
  if (modal_el) modal_el.classList.add('open');
}
function renderSurveyorSimpleCards(target_id, empty_id, list) {
  var target_el = document.getElementById(target_id);
  var empty_el = document.getElementById(empty_id);
  if (!target_el) return;
  if (!list || !list.length) { target_el.innerHTML = ''; if (empty_el) empty_el.style.display = 'block'; return; }
  if (empty_el) empty_el.style.display = 'none';
  var is_tree = list[0] && (list[0].scientificName || list[0].sn);
  var is_submitted = String(target_id).indexOf('submitted') > -1 ? true : false;
  var html = '';
  for (var i = 0; i < list.length; i++) { html += is_tree ? surveyorTreeNameCardHtml(list[i], is_submitted) : surveyorPlaceNameCardHtml(list[i], is_submitted); }
  target_el.innerHTML = html;
}
function openSurveyorTreeName(status) {
  var stats = getRoleConfig('surveyor').stats || {};
  var tree_name = stats['tree-name'] || {};
  var list = (status === 'submitted') ? (tree_name.submitted || []) : (tree_name.approved || []);
  var target = (status === 'submitted') ? 'surveyor-tree-name-submitted-cards' : 'surveyor-tree-name-approved-cards';
  var empty = (status === 'submitted') ? 'surveyor-tree-name-submitted-empty' : 'surveyor-tree-name-approved-empty';
  var page = (status === 'submitted') ? 'surveyor-tree-name-submitted' : 'surveyor-tree-name-approved';
  renderSurveyorSimpleCards(target, empty, list);
  goTo(page);
}
function openSurveyorPlaceName(status) {
  var stats = getRoleConfig('surveyor').stats || {};
  var place_name = stats['place-name'] || {};
  var list = (status === 'submitted') ? (place_name.submitted || []) : (place_name.approved || []);
  var target = (status === 'submitted') ? 'surveyor-place-name-submitted-cards' : 'surveyor-place-name-approved-cards';
  var empty = (status === 'submitted') ? 'surveyor-place-name-submitted-empty' : 'surveyor-place-name-approved-empty';
  var page = (status === 'submitted') ? 'surveyor-place-name-submitted' : 'surveyor-place-name-approved';
  renderSurveyorSimpleCards(target, empty, list);
  goTo(page);
}
function openSurveyorRegisterLog(status) {
  var stats = getRoleConfig('surveyor').stats || {};
  var reg = stats["register-log"] || {};
  var list = (status === 'submitted') ? (reg.submitted || []) : (reg.approved || []);
  var ids = list.map(function (e) { return e.treeId || e; }).filter(Boolean);
  var map = {}; list.forEach(function (e) { if (e.treeId) map[e.treeId] = e.loggedAt || ''; });
  var target = (status === 'submitted') ? 'surveyor-register-log-submitted-cards' : 'surveyor-register-log-approved-cards';
  var empty = (status === 'submitted') ? 'surveyor-register-log-submitted-empty' : 'surveyor-register-log-approved-empty';
  var hide = (status === 'submitted');
  renderSurveyorLogCards(target, empty, ids, map, hide);
  goTo((status === 'submitted') ? 'surveyor-register-log-submitted' : 'surveyor-register-log-approved');
}
function openSurveyorSurveyRequests(status) {
  var stats = getRoleConfig('surveyor').stats || {};
  var req = stats["survey-requests"] || {};
  var list = (status === 'submitted') ? (req.submitted || []) : (req.approved || []);
  var ids = list.map(function (e) { return e.treeId || e; }).filter(Boolean);
  var map = {}; list.forEach(function (e) { if (e.treeId) map[e.treeId] = e.loggedAt || ''; });
  var target = (status === 'submitted') ? 'surveyor-survey-requests-submitted-cards' : 'surveyor-survey-requests-approved-cards';
  var empty = (status === 'submitted') ? 'surveyor-survey-requests-submitted-empty' : 'surveyor-survey-requests-approved-empty';
  renderSurveyorLogCards(target, empty, ids, map);
  goTo((status === 'submitted') ? 'surveyor-survey-requests-submitted' : 'surveyor-survey-requests-approved');
}
function openThisMonthTree(status) {
  var is_covered = status === 'covered' ? true : false;
  var target = is_covered ? 'this-month-covered-cards' : 'this-month-waiting-cards';
  var empty = is_covered ? 'this-month-covered-empty' : 'this-month-waiting-empty';
  var page = is_covered ? 'this-month-covered' : 'this-month-waiting';
  if (is_covered) {
    var role_cfg = getRoleConfig('surveyor');
    var stats = role_cfg.stats || {};
    var c = (typeof countRoleLogs === 'function') ? countRoleLogs('surveyor') : { total: null, month: null, covered: null };
    var month = stats.month || {};
    var month_trees = month.trees;
    var ids = [];
    var map = {};
    try {
      var now = new Date();
      var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      var role_ids = (typeof roleTreeIds === 'function') ? roleTreeIds('surveyor') : [];
      var month_set = {};
      for (var i = 0; i < role_ids.length; i++) {
        var t = storage.pullTreeDetail(role_ids[i]);
        if (!t || !t['encounters-list']) continue;
        var keys = Object.keys(t['encounters-list']);
        for (var k = 0; k < keys.length; k++) {
          var e = t['encounters-list'][keys[k]];
          var d = e.updatedDate || e.registeredDate || '';
          if (String(d).slice(0, 7) === ym) { month_set[role_ids[i]] = true; break; }
        }
      }
      ids = Object.keys(month_set);
      if (!ids.length && month_trees != null && Array.isArray(month_trees)) ids = month_trees;
      else if (!ids.length && c.covered) ids = [];
    } catch (e) {}
    if (!ids.length) {
      var data = window.__TREE_DATA || storage.get('treeCards') || [];
      var tiles_my = role_cfg.tiles && role_cfg.tiles['my-trees'] || {};
      var cur_ids = (tiles_my.current || []).map(function (e) { return e.treeId || e; });
      ids = cur_ids.slice(0, 5);
    }
    renderSurveyorMyTreeCards(target, empty, ids, map);
  } else {
    var role_cfg2 = getRoleConfig('surveyor');
    var tiles_my2 = role_cfg2.tiles && role_cfg2.tiles['my-trees'] || {};
    var waiting_list_raw = tiles_my2.waiting || role_cfg2.stats && role_cfg2.stats.waiting || [];
    var now2 = new Date();
    var ym2 = now2.getFullYear() + '-' + String(now2.getMonth() + 1).padStart(2, '0');
    function getYm2(ts){ var s=String(ts||''); return s.indexOf('-')>-1 ? s.slice(0,7) : s.slice(0,4)+'-'+s.slice(4,6); }
    var waiting_list = waiting_list_raw.filter(function (e) { return getYm2(e.addedAt||'') === ym2; });
    if (!waiting_list.length) waiting_list = waiting_list_raw.slice(0,5);
    var ids2 = waiting_list.map(function (e) { return e.treeId || e; }).filter(Boolean);
    var map2 = {};
    waiting_list.forEach(function (e) { if (e.treeId) map2[e.treeId] = e.addedAt || ''; });
    if (!ids2.length) {
      var s_waiting = sessionStorage.getItem('surveyorSurveyWaiting');
      try { var arr = JSON.parse(s_waiting || '[]'); if (Array.isArray(arr)) ids2 = arr.slice(); } catch (e) {}
    }
    renderSurveyorMyTreeCards(target, empty, ids2, map2);
  }
  goTo(page);
}
function openThisMonthSurveyLog(status) {
  var is_approved = status === 'approved' ? true : false;
  var stats = getRoleConfig('surveyor').stats || {};
  var logs = stats["survey-log"] || {};
  var now = new Date();
  var ym = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  function getYm(ts){ var s=String(ts||''); return s.indexOf('-')>-1 ? s.slice(0,7) : s.slice(0,4)+'-'+s.slice(4,6); }
  var list = is_approved ? (logs.approved || []) : (logs.submitted || []);
  var filtered = list.filter(function (e) { return getYm(e.loggedAt) === ym; });
  if (!filtered.length && list.length) filtered = list.slice(0, 5);
  var ids = filtered.map(function (e) { return e.treeId || e; }).filter(Boolean);
  var map = {}; filtered.forEach(function (e) { if (e.treeId) map[e.treeId] = e.loggedAt || ''; });
  var target = is_approved ? 'this-month-log-approved-cards' : 'this-month-log-submitted-cards';
  var empty = is_approved ? 'this-month-log-approved-empty' : 'this-month-log-submitted-empty';
  var page = is_approved ? 'this-month-log-approved' : 'this-month-log-submitted';
  renderSurveyorLogCards(target, empty, ids, map);
  goTo(page);
}

function getSurveyorLang() {
  if (typeof appLang !== 'undefined' && appLang) return appLang;
  if (typeof filterLang !== 'undefined' && filterLang) return filterLang;
  try { return sessionStorage.getItem('nm-app-lang') || 'en'; } catch (e) { return 'en'; }
}
function surveyorCardName(t) {
  if (!t) return '';
  if (typeof storage !== 'undefined' && storage.treeNameIn) { try { var lang_tmp = getSurveyorLang(); var res_tmp = storage.treeNameIn(t, lang_tmp); if (res_tmp) return res_tmp; } catch (e) {} }
  if (t.speciesName) {
    if (typeof t.speciesName === 'string') return t.speciesName;
    var lang = getSurveyorLang();
    if (t.speciesName[lang]) return t.speciesName[lang];
    return t.speciesName.en || t.speciesName.ta || Object.values(t.speciesName)[0] || '';
  }
  return t.englishName || t.name || '';
}

function surveyorCardAddr(t) {
  if (!t || !t.address) return '';
  var lang = getSurveyorLang();
  var addr = t.address;
  if (typeof addr === 'string') return addr;
  return addr[lang] || addr.en || addr.ta || Object.values(addr)[0] || '';
}

function surveyorLogCardHtml(t, loggedAt, hideLogBox, target_id) {
  var q = String.fromCharCode(39);
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var name_txt = surveyorCardName(t) || '';
  var addr_txt = surveyorCardAddr(t) || c.addr || '';
  var logs_display = keys.length || c.logs || 0;
  var at = loggedAt || '';
  var log_box = hideLogBox ? '' : '<div class="s-metric-row"><div class="s-metric-col"><span class="s-metric-label">Logs</span><div class="s-metric-val-row"><span>' + logs_display + '</span></div></div></div>';
  var target_str = String(target_id || '');
  var is_survey_requests = target_str.indexOf('survey-requests') > -1 ? true : false;
  var is_register_log = target_str.indexOf('register-log') > -1 ? true : false;
  var is_survey_log = target_str.indexOf('surveyor-logs') > -1 ? true : false;
  var is_submitted = is_survey_requests ? true : target_str.indexOf('submitted') > -1 ? true : false;
  var delete_fn = is_survey_requests ? 'deleteSurveyorSurveyRequest' : is_register_log ? 'deleteSurveyorRegisterRequest' : is_survey_log ? 'deleteSurveyorLogRequest' : '';
  var header_title = is_survey_requests ? 'Survey request' : is_register_log ? 'Register request' : is_survey_log ? 'Survey log' : 'Survey log';
  var delete_btn = (is_submitted && delete_fn) ? '<button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); ' + delete_fn + '(' + q + t.treeId + q + ')"><i class="ti ti-trash"></i></button>' : '';
  var header_html = (is_submitted && delete_fn) ? '<div class="surveyor-card-header"><span class="surveyor-card-header-title">' + header_title + '</span>' + delete_btn + '</div>' : '';
  return '<div class="sponsor-tree-card" onclick="openSurveyorReviewPage(' + q + t.treeId + q + ',' + q + at + q + ')">' + header_html +
    '<div class="tree-card-hero" style="background:' + (t.bg || c.bg || '#234712') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (t.emoji || c.emoji || '🌴') + ' ' + name_txt + ' <span class="tcard-id">' + t.treeId + '</span></h3><p><span class="addr-text">' + addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Health</div><div class="tcs-val">' + (st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (st.height || c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (st.diameter || c.diameter || '—') + '</div></div></div></div>' +
    log_box +
    '</div>';
}
var pending_surveyor_survey_key = '';
function deleteSurveyorSurveyRequest(tree_id) {
  var tid = tree_id || '';
  pending_surveyor_delete_type = 'survey';
  pending_surveyor_delete_key = tid;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove survey request "' + tid + '"? This will remove it from your submitted list.';
  var modal_el = document.getElementById('delete-confirm-modal');
  if (modal_el) modal_el.classList.add('open');
}
function deleteSurveyorRegisterRequest(tree_id) {
  var tid = tree_id || '';
  pending_surveyor_delete_type = 'register';
  pending_surveyor_delete_key = tid;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove register request "' + tid + '"? This will remove it from your submitted list.';
  var modal_el = document.getElementById('delete-confirm-modal');
  if (modal_el) modal_el.classList.add('open');
}
function deleteSurveyorMyCurrent(tree_id) {
  var tid = tree_id || '';
  pending_surveyor_delete_type = 'mycurrent';
  pending_surveyor_delete_key = tid;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove tree "' + tid + '" from My Trees Current?';
  var modal_el = document.getElementById('delete-confirm-modal');
  if (modal_el) modal_el.classList.add('open');
}
function deleteSurveyorLogRequest(tree_id) {
  var tid = tree_id || '';
  pending_surveyor_delete_type = 'log';
  pending_surveyor_delete_key = tid;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove survey log "' + tid + '"? This will remove it from your submitted logs.';
  var modal_el = document.getElementById('delete-confirm-modal');
  if (modal_el) modal_el.classList.add('open');
}

function openSurveyorReviewPage(treeId, loggedAt) {
  var parent = encodeURIComponent('surveyor.html?hub=surveyor-dash');
  try { var active = document.querySelector('.page.active'); if (active) parent = encodeURIComponent('surveyor.html?hub=' + active.id.replace('page-','')); } catch (e) {}
  window.location.href = 'review-logs.html?treeId=' + encodeURIComponent(treeId) + '&loggedAt=' + encodeURIComponent(loggedAt || '') + '&parent=' + parent;
}

function renderSurveyorLogCards(target_id, empty_id, id_list, loggedAtMap, hideLogBox) {
  var target_el = document.getElementById(target_id);
  var empty_el = document.getElementById(empty_id);
  if (!target_el) { return; }
  if (!id_list.length) {
    target_el.innerHTML = '';
    if (empty_el) empty_el.style.display = 'block';
    return;
  }
  if (empty_el) empty_el.style.display = 'none';
  var data = window.__TREE_DATA || storage.get('treeCards') || [];
  var filtered = data.filter(function (t) { return id_list.indexOf(t.treeId) > -1; });
  filtered.sort(function (a, b) { return id_list.indexOf(a.treeId) - id_list.indexOf(b.treeId); });
  target_el.innerHTML = filtered.map(function (t) { var at = (loggedAtMap && loggedAtMap[t.treeId]) || ''; return surveyorLogCardHtml(t, at, hideLogBox, target_id); }).join('');
  if (!filtered.length) { target_el.innerHTML = ''; if (empty_el) empty_el.style.display = 'block'; }
}

function surveyorBaseData(t) {
  var q = String.fromCharCode(39);
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  return { q:q, c:c, enc:enc, keys:keys, last:last, st:st, name_txt:surveyorCardName(t)||'', addr_txt:surveyorCardAddr(t)||c.addr||'', logs_display:keys.length||c.logs||0 };
}
function surveyorMyTreeCardHtml(t, is_current, hide_actions) {
  var d = surveyorBaseData(t);
  var added_label = t.addedAt ? (function(){ var m=/^(\d{4})(\d{2})(\d{2})T/.exec(t.addedAt); return m ? m[3]+'-'+m[2]+'-'+m[1] : t.addedAt; })() : '';
  var delete_btn = is_current ? '<button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); deleteSurveyorMyCurrent(' + d.q + t.treeId + d.q + ')"><i class="ti ti-trash"></i></button>' : '';
  var top_row = added_label ? '<div class="tcard-added-at" style="padding:8px 11px;font-size:0.6667rem;color:var(--color-text-secondary);display:flex;align-items:center;justify-content:space-between;gap:4px;"><span style="display:flex;align-items:center;gap:4px;"><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + added_label + '</span>' + delete_btn + '</div>' : (is_current ? '<div class="tcard-added-at" style="padding:8px 11px;font-size:0.6667rem;color:var(--color-text-secondary);display:flex;align-items:center;justify-content:space-between;gap:4px;"><span></span>' + delete_btn + '</div>' : '');
  return '<div class="sponsor-tree-card surveyor-my-card" onclick="openProfile(' + d.q + t.treeId + d.q + ')">' +
    top_row +
    '<div class="tree-card-hero" style="background:' + (t.bg || d.c.bg || '#234712') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (t.emoji || d.c.emoji || '🌴') + ' ' + d.name_txt + ' <span class="tcard-id">' + t.treeId + '</span></h3><p><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Health</div><div class="tcs-val">' + (d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' +
    '<div class="tree-card-btns"><button class="tcbtn tcbtn-logs" onclick="event.stopPropagation();openSurveyorReviewPage(' + d.q + t.treeId + d.q + ',' + d.q + d.q + ')" style="width:100%"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button></div>' +
    '</div>';
}
function surveyorCurrentCardHtml(t){ var h=surveyorMyTreeCardHtml(t,true,false); return h.replace('surveyor-my-card','surveyor-current-card'); }
function surveyorPastCardHtml(t){ var h=surveyorMyTreeCardHtml(t,false,false); return h.replace('surveyor-my-card','surveyor-past-card'); }
function surveyorLogCardWrapper(t,at,hide,cls){ var h=surveyorLogCardHtml(t,at,hide,cls); var map={ 'surveyor-logs-approved':'surveyor-log-approved-card', 'surveyor-logs-submitted':'surveyor-log-submitted-card', 'surveyor-register-log-approved':'surveyor-register-approved-card', 'surveyor-register-log-submitted':'surveyor-register-submitted-card', 'surveyor-survey-requests-approved':'surveyor-survey-approved-card', 'surveyor-survey-requests-submitted':'surveyor-survey-submitted-card' }; var c='surveyor-log-card'; for(var k in map) if(String(cls).indexOf(k)>-1) c=map[k]; return h.replace('sponsor-tree-card','sponsor-tree-card '+c); }
function surveyorTreeNameCardWrapper(e,sub){ var h=surveyorTreeNameCardHtml(e,sub); return h.replace('surveyor-card','surveyor-card '+(sub?'surveyor-tree-submitted-card':'surveyor-tree-approved-card')); }
function surveyorPlaceNameCardWrapper(e,sub){ var h=surveyorPlaceNameCardHtml(e,sub); return h.replace('surveyor-card','surveyor-card '+(sub?'surveyor-place-submitted-card':'surveyor-place-approved-card')); }
function surveyorSurveyTree(treeId) {
  var login_data = storage.get('login') || window._login || {};
  var role = (login_data['tree-login'] && login_data['tree-login']['surveyor']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['surveyor']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var active_el = document.querySelector('.page.active');
  var current_hub = active_el ? active_el.id.replace('page-','') : 'surveyor-dash';
  var parent = encodeURIComponent('surveyor.html?hub=' + current_hub);
  var userid = role.userId || '';
  window.location.href = 'survey-a-tree.html?parent=' + parent + '&userid=' + encodeURIComponent(userid) + '&treeid=' + encodeURIComponent(treeId);
}
function renderSurveyorMyTreeCards(target_id, empty_id, id_list, addedAtMap) {
  var target_el = document.getElementById(target_id);
  var empty_el = document.getElementById(empty_id);
  if (!target_el) return;
  if (!id_list.length) { target_el.innerHTML = ''; if (empty_el) empty_el.style.display = 'block'; return; }
  if (empty_el) empty_el.style.display = 'none';
  var data = window.__TREE_DATA || storage.get('treeCards') || [];
  var filtered = data.filter(function (t) { return id_list.indexOf(t.treeId) > -1; });
  filtered.sort(function (a, b) { return id_list.indexOf(a.treeId) - id_list.indexOf(b.treeId); });
  filtered.forEach(function(t){ if (addedAtMap && addedAtMap[t.treeId]) t.addedAt = addedAtMap[t.treeId]; });
  var is_current = String(target_id).indexOf('current') > -1 ? true : false;
  var hide_actions = String(target_id).indexOf('this-month') > -1 ? true : false;
  var fn = String(target_id).indexOf('current')>-1 ? surveyorCurrentCardHtml : surveyorPastCardHtml;
  if(String(target_id).indexOf('this-month')>-1) fn = function(t){ return surveyorMyTreeCardHtml(t,false,true).replace('surveyor-my-card','surveyor-month-card'); };
  target_el.innerHTML = filtered.map(function (t) { return fn(t); }).join('');
  if (!filtered.length) { target_el.innerHTML = ''; if (empty_el) empty_el.style.display = 'block'; }
}
function openSurveyorMyCurrent() {
  var role_cfg = getRoleConfig('surveyor');
  var tiles_my = role_cfg.tiles && role_cfg.tiles['my-trees'] || {};
  var stats_my = role_cfg.stats && role_cfg.stats['my-trees'] || {};
  var current_list = Array.isArray(tiles_my.current) ? tiles_my.current.slice() : (Array.isArray(stats_my.current) ? stats_my.current.slice() : []);
  current_list.sort(function(a,b){ var A=(a.addedAt||a.treeId||a).toString(); var B=(b.addedAt||b.treeId||b).toString(); return B.localeCompare(A); });
  var current_ids = current_list.map(function (e) { return e.treeId || e; }).filter(Boolean);
  var map = {}; current_list.forEach(function(e){ if(e && e.treeId) map[e.treeId]=e.addedAt||''; });
  renderSurveyorMyTreeCards('surveyor-my-current-cards', 'surveyor-my-current-empty', current_ids, map);
  goTo('surveyor-my-current');
}

function openSurveyorMyPast() {
  var role_cfg = getRoleConfig('surveyor');
  var tiles_my = role_cfg.tiles && role_cfg.tiles['my-trees'] || {};
  var stats_my = role_cfg.stats && role_cfg.stats['my-trees'] || {};
  var past_list = Array.isArray(tiles_my.past) ? tiles_my.past.slice() : (Array.isArray(stats_my.past) ? stats_my.past.slice() : []);
  past_list.sort(function(a,b){ var A=(a.addedAt||a.treeId||a).toString(); var B=(b.addedAt||b.treeId||b).toString(); return B.localeCompare(A); });
  var past_ids = past_list.map(function (e) { return e.treeId || e; }).filter(Boolean);
  var map = {}; past_list.forEach(function(e){ if(e && e.treeId) map[e.treeId]=e.addedAt||''; });
  renderSurveyorMyTreeCards('surveyor-my-past-cards', 'surveyor-my-past-empty', past_ids, map);
  goTo('surveyor-my-past');
}
var sortDirCurrent = { time: -1, treeId: 1 };
var sortDirPast = { time: -1, treeId: 1 };
function sortSurveyorMyCurrent(by) {
  var dir = sortDirCurrent[by] || 1;
  sortDirCurrent[by] = -dir;
  var role_cfg = getRoleConfig('surveyor');
  var tiles_my = role_cfg.tiles && role_cfg.tiles['my-trees'] || {};
  var stats_my = role_cfg.stats && role_cfg.stats['my-trees'] || {};
  var list = Array.isArray(tiles_my.current) ? tiles_my.current.slice() : (Array.isArray(stats_my.current) ? stats_my.current.slice() : []);
  list.sort(function(a,b){ var A=(by==='treeId'?(a.treeId||a):(a.addedAt||a.treeId||a)).toString(); var B=(by==='treeId'?(b.treeId||b):(b.addedAt||b.treeId||b)).toString(); return dir * A.localeCompare(B); });
  var ids = list.map(function(e){ return e.treeId||e; }).filter(Boolean);
  renderSurveyorMyTreeCards('surveyor-my-current-cards', 'surveyor-my-current-empty', ids);
}
function sortSurveyorMyPast(by) {
  var dir = sortDirPast[by] || 1;
  sortDirPast[by] = -dir;
  var role_cfg = getRoleConfig('surveyor');
  var tiles_my = role_cfg.tiles && role_cfg.tiles['my-trees'] || {};
  var stats_my = role_cfg.stats && role_cfg.stats['my-trees'] || {};
  var list = Array.isArray(tiles_my.past) ? tiles_my.past.slice() : (Array.isArray(stats_my.past) ? stats_my.past.slice() : []);
  list.sort(function(a,b){ var A=(by==='treeId'?(a.treeId||a):(a.addedAt||a.treeId||a)).toString(); var B=(by==='treeId'?(b.treeId||b):(b.addedAt||b.treeId||b)).toString(); return dir * A.localeCompare(B); });
  var ids = list.map(function(e){ return e.treeId||e; }).filter(Boolean);
  renderSurveyorMyTreeCards('surveyor-my-past-cards', 'surveyor-my-past-empty', ids);
}

function renderRoleCards(target, role, cfg) {
  var el = document.getElementById(target);
  if (!el) { return; }
  var data = window.__TREE_DATA || [];
  var list = data.filter(function (t) { return t.roles && t.roles.indexOf(role) > -1; });
  el.innerHTML = list.map(function (t) { return treeCardHtml(t, cfg); }).join('');
}

function loadDashboard() {
  var ram_data = storage.get('treeCards') || window.__TREE_DATA || [];
  window.__TREE_DATA = ram_data;
  albumData = Array.isArray(ram_data) ? ram_data : (ram_data.albumData || []);
  try {
    var login_data = storage.get('login') || window._login || {};
    if (login_data && login_data['tree-login']) { window._login = login_data; }
  } catch (e) {}
  applyFilters();
  renderRoleCards('page-trees-cards', 'surveyor', { verb: 'logged', showLatest: false, showTodo: false, btn2: 'profile', addrMode: 'short' });
  try { checkNewSurveyorTrees(); } catch (e) {}
  renderSurveyorStats();
  renderRecentEntries('recent-entries', 'surveyor', 'openProfile');
  try {
    var role_cfg = getRoleConfig('surveyor');
    var tiles_my = role_cfg.tiles && role_cfg.tiles['my-trees'] || {};
    var cur_list = (tiles_my.current || []).slice(); cur_list.sort(function(a,b){ var A=(a.addedAt||a.treeId||a).toString(); var B=(b.addedAt||b.treeId||b).toString(); return B.localeCompare(A); });
    var past_list = (tiles_my.past || []).slice(); past_list.sort(function(a,b){ var A=(a.addedAt||a.treeId||a).toString(); var B=(b.addedAt||b.treeId||b).toString(); return B.localeCompare(A); });
    var current_ids = cur_list.map(function (e) { return e.treeId || e; }).filter(Boolean);
    var past_ids = past_list.map(function (e) { return e.treeId || e; }).filter(Boolean);
    var curMap = {}; cur_list.forEach(function(e){ if(e && e.treeId) curMap[e.treeId]=e.addedAt||''; });
    var pastMap = {}; past_list.forEach(function(e){ if(e && e.treeId) pastMap[e.treeId]=e.addedAt||''; });
    renderSurveyorMyTreeCards('surveyor-my-current-cards', 'surveyor-my-current-empty', current_ids, curMap);
    renderSurveyorMyTreeCards('surveyor-my-past-cards', 'surveyor-my-past-empty', past_ids, pastMap);
    var logs = role_cfg.stats && (role_cfg.stats["survey-log"] || role_cfg.stats.logs) || {};
    var approved_list = logs.approved || [];
    var submitted_list = logs.submitted || [];
    var approved_ids = approved_list.map(function (e) { return e.treeId || e; }).filter(Boolean);
    var submitted_ids = submitted_list.map(function (e) { return e.treeId || e; }).filter(Boolean);
    var mapA = {}; approved_list.forEach(function (e) { if (e.treeId) mapA[e.treeId] = e.loggedAt || ''; });
    var mapS = {}; submitted_list.forEach(function (e) { if (e.treeId) mapS[e.treeId] = e.loggedAt || ''; });
    renderSurveyorLogCards('surveyor-logs-approved-cards', 'surveyor-logs-approved-empty', approved_ids, mapA);
    renderSurveyorLogCards('surveyor-logs-submitted-cards', 'surveyor-logs-submitted-empty', submitted_ids, mapS);
  } catch (e) {}
  return { ram_data: ram_data };
}

window.render = {
  init: function () {
    return loadDashboard();
  }
};

var hubMode = new URLSearchParams(location.search).get('hub');
if (hubMode === 'login') { goTo('surveyor-login'); }
else if (hubMode === 'register') { goTo('surveyor-enroll'); }
else if (hubMode === 'surveyor-dash') { goTo('surveyor-dash'); }
else if (hubMode === 'surveyor-logs-approved') {
  setTimeout(function() {
    if (typeof openSurveyorLogsApproved === 'function') { openSurveyorLogsApproved(); }
    else { goTo('surveyor-logs-approved'); }
  }, 50);
}
else if (hubMode === 'surveyor-logs-submitted') {
  setTimeout(function() {
    if (typeof openSurveyorLogsSubmitted === 'function') { openSurveyorLogsSubmitted(); }
    else { goTo('surveyor-logs-submitted'); }
  }, 50);
}
else if (hubMode === 'surveyor-my-current') {
  setTimeout(function() {
    if (typeof openSurveyorMyCurrent === 'function') { openSurveyorMyCurrent(); }
    else { goTo('surveyor-my-current'); }
  }, 50);
}
else if (hubMode === 'surveyor-my-past') {
  setTimeout(function() {
    if (typeof openSurveyorMyPast === 'function') { openSurveyorMyPast(); }
    else { goTo('surveyor-my-past'); }
  }, 50);
}
else if (hubMode === 'surveyor-register-log-approved') {
  setTimeout(function() {
    if (typeof openSurveyorRegisterLog === 'function') { openSurveyorRegisterLog('approved'); }
    else { goTo('surveyor-register-log-approved'); }
  }, 50);
}
else if (hubMode === 'surveyor-register-log-submitted') {
  setTimeout(function() {
    if (typeof openSurveyorRegisterLog === 'function') { openSurveyorRegisterLog('submitted'); }
    else { goTo('surveyor-register-log-submitted'); }
  }, 50);
}
else if (hubMode === 'surveyor-tree-name-approved') {
  setTimeout(function() {
    if (typeof openSurveyorTreeName === 'function') { openSurveyorTreeName('approved'); }
    else { goTo('surveyor-tree-name-approved'); }
  }, 50);
}
else if (hubMode === 'surveyor-tree-name-submitted') {
  setTimeout(function() {
    if (typeof openSurveyorTreeName === 'function') { openSurveyorTreeName('submitted'); }
    else { goTo('surveyor-tree-name-submitted'); }
  }, 50);
}
else if (hubMode === 'surveyor-place-name-approved') {
  setTimeout(function() {
    if (typeof openSurveyorPlaceName === 'function') { openSurveyorPlaceName('approved'); }
    else { goTo('surveyor-place-name-approved'); }
  }, 50);
}
else if (hubMode === 'surveyor-place-name-submitted') {
  setTimeout(function() {
    if (typeof openSurveyorPlaceName === 'function') { openSurveyorPlaceName('submitted'); }
    else { goTo('surveyor-place-name-submitted'); }
  }, 50);
}
else if (hubMode === 'surveyor-survey-requests-approved') {
  setTimeout(function() {
    if (typeof openSurveyorSurveyRequests === 'function') { openSurveyorSurveyRequests('approved'); }
    else { goTo('surveyor-survey-requests-approved'); }
  }, 50);
}
else if (hubMode === 'surveyor-survey-requests-submitted') {
  setTimeout(function() {
    if (typeof openSurveyorSurveyRequests === 'function') { openSurveyorSurveyRequests('submitted'); }
    else { goTo('surveyor-survey-requests-submitted'); }
  }, 50);
}
else if (hubMode === 'this-month-covered') {
  setTimeout(function() {
    if (typeof openThisMonthTree === 'function') { openThisMonthTree('covered'); }
    else { goTo('this-month-covered'); }
  }, 50);
}
else if (hubMode === 'this-month-waiting') {
  setTimeout(function() {
    if (typeof openThisMonthTree === 'function') { openThisMonthTree('waiting'); }
    else { goTo('this-month-waiting'); }
  }, 50);
}
else if (hubMode === 'this-month-log-approved') {
  setTimeout(function() {
    if (typeof openThisMonthSurveyLog === 'function') { openThisMonthSurveyLog('approved'); }
    else { goTo('this-month-log-approved'); }
  }, 50);
}
else if (hubMode === 'this-month-log-submitted') {
  setTimeout(function() {
    if (typeof openThisMonthSurveyLog === 'function') { openThisMonthSurveyLog('submitted'); }
    else { goTo('this-month-log-submitted'); }
  }, 50);
}
else if (hubMode === 'trees') { goTo('trees'); }
else { window.location.href = 'login-hub.html'; }

