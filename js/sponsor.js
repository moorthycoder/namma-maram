
var TESTING_MODE = true;
var profileFrom = 'sponsor-login';
var treeLogsFrom = 'sponsor-dash';
var payLogsFrom = 'sponsor-dash';
var sponsoredCount = 0;
var payTreeId = '';
var payMonthFilter = '';

function sponsorCardName(t) {
  if (!t) return '';
  var n = (t.speciesName) || {};
  var lang = getAppLang();
  return n[lang] || n.en || n.ta || '';
}
function sponsorCardAddr(t) {
  if (!t) return '';
  var lang = getAppLang();
  var a = (t.address) || {};
  if (typeof a === 'string') return a;
  return a[lang] || a.en || a.ta || '';
}

// LOGIN BLOCK
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

function checkNewSponserTrees() {
  var sponsor_waiting_str = sessionStorage.getItem('sponsorWaiting');
  if (sponsor_waiting_str === null) return [];
  var new_ids = [];
  try { var arr = JSON.parse(sponsor_waiting_str); if (Array.isArray(arr)) new_ids = arr.filter(function(e){ return typeof e === 'string' && e; }); } catch (e) { new_ids = []; }
  if (!new_ids.length) return [];
  var ram_data = storage.get('treeCards') || window.__TREE_DATA || [];
  var pending_trees = [];
  for (var i = 0; i < new_ids.length; i++) { var id = new_ids[i]; for (var r = 0; r < ram_data.length; r++) { if (ram_data[r].treeId === id) { pending_trees.push(ram_data[r]); break; } } }
  if (pending_trees.length) openSponsorSeeingModal(pending_trees);
  return new_ids;
}

function getSponsorNextDue(ram_data, current_ids) {
  var due_list = current_ids.map(function(sid){ for(var i=0;i<ram_data.length;i++){ if(ram_data[i].treeId===sid && ram_data[i]['encounter-due-date']) return {treeId: sid, due: ram_data[i]['encounter-due-date']}; } return null; }).filter(Boolean).sort(function(a,b){ return a.due.localeCompare(b.due); });
  return due_list.length ? due_list[0] : null;
}

function loadDashboard() {
  var ram_data = storage.get('treeCards') || window.__TREE_DATA || [];
  console.log('[sponsor] loadDashboard RAM', ram_data.length, 'login', (storage.get('login')||{}));
  window.__TREE_DATA = ram_data;
  albumData = Array.isArray(ram_data) ? ram_data : (ram_data.albumData || []);
  var login_data = storage.get('login') || window._login || {};
  var sponsor_cards = ((login_data['tree-login'] && login_data['tree-login']['sponsor']) || {}).cards || {};
  function normalizeIds(list) { return (list || []).map(function(e){ return typeof e === 'string' ? e : e.treeId; }).filter(Boolean); }
  var waiting_submitted_ids = normalizeIds(sponsor_cards.waiting);
  var current_ids = normalizeIds(sponsor_cards.current);
  var past_ids = normalizeIds(sponsor_cards.past);
  renderSponsorCards();
  sponsoredCount = current_ids.length + past_ids.length;
  setStatById('s-sponsor-waiting-submitted', waiting_submitted_ids.length);
  setStatById('s-tree-current', current_ids.length);
  setStatById('s-tree-past', past_ids.length);
  if (!ram_data.length) console.warn('[sponsor] loadDashboard: RAM empty');
  var new_sponsor_ids = checkNewSponserTrees();
  setStatById('s-sponsor-seeing', new_sponsor_ids.length);
  if (new_sponsor_ids.length) console.log('[sponsor] checkNewSponserTrees', new_sponsor_ids);
  var next_due = getSponsorNextDue(ram_data, current_ids);
  var next_due_label = '—';
  window._sponsorNextDueId = '';
  if (next_due) {
    var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(next_due.due);
    var month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    next_due_label = dm ? parseInt(dm[3],10) + ' ' + month_names[parseInt(dm[2],10)-1] : next_due.due;
    window._sponsorNextDueId = next_due.treeId;
  }
  setStatById('s-next-due', next_due_label);
  return { ram_data: ram_data, waiting_submitted_ids: waiting_submitted_ids, current_ids: current_ids, past_ids: past_ids, new_sponsor_ids: new_sponsor_ids };
}

function openSponsorNextDue() {
  var tid = window._sponsorNextDueId || '';
  var ram = storage.get('treeCards') || window.__TREE_DATA || [];
  if (!tid) {
    try {
      var lg2 = storage.get('login') || window._login || {};
      var cur2 = ((lg2['tree-login'] && lg2['tree-login']['sponsor']) || {}).cards || {};
      var curIds2 = (cur2.current || []).map(function(e){ return typeof e==='string'?e:e.treeId; }).filter(Boolean);
      var next2 = getSponsorNextDue(ram, curIds2);
      if (next2) tid = next2.treeId;
    } catch(e) {}
  }
  var cardEl = document.getElementById('sponsor-next-due-card');
  var emptyEl = document.getElementById('sponsor-next-due-empty');
  if (!tid) {
    if (cardEl) cardEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    goTo('sponsor-next-due');
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  var tree = null;
  for (var i = 0; i < ram.length; i++) { if (ram[i].treeId === tid) { tree = ram[i]; break; } }
  if (!tree) {
    if (cardEl) cardEl.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    goTo('sponsor-next-due');
    return;
  }
  var login_data = storage.get('login') || window._login || {};
  var sponsor_cards = ((login_data['tree-login'] && login_data['tree-login']['sponsor']) || {}).cards || {};
  var sorted_current = getSortedWaitingList(sponsor_cards.current || [], 'desc');
  var current_map = {};
  sorted_current.forEach(function(e){ if(e && e.treeId) current_map[e.treeId] = e.addedAt; });
  var c = {}; for (var k in tree) c[k] = tree[k];
  c.addedAt = current_map[tid] || '';
  if (cardEl) cardEl.innerHTML = sponsorTreeCardHtml(c);
  goTo('sponsor-next-due');
}

function loadListForDashBoardBtns(btn_name) {
  var login_data = storage.get('login') || window._login || {};
  var sponsor_cards = ((login_data['tree-login'] && login_data['tree-login']['sponsor']) || {}).cards || {};
  var snake_case = String(btn_name || '').toLowerCase();
  var key = snake_case.indexOf('waiting') > -1 ? 'waiting' : snake_case.indexOf('current') > -1 ? 'current' : snake_case.indexOf('past') > -1 ? 'past' : '';
  if (!key) return [];
  var raw_list = sponsor_cards[key] || [];
  var sorted_list = getSortedWaitingList(raw_list, 'desc');
  var ids = sorted_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var added_map = {}; sorted_list.forEach(function(e){ if (e && e.treeId) added_map[e.treeId] = e.addedAt; });
  var ram_data = storage.get('treeCards') || window.__TREE_DATA || [];
  var tree_list = ids.map(function(id){
    for (var i = 0; i < ram_data.length; i++) { if (ram_data[i].treeId === id) { var c = {}; for (var k in ram_data[i]) c[k] = ram_data[i][k]; c.addedAt = added_map[id]; c.isPast = (key === 'past'); c.isSubmitted = (key === 'waiting'); return c; }
    } return null;
  }).filter(Boolean);
  var html = tree_list.map(sponsorTreeCardHtml).join('');
  var target_map = { waiting: 'sponsor-waiting-submitted-cards', current: 'sponsor-current-cards', past: 'sponsor-past-cards' };
  var empty_map = { waiting: 'sponsor-waiting-submitted-empty' };
  var el = document.getElementById(target_map[key]);
  if (el) el.innerHTML = html;
  var empty_el = document.getElementById(empty_map[key]);
  if (empty_el) empty_el.style.display = tree_list.length ? 'none' : 'block';
  if (key === 'waiting') goTo('sponsor-waiting-submitted');
  else if (key === 'current' || key === 'past') goTo('sponsor-' + key);
  return tree_list;
}

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
  icon.innerHTML = '<i class="' + d.icon + ' status-icon"></i>';
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





// Show login-result modal based on status

function showLoginStatus(page, status) {
  var d = loginStatusData[status] || loginStatusData.waiting;
  var icon = document.getElementById('lsm-icon');
  icon.style.background = d.bg;
  icon.style.color = d.color;
  icon.innerHTML = '<i class="' + d.icon + ' status-icon"></i>';
  document.getElementById('lsm-title').textContent = d.title;
  document.getElementById('lsm-text').textContent = d.text;
  var test = document.getElementById('lsm-test');
  if (test) test.style.display = TESTING_MODE ? 'block' : 'none';
  logoutTarget = page;
  document.getElementById('login-status-modal').classList.add('open');
}






// Tree data for album — read from storage


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
  if (page === 'pay-logs' || page === 'pay-logs-total' || page === 'pay-logs-this_month') {
    var activePayPage = document.querySelector('.page.active');
    if (activePayPage) {
      var payFrom = activePayPage.id.replace('page-', '');
      if (payFrom !== 'pay-logs' && payFrom !== 'pay-logs-total' && payFrom !== 'pay-logs-this_month') {
        payLogsFrom = payFrom;
      }
    }
  }
  
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('page-'+page).classList.add('active');
  var sb = document.getElementById('sbar');
  sb.className = 'status-bar';
  if (['sponsor-login','sponsor-enroll','ranger-login','ranger-dash','surveyor-login','surveyor-dash','trees','admin-login','admin-dash','admin-trees','admin-edit-tree','admin-add-tree','admin-trackers','admin-sponsors','admin-trackers-prospective','admin-sponsors-prospective','ranger-enroll','sponsor-enroll','surveyor-enroll','role-login'].indexOf(page) > -1) sb.classList.add('dark');
  else if (['sponsor-login','sponsor-dash','sponsor-waiting-submitted','sponsor-current','sponsor-past','sponsor-seeing','caregiver-login','caregiver-dash'].indexOf(page) > -1) sb.classList.add('blue');
  var alogout = document.getElementById('alogout-drop');
  if (alogout) alogout.classList.remove('open');
  
  }



function sponsorGoBack() {
  var active = document.querySelector('.page.active');
  var cur = active ? active.id.replace('page-', '') : '';
  if (cur === 'tree-logs') { goTo(treeLogsFrom); return; }
  if (cur === 'pay-logs' || cur === 'pay-logs-total' || cur === 'pay-logs-this_month') { goTo(payLogsFrom); return; }
  if (cur === 'profile') {
    var parent = new URLSearchParams(location.search).get('parent');
    if (parent) { window.location.href = decodeURIComponent(parent); return; }
    goTo(profileFrom); return;
  }
  var parent2 = new URLSearchParams(location.search).get('parent');
  if (parent2) { window.location.href = decodeURIComponent(parent2); return; }
  if (window.history.length > 1) window.history.back(); else goTo('sponsor-dash');
}
function treeLogsBack() { sponsorGoBack(); }
function payLogsBack() { sponsorGoBack(); }
function profileBack() { sponsorGoBack(); }
function openProfile(treeId) {
  var id = treeId || '625501-06-0001';
  var active = document.querySelector('.page.active');
  var current_hub = active ? active.id.replace('page-','') : 'sponsor-dash';
  if (current_hub === 'pay-logs') { current_hub = payMonthFilter ? 'pay-logs-this_month' : 'pay-logs-total'; }
  var parent = encodeURIComponent('sponsor.html?hub=' + current_hub);
  try { sessionStorage.setItem('gobackFromTreeProfile', decodeURIComponent(parent)); } catch(e) {}
  var userid = '';
  try {
    var login = storage.get('login') || window._login || {};
    var role = (login['tree-login'] && login['tree-login']['sponsor']) || {};
    userid = role.userId || new URLSearchParams(location.search).get('userid') || '';
  } catch (e) {}
  var userid_param = userid ? '&userid=' + encodeURIComponent(userid) : '';
  var flang = (typeof filterLang !== 'undefined' ? filterLang : (typeof appLang !== 'undefined' ? appLang : 'en'));
  window.location.href = 'tree-profile.html?treeId=' + encodeURIComponent(id) + '&parent=' + parent + '&flang=' + encodeURIComponent(flang) + userid_param;
}
function profileBack() { try { if (window.history.length > 1) window.history.back(); else goTo(profileFrom); } catch (e) { goTo(profileFrom); } }





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
      html += '<div class="log-tracker-entry" onclick="openAlbumForTree(\'' + treeId + '\', ' + idx + ')"><div class="log-dot log-dot-tracker log-dot-' + (idx % 3) + '"></div><div><div class="log-date">' + (e.registeredDate || e.updatedDate || k) + '</div><div class="log-text">Height ' + (hs.height || c.height || '—') + ' · Diameter ' + (hs.diameter || c.diameter || '—') + '</div><div class="log-by">By ' + (e.registeredBy || e.updatedBy || '—') + '</div><div class="log-notes"><i class="ti ti-notes"></i><span><b class="log-label-red">Note</b> ' + (note_val || '—') + '</span></div><div class="log-todo"><i class="ti ti-clipboard-check"></i><span><b class="log-label-red">Recommendation</b> ' + (rec_val || '—') + '</span></div><div class="log-chips">' + (hs.height ? '<span class="chip">' + hs.height + '</span>' : '') + (e.photos && e.photos.snapshots && e.photos.snapshots.length ? '<span class="chip-blue"><i class="ti ti-photo"></i>' + e.photos.snapshots.length + ' photos</span>' : '') + '</div></div></div>';
    }
    list_el.innerHTML = html || '<div class="logs-empty">No logs yet</div>';
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
    div.innerHTML = '<div class="album-photo-emoji' + (p.main ? ' album-photo-emoji-main' : '') + '">' + p.emoji + '</div><div class="photo-label">'+p.label+'</div><div class="photo-time">'+p.time+'</div>';
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
function getCurrentMonthPrefixForPayments() {
  var now_date = new Date();
  var yyyy = String(now_date.getFullYear());
  var mm = String(now_date.getMonth() + 1).padStart(2, '0');
  return yyyy + mm;
}
function getPaymentMonthLabelFromPaidAtTimestamp(payment_paid_at_timestamp) {
  if (!payment_paid_at_timestamp || !/^\d{8}T\d{6}$/.test(payment_paid_at_timestamp)) return '';
  var month_names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var yyyy = payment_paid_at_timestamp.slice(0,4);
  var mm = parseInt(payment_paid_at_timestamp.slice(4,6),10);
  return month_names[mm-1] + ' ' + yyyy;
}
function getPaymentPaidDateLabelFromPaidAtTimestamp(payment_paid_at_timestamp, payment_card_month_label) {
  if (!payment_paid_at_timestamp) return '';
  if (/^\d{8}T\d{6}$/.test(payment_paid_at_timestamp)) {
    var dd = parseInt(payment_paid_at_timestamp.slice(6,8),10);
    return 'Paid · ' + dd + ' ' + payment_card_month_label;
  }
  return payment_paid_at_timestamp;
}
function renderPayLogs() {
  var total_el = document.getElementById('pay-history-total');
  var this_month_el = document.getElementById('pay-history-this_month');
  var legacy_el = document.getElementById('pay-history');
  if (!total_el && !this_month_el && !legacy_el) { return; }
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  var cards = role.cards || {};
  var all_payments = cards.payments || [];
  var total_list = all_payments.filter(function (payment_item) { return !payTreeId || payment_item.treeId === payTreeId; });
  var current_month_prefix = getCurrentMonthPrefixForPayments();
  var this_month_list = all_payments.filter(function (payment_item) { var is_matching_tree = !payTreeId || payment_item.treeId === payTreeId; var is_this_month = (payment_item.paidAt || '').indexOf(current_month_prefix) === 0; return is_matching_tree && is_this_month; });
  function renderPaymentList(payment_list) {
    return payment_list.map(function (payment_item) {
      var payment_paid_at_timestamp = payment_item.paidAt || '';
      var payment_card_month_label = getPaymentMonthLabelFromPaidAtTimestamp(payment_paid_at_timestamp);
      var payment_card_paid_date_label = getPaymentPaidDateLabelFromPaidAtTimestamp(payment_paid_at_timestamp, payment_card_month_label);
      var payment_card_tree_id_label = payment_item.treeId || '';
      return '<div class="pay-entry" onclick="openProfile(\'' + payment_card_tree_id_label + '\')" style="cursor:pointer">' +
        '<div class="pay-icon"><i class="ti ti-check"></i></div>' +
        '<div><div class="pay-label">' + payment_card_tree_id_label + '</div><div class="pay-date">' + payment_card_paid_date_label + '</div></div>' +
        '<div class="pay-amount"><div class="pay-amount-val">' + payment_item.amount + '</div><div class="pay-badge">Paid</div></div>' +
        '</div>';
    }).join('');
  }
  if (total_el) total_el.innerHTML = renderPaymentList(total_list);
  if (this_month_el) this_month_el.innerHTML = renderPaymentList(this_month_list);
  if (legacy_el) legacy_el.innerHTML = renderPaymentList(total_list);
}

function openPaymentsTotal() {
  payTreeId = '';
  payMonthFilter = '';
  renderPayLogs();
  goTo('pay-logs-total');
}
function openPaymentsThisMonth() {
  payTreeId = '';
  payMonthFilter = getCurrentMonthPrefixForPayments();
  renderPayLogs();
  goTo('pay-logs-this_month');
}
function recordPayment() {
  var amtEl = document.querySelector('.amt-chip.selected');
  var amount = amtEl ? amtEl.textContent : '₹300';
  var login = window._login || (window._login = {});
  var tl = login['tree-login'] || (login['tree-login'] = {});
  var role = tl.sponsor || (tl.sponsor = {});
  var cards = role.cards || (role.cards = {});
  var payments = cards.payments || (cards.payments = []);
  payments.push({ treeId: payTreeId, amount: amount, paidAt: getCurrentAddedAtString() });
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
  var waiting_submitted_ids = waiting.map(function(e){ return e.treeId; });
  if (f.treeId && waiting_submitted_ids.indexOf(f.treeId) === -1) { waiting.push({ treeId: f.treeId, addedAt: getCurrentAddedAtString() }); console.log('[sponsor] sponsorATree added to waiting', f.treeId); } else { console.log('[sponsor] sponsorATree already in waiting or no treeId', f.treeId); }
  appendSponsorWaitingSubmittedCard(f);
  storage.set('login', login);
  console.log('[sponsor] sponsorATree saved login waiting', waiting);
  if (window.render && typeof window.render.init === 'function') { window.render.init(); }
  setTimeout(function(){ console.log('[sponsor] sponsorATree open full waiting list'); openSponsorWaitingSubmittedRequests(); }, 700);
}

function setStatById(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function appendSponsorWaitingSubmittedCard(form) {
  var titleEl = document.getElementById('swaiting-submitted-page-title');
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
  var cardsEl = document.getElementById('sponsor-waiting-submitted-cards');
  var emptyEl = document.getElementById('sponsor-waiting-submitted-empty');
  if (emptyEl) emptyEl.style.display = 'none';
  if (!cardsEl) { return; }
  var card = document.createElement('div');
  card.className = 'sponsor-tree-card';
  var height_display = height === '—' ? '—' : String(height).replace(/\s*m$/, '') + 'm';
  card.innerHTML = '<div class="tree-card-hero" style="background:'+bg+'" onclick="openProfile(\''+id+'\')"><button class="card-pin-btn" type="button" onclick="event.stopPropagation();openTreeMapById(\''+id+'\')"><i class="ti ti-map-pin"></i></button><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>'+emoji+' '+name+'</h3><p><i class="ti ti-map-pin"></i> '+loc+'</p></div></div><div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">'+height_display+'</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">'+diam+'</div></div><div class="tcs"><div class="tcs-label">Logs</div><div class="tcs-val">'+logs+'</div></div></div><div class="tree-card-status"><div class="status-dot status-dot-warn"></div><div class="status-txt">Waiting approval</div></div></div><div class="tree-card-btns"><button class="tcbtn tcbtn-logs" onclick="goTo(\'tree-logs\')"><i class="ti ti-list"></i> View logs</button><button class="tcbtn tcbtn-pay" onclick="goTo(\'pay-logs-total\')"><i class="ti ti-receipt"></i> Payments</button></div>';
  cardsEl.appendChild(card);
  console.log('[sponsor] appendSponsorWaitingSubmittedCard added card', id, 'now count', cardsEl.querySelectorAll('.sponsor-tree-card').length);
  setStatById('s-sponsor-waiting-submitted', cardsEl.querySelectorAll('.sponsor-tree-card').length);
  setTimeout(function(){ console.log('[sponsor] appendSponsorWaitingSubmittedCard goTo sponsor-waiting-submitted'); goTo('sponsor-waiting-submitted'); }, 500);
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
function openSponsorWaitingSubmittedRequests() {
  var titleEl = document.getElementById('swaiting-submitted-page-title');
  if (titleEl) titleEl.textContent = 'Sponsor request';
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  var waiting_raw = (role.cards || {}).waiting || [];
  var sorted_waiting = getSortedWaitingList(waiting_raw, 'desc');
  var ids = sorted_waiting.map(function(e){ return e.treeId; });
  var added_map = {};
  sorted_waiting.forEach(function(e){ added_map[e.treeId] = e.addedAt; });
  var data = window.__TREE_DATA || [];
  var requestList = ids.map(function(id){ for(var i=0;i<data.length;i++){ if(data[i].treeId===id) { var copy_t = {}; for(var k in data[i]) copy_t[k]=data[i][k]; copy_t.addedAt = added_map[id]; return copy_t; } } return null; }).filter(function(t){ return !!t; });
  var cardsEl = document.getElementById('sponsor-waiting-submitted-cards');
  var emptyEl = document.getElementById('sponsor-waiting-submitted-empty');
  if (cardsEl) cardsEl.innerHTML = requestList.map(sponsorTreeCardHtml).join('');
  if (emptyEl) emptyEl.style.display = requestList.length ? 'none' : 'block';
  goTo('sponsor-waiting-submitted');
}

function openSponsorSeeing() {
  checkNewSponserTrees();
}




function sponsorTreeCardHtml(t) {
  var q = String.fromCharCode(39);
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var status = c.statusLogged || c.statusChecked || st.health || '';
  var name_txt = sponsorCardName(t) || t.englishName || t.name || '';
  var addr_txt = sponsorCardAddr(t) || c.addr || '';
  var login_for_pay = storage.get('login') || window._login || {};
  var pay_list = (((login_for_pay['tree-login'] && login_for_pay['tree-login']['sponsor'] && login_for_pay['tree-login']['sponsor'].cards) || {}).payments || []);
  var paid_amount = 0;
  for (var pi = 0; pi < pay_list.length; pi++) { if (pay_list[pi].treeId === t.treeId && pay_list[pi].status !== 'retried') { var amt = parseInt(String(pay_list[pi].amount || '').replace(/\D/g, '') || 0); paid_amount += amt; } }
  var paid_display = paid_amount ? '₹' + paid_amount : '—';
  var logs_display = keys.length || c.logs || 0;
  console.log('[sponsorTreeCard] treeId', t.treeId, 'logs', logs_display, 'paid', paid_display, 'pay_list_len', pay_list.length);
  return '<div class="sponsor-tree-card">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock"></i> Added: ' + t.addedAt + '</span>' + (t.isPast ? '' : '<button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); openDeleteConfirm(\'' + t.treeId + '\')"><i class="ti ti-trash"></i></button>') + '</div>' +
    '<div class="tree-card-hero" style="background:' + (t.bg || c.bg || '') + '" onclick="openProfile(' + q + t.treeId + q + ')"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (t.emoji || c.emoji || '') + ' ' + name_txt + ' <span class="tcard-id">' + t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + q + t.treeId + q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Health</div><div class="tcs-val">' + (st.health || status || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (st.height || c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (st.diameter || c.diameter || '—') + '</div></div></div></div>' +
    '<div class="s-metric-row"><div class="s-metric-col"><span class="s-metric-label">Logs</span><div class="s-metric-val-row"><span class="sponsor-underline" onclick="openTreeLogs(\'' + t.treeId + '\')">' + logs_display + '</span><span>:</span><span class="sponsor-underline" onclick="openTreeLogs(\'' + t.treeId + '\')">View</span></div></div><div class="s-metric-divider"></div><div class="s-metric-col"><span class="s-metric-label">Payments</span><div class="s-metric-val-row"><span class="sponsor-underline" onclick="payTreeId=\'' + t.treeId + '\';payMonthFilter=\'\';renderPayLogs();goTo(\'pay-logs\')">' + paid_display + '</span>' + (t.isSubmitted || t.isPast ? '' : '<span>:</span><span class="sponsor-underline" onclick="payTreeId=\'' + t.treeId + '\';openPayNow()">Pay now</span>') + '</div></div></div>' +
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
  var currentList = currentIds.length ? data.filter(function sponsorCardName(t) { return currentIds.indexOf(t.treeId) > -1; }).sort(function(a,b){ return currentIds.indexOf(a.treeId) - currentIds.indexOf(b.treeId); }).map(function(t){ var c={}; for(var k in t) c[k]=t[k]; c.addedAt=current_map[t.treeId]; return c; }) : [];
  var pastList = pastIds.length ? data.filter(function sponsorCardName(t) { return pastIds.indexOf(t.treeId) > -1; }).sort(function(a,b){ return pastIds.indexOf(a.treeId) - pastIds.indexOf(b.treeId); }).map(function(t){ var c={}; for(var k in t) c[k]=t[k]; c.addedAt=past_map[t.treeId]; c.isPast=true; return c; }) : [];
  var waiting_raw = cards.waiting || [];
  var sorted_waiting = getSortedWaitingList(waiting_raw, 'desc');
  var waiting_submitted_map = {}; sorted_waiting.forEach(function(e){ if(e && e.treeId) waiting_submitted_map[e.treeId]=e.addedAt; });
  var waiting_submitted_ids = sorted_waiting.map(function(e){ return e.treeId || e; });
  var waiting_submitted_list = waiting_submitted_ids.length ? data.filter(function sponsorCardName(t) { return waiting_submitted_ids.indexOf(t.treeId) > -1; }).sort(function(a,b){ return waiting_submitted_ids.indexOf(a.treeId) - waiting_submitted_ids.indexOf(b.treeId); }).map(function(t){ var c={}; for(var k in t) c[k]=t[k]; c.addedAt=waiting_submitted_map[t.treeId]; c.isSubmitted=true; return c; }) : [];
  var currentCards = document.getElementById('sponsor-current-cards');
  if (currentCards) currentCards.innerHTML = currentList.map(sponsorTreeCardHtml).join('');
  var pastCards = document.getElementById('sponsor-past-cards');
  if (pastCards) pastCards.innerHTML = pastList.map(sponsorTreeCardHtml).join('');
  var waitingSubmittedCards = document.getElementById('sponsor-waiting-submitted-cards');
  if (waitingSubmittedCards) waitingSubmittedCards.innerHTML = waiting_submitted_list.map(sponsorTreeCardHtml).join('');
  var waitingSubmittedEmpty = document.getElementById('sponsor-waiting-submitted-empty');
  if (waitingSubmittedEmpty) waitingSubmittedEmpty.style.display = waiting_submitted_list.length ? 'none' : 'block';
  sponsoredCount = currentList.length + pastList.length;
  setStatById('s-tree-current', currentList.length);
  setStatById('s-tree-past', pastList.length);
  setStatById('s-current-count', currentList.length);
  setStatById('s-past-count', pastList.length);
  setStatById('s-sponsor-waiting-submitted', (cards.waiting || []).length);
  var total_paid = 0;
  var this_month_paid = 0;
  var current_month_prefix = getCurrentMonthPrefixForPayments();
  var all_payments = (cards.payments || []);
  for (var payment_idx = 0; payment_idx < all_payments.length; payment_idx++) {
    var payment_item = all_payments[payment_idx];
    var payment_amt = parseInt(String(payment_item.amount || '').replace(/\D/g, '') || 0, 10);
    total_paid += payment_amt;
    var is_this_month = (payment_item.paidAt || '').indexOf(current_month_prefix) === 0;
    if (is_this_month) this_month_paid += payment_amt;
  }
  setStatById('s-payments-total', total_paid ? '₹' + total_paid : '₹0');
  setStatById('s-payments-month', this_month_paid ? '₹' + this_month_paid : '₹0');
}

function sponsorSeeingCardHtml(t) {
  var q = String.fromCharCode(39);
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var status = c.statusLogged || c.statusChecked || st.health || '';
  var name_txt = sponsorCardName(t) || t.englishName || t.name || '';
  var addr_txt = sponsorCardAddr(t) || c.addr || '';
  var login_for_pay = storage.get('login') || window._login || {};
  var pay_list = (((login_for_pay['tree-login'] && login_for_pay['tree-login']['sponsor'] && login_for_pay['tree-login']['sponsor'].cards) || {}).payments || []);
  var paid_amount = 0;
  for (var pi = 0; pi < pay_list.length; pi++) { if (pay_list[pi].treeId === t.treeId && pay_list[pi].status !== 'retried') { var amt = parseInt(String(pay_list[pi].amount || '').replace(/\D/g, '') || 0); paid_amount += amt; } }
  var paid_display = paid_amount ? '₹' + paid_amount : '—';
  var logs_display = keys.length || c.logs || 0;
  return '<div class="sponsor-tree-card">'
    + '<div class="tree-card-hero" style="background:' + (t.bg || c.bg || '') + '" onclick="openProfile(' + q + t.treeId + q + ')"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (t.emoji || c.emoji || '') + ' ' + name_txt + ' <span class="tcard-id">' + t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + q + t.treeId + q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + addr_txt + '</span></p></div></div>'
    + '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Health</div><div class="tcs-val">' + (st.health || status || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (st.height || c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (st.diameter || c.diameter || '—') + '</div></div></div></div>'
    + '<div class="s-metric-row"><div class="s-metric-col"><span class="s-metric-label">Logs</span><div class="s-metric-val-row"><span class="sponsor-underline" onclick="openTreeLogs(\'' + t.treeId + '\')">' + logs_display + '</span><span>:</span><span class="sponsor-underline" onclick="openTreeLogs(\'' + t.treeId + '\')">View</span></div></div><div class="s-metric-divider"></div><div class="s-metric-col"><span class="s-metric-label">Payments</span><div class="s-metric-val-row"><span class="sponsor-underline" onclick="payTreeId=\'' + t.treeId + '\';payMonthFilter=\'\';renderPayLogs();goTo(\'pay-logs\')">' + paid_display + '</span></div></div></div>'
    + '<div class="sponsor-seeing-actions"><button class="tcbtn tcbtn-logs" onclick="event.stopPropagation();confirmPendingSponsor(' + q + t.treeId + q + ')"><i class="ti ti-check"></i> Confirm</button><button class="tcbtn tcbtn-danger" onclick="event.stopPropagation();removePendingSponsor(' + q + t.treeId + q + ')"><i class="ti ti-trash"></i> Decline</button></div>'
    + '</div>';
}
function openSponsorSeeingModal(pending_trees) {
  var grid = document.getElementById('sponsor-seeing-grid');
  var empty = document.getElementById('sponsor-seeing-empty');
  if (grid) grid.innerHTML = pending_trees.map(sponsorSeeingCardHtml).join('');
  if (empty) empty.style.display = pending_trees.length ? 'none' : 'block';
  goTo('sponsor-seeing');
  window._sponsorSeeingBack = 'sponsor-dash';
}
function closeSponsorSeeingModal() { goTo('sponsor-dash'); }
function confirmPendingSponsor(tree_id) {
  try {
    var list = JSON.parse(sessionStorage.getItem('sponsorWaiting') || '[]');
    sponsorATree({ treeId: tree_id });
    var idx = list.indexOf(tree_id);
    if (idx > -1) { list.splice(idx, 1); sessionStorage.setItem('sponsorWaiting', JSON.stringify(list)); }
  } catch (e) {}
  closeSponsorSeeingModal(); loadDashboard();
}
function removePendingSponsor(tree_id) {
  var list = [];
  try { list = JSON.parse(sessionStorage.getItem('sponsorWaiting') || '[]'); } catch (e) {}
  var idx = list.indexOf(tree_id);
  if (idx > -1) list.splice(idx, 1);
  sessionStorage.setItem('sponsorWaiting', JSON.stringify(list));
  if (list.length) checkNewSponserTrees();
  else { closeSponsorSeeingModal(); loadDashboard(); }
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
        var waiting_submitted_ids = waiting.map(function(e){ return e.treeId; });
        if (waiting_submitted_ids.indexOf(treeId) === -1) { waiting.push({treeId: treeId, addedAt: getCurrentAddedAtString()}); changed = true; console.log('[sponsor] added to waiting', treeId); } else { console.log('[sponsor] already in waiting', treeId); }
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
    if (hubMode === 'sponsor-dash' || hubMode === 'sponsor-waiting-submitted' || hubMode === 'sponsor-next-due') { had_pending = consumePendingSponsorRequest(); }
    var result = loadDashboard();
    var role = (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
    var cards = role.cards || {};
    if (hubMode === 'pay-logs-total' || hubMode === 'pay-logs-this_month') {
      payTreeId = '';
    } else {
      var first = (cards.current || [])[0] || '';
      payTreeId = typeof first === 'string' ? first : (first.treeId || '');
    }
    renderPayLogs();
    if (had_pending) { openSponsorWaitingSubmittedRequests(); return; }
    if (hubMode === 'sponsor-waiting-submitted') { openSponsorWaitingSubmittedRequests(); }
    if (hubMode === 'sponsor-next-due') { openSponsorNextDue(); }
    if (hubMode === 'pay-logs-total') { loadPayLogsTotalSegment(); }
    if (hubMode === 'pay-logs-this_month') { loadPayLogsThisMonthSegment(); }
  }
};
function openTreePool() {
  var login = storage.get('login') || window._login || {};
  var role = (login['tree-login'] && login['tree-login']['sponsor']) || (window._login && window._login['tree-login'] && window._login['tree-login']['sponsor']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['sponsor']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var cards = role.cards || {};
  var sponsor_waiting = []; try { sponsor_waiting = JSON.parse(sessionStorage.getItem('sponsorWaiting') || '[]'); } catch (e) {}
  var exclude = [].concat(
    (cards.current || []).map(function(c){ return c.treeId; }),
    (cards.past || []).map(function(c){ return c.treeId; }),
    (cards.waiting || []).map(function(c){ return c.treeId; }),
    sponsor_waiting
  ).join(',');
  var parent = encodeURIComponent('sponsor.html?hub=sponsor-dash');
  var userid = role.userId || '';
  var url = 'filter.html?userid=' + encodeURIComponent(userid) + '&parent=' + parent + '&exclude=' + encodeURIComponent(exclude);
  sessionStorage.setItem('gobackFromTreeProfile', url);
  console.log('[sponsor] openTreePool ->', url);
  window.location.href = url;
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

function loadSponsorLoginSegment() { goTo('sponsor-login'); }
function loadSponsorEnrollSegment() { goTo('sponsor-enroll'); }
function loadSponsorDashSegment() { goTo('sponsor-dash'); }
function loadSponsorWaitingSubmittedSegment() { goTo('sponsor-waiting-submitted'); }
function loadSponsorCurrentSegment() { goTo('sponsor-current'); }
function loadSponsorPastSegment() { goTo('sponsor-past'); }
function loadSponsorNextDueSegment() { goTo('sponsor-next-due'); }
function loadPayLogsTotalSegment() { payMonthFilter = ''; goTo('pay-logs-total'); }
function loadPayLogsThisMonthSegment() { payMonthFilter = getCurrentMonthPrefixForPayments(); goTo('pay-logs-this_month'); }
function loadHubSegment() {
  if (hubMode === 'login') { loadSponsorLoginSegment(); }
  else if (hubMode === 'register') { loadSponsorEnrollSegment(); }
  else if (hubMode === 'sponsor-dash') { loadSponsorDashSegment(); }
  else if (hubMode === 'sponsor-waiting-submitted') { loadSponsorWaitingSubmittedSegment(); }
  else if (hubMode === 'sponsor-current') { loadSponsorCurrentSegment(); }
  else if (hubMode === 'sponsor-past') { loadSponsorPastSegment(); }
  else if (hubMode === 'sponsor-next-due') { loadSponsorNextDueSegment(); }
  else if (hubMode === 'pay-logs-total') { loadPayLogsTotalSegment(); }
  else if (hubMode === 'pay-logs-this_month') { loadPayLogsThisMonthSegment(); }
  else { console.log('[sponsor] unknown hubMode, redirect to login-hub'); window.location.href = 'login-hub.html'; }
}
var hubMode = new URLSearchParams(location.search).get('hub');
console.log('[sponsor] hubMode', hubMode, 'href', location.href);
loadHubSegment();

