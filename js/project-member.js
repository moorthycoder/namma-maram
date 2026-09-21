
var TESTING_MODE = true;
var projectMemberedCount = 0;
var caredCount = 4;
var logoutTarget = 'project-member-login';

function getProjectMemberLang() {
  if (typeof appLang !== 'undefined' && appLang) return appLang;
  if (typeof filterLang !== 'undefined' && filterLang) return filterLang;
  try { return sessionStorage.getItem('nm-app-lang') || 'en'; } catch (e) { return 'en'; }
}
function firstOf(v) { return Array.isArray(v) ? (v[0] || '') : (v || ''); }
function projectMemberCardName(t) {
  if (!t) return '';
  var lang = getProjectMemberLang();
  if (typeof storage !== 'undefined' && storage.treeNameIn) { try { var res = storage.treeNameIn(t, lang); if (Array.isArray(res) && res.length) return res[0]; } catch (e) {} }
  return t.scientificName || '';
}
function projectMemberCardAddr(t) {
  if (!t) return '';
  var lang = getProjectMemberLang();
  var pin = String(t.pincode || '');
  var pl = t.placeName || '';
  for (var i = 0; i < (window.__PLACES || []).length; i++) { var p = window.__PLACES[i]; if ((p.placeName && p.placeName.en === pl) || String(p.pinCode || p.pincode || '') === pin) { return p.placeName[lang] || p.placeName.en || pl; } }
  return pl || (pin ? 'Pincode ' + pin : '');
}

function loginCheckProjectMember() {
  var r = window.__login || null;
  if (r && r['tree-login'] && r['tree-login']['project-member'] && r['tree-login']['project-member'].loggedIn) {
    return true;
  }
  window.location.href = 'login-hub.html?role=project-member';
  return false;
}
function loadCurrentUser() {
  try {
    var s = sessionStorage.getItem('loginCredentialsV1');
    if (!s) { return; }
    var cred = JSON.parse(s);
    var role = cred['tree-login'] && cred['tree-login']['project-member'];
    if (!role) { return; }
    var nameEl = document.getElementById('user-name');
    var avatarEl = document.getElementById('user-avatar');
    if (nameEl) nameEl.textContent = role.name;
    if (avatarEl) avatarEl.textContent = role.avatar;
    window.__login = cred;
  } catch (e) {}
}
loadCurrentUser();

function checkNewProjectMemberTrees() {
  var projectMember_waiting_str = sessionStorage.getItem('projectMemberWaiting');
  if (projectMember_waiting_str === null) return [];
  var new_ids = [];
  try { var arr = JSON.parse(projectMember_waiting_str); if (Array.isArray(arr)) new_ids = arr.filter(function(e){ return typeof e === 'string' && e; }); } catch (e) { new_ids = []; }
  if (!new_ids.length) return [];
  try {
    var _login_chk = storage.get('login') || window.__login || null;
    if (!_login_chk) { var _s = sessionStorage.getItem('loginCredentialsV1'); if (_s) _login_chk = JSON.parse(_s); }
    var _projectMember_chk = _login_chk && _login_chk['tree-login'] && _login_chk['tree-login']['project-member'];
    if (!_projectMember_chk || !_projectMember_chk.userId) {
      window.location.href = 'login-hub.html?role=project-member';
      return new_ids;
    }
  } catch (e) {}
  var ram_data = storage.get('treeCards') || window.__TREE_DATA || [];
  var pending_trees = [];
  for (var i = 0; i < new_ids.length; i++) { var id = new_ids[i]; for (var r = 0; r < ram_data.length; r++) { if (ram_data[r].treeId === id) { pending_trees.push(ram_data[r]); break; } } }
  if (pending_trees.length) openProjectMemberSeeingModal(pending_trees);
  return new_ids;
}

function updateWaitingListFromPendingProjectMember() {
  try {
    var raw_data = sessionStorage.getItem('pendingCare');
    console.log('[project-member] updateWaitingListFromPendingProjectMember raw', raw_data);
    if (!raw_data) { goTo('project-member-dash'); return false; }
    var pending_data = JSON.parse(raw_data);
    var pending_tree_id = null;
    for (var pending_key in pending_data) { if (Object.prototype.hasOwnProperty.call(pending_data, pending_key)) { pending_tree_id = pending_data[pending_key]; break; } }
    if (!pending_tree_id) { goTo('project-member-dash'); return false; }
    var existing_list = isTreeIdAlreadyInProjectMemberLists(pending_tree_id);
    if (existing_list) {
      try { sessionStorage.removeItem('pendingCare'); } catch (e) {}
      openProjectMemberConflictModal(pending_tree_id, existing_list);
      return true;
    }
    try { sessionStorage.removeItem('pendingCare'); } catch (e) {}
    projectMemberATree({ treeId: pending_tree_id });
    return true;
  } catch (e) { console.log('[project-member] updateWaitingListFromPendingProjectMember error', e); goTo('project-member-dash'); return false; }
}
function isTreeIdAlreadyInProjectMemberLists(check_tree_id) {
  var login_data = window.__login || {};
  var tree_login = login_data['tree-login'] || {};
  var projectMember_role = tree_login.projectMember || {};
  var projectMember_cards = projectMember_role.cards || {};
  var waiting_list = projectMember_cards.waiting || [];
  var current_list = projectMember_cards.current || [];
  var past_list = projectMember_cards.past || [];
  var waiting_ids = waiting_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var current_ids = current_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var past_ids = past_list.map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var is_in_waiting = waiting_ids.indexOf(check_tree_id) > -1;
  var is_in_current = current_ids.indexOf(check_tree_id) > -1;
  var is_in_past = past_ids.indexOf(check_tree_id) > -1;
  return is_in_waiting ? 'waiting' : is_in_current ? 'current' : is_in_past ? 'past' : null;
}
function openProjectMemberConflictModal(conflict_tree_id, conflict_list) {
  var title_el = document.getElementById('conflict-title');
  var text_el = document.getElementById('conflict-text');
  if (title_el) title_el.textContent = 'Already in ' + conflict_list;
  if (text_el) text_el.textContent = 'Tree ' + conflict_tree_id + ' is already in your ' + conflict_list + ' list.';
  document.getElementById('conflict-resolution-modal').classList.add('open');
}
function closeProjectMemberConflictModal() {
  document.getElementById('conflict-resolution-modal').classList.remove('open');
}
function projectMemberLogout() {
  try {
    if (window.parent && window.parent.goNav) { window.parent.goNav('login-hub.html'); return; }
    if (window.top && window.top.goNav) { window.top.goNav('login-hub.html'); return; }
  } catch (e) {}
  window.top.location.href = 'login-hub.html';
}
var registerStatusData = {
  waiting:          { icon:'ti ti-clock',       color:'#f59e0b', bg:'#fef3c7', title:'Application under review',  text:'Your registration is waiting for admin approval. We will notify you once it is reviewed.', go:'Login' },
  existing_member:  { icon:'ti ti-user-check',  color:'#16a34a', bg:'#dcfce7', title:'Already registered',        text:'An account with this email already exists. Please log in instead of registering again.', go:'Login', to:'project-member-login' },
  blocked:          { icon:'ti ti-ban',         color:'#dc2626', bg:'#fee2e2', title:'Registration blocked',       text:'Your registration has been blocked. Please contact support if you think this is a mistake.', go:'Contact us', to:'project-member-login' }
};

// Register status modal — waiting / existing_member / blocked
var regTarget = 'project-member-login';

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


// Open the shared role login page (Project member, Ten Tree Ranger, Surveyor)
var currentRole = 'project-member';



function roleDash() {
  return currentRole === 'surveyor' ? 'surveyor-dash' : 'ranger-dash';
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
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('page-'+page).classList.add('active');
  var sb = document.getElementById('sbar');
  sb.className = 'status-bar';
  if (['project-member-login','project-member-enroll','ranger-login','ranger-dash','surveyor-login','surveyor-dash','trees','admin-login','admin-dash','admin-trees','admin-edit-tree','admin-add-tree','admin-trackers','admin-care-givers','admin-trackers-prospective','admin-care-givers-prospective','ranger-enroll','project-member-enroll','surveyor-enroll','role-login'].indexOf(page) > -1) sb.classList.add('dark');
  else if (['project-member-login','project-member-dash','project-member-waiting','project-member-current','project-member-survey-current','project-member-past','project-member-seeing','project-member-checks-due','project-member-checks-finished','project-member-logs-approved','project-member-logs-submitted','project-member-browse','selfie','register-tree','project-member-login','project-member-dash'].indexOf(page) > -1) sb.classList.add('blue');
  var alogout = document.getElementById('alogout-drop');
  if (alogout) alogout.classList.remove('open');
  
  }



// Password toggle

function togglePw(id, btn) {
  var inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
  btn.querySelector('i').className = inp.type === 'password' ? 'ti ti-eye' : 'ti ti-eye-off';
}


// Open profile — clone sponsor: navigate to individual-tree-profile.html with treeId

function restoreHubScrollPosition(scroll_value) {
  if (!scroll_value) return;
  try { sessionStorage.removeItem('hubScrollTop'); } catch (e) {}
  var active_page = document.querySelector('.page.active');
  var scroll_el = active_page ? active_page.querySelector('.scrollable') : null;
  if (scroll_el) {
    var target_scroll = parseInt(scroll_value, 10) || 0;
    scroll_el.scrollTop = target_scroll;
    requestAnimationFrame(function () {
      scroll_el.scrollTop = target_scroll;
    });
  }
}

function openProfile(treeId) {
  var id = treeId ? treeId : '625501-06-0001';
  var active_el = document.querySelector('.page.active');
  var scroll_el = active_el ? active_el.querySelector('.scrollable') : null;
  var scroll_pos = scroll_el ? scroll_el.scrollTop : 0;
  try { sessionStorage.setItem('hubScrollTop', String(scroll_pos)); } catch (e) {}
  var current_hub = active_el ? active_el.id.replace('page-','') : 'project-member-dash';
  var parent_url = encodeURIComponent('project-member.html?hub=' + current_hub + '&scroll=' + scroll_pos);
  try { sessionStorage.setItem('gobackFromTreeProfile', decodeURIComponent(parent_url)); } catch (e) {}
  var user_id = '';
  try {
    var login_data = storage.get('login') || window.__login || {};
    var project_member_role = (login_data['tree-login'] && login_data['tree-login']['project-member']) || {};
    user_id = project_member_role.userId || new URLSearchParams(location.search).get('userid') || '';
  } catch (e) {}
  var user_param = user_id ? '&userid=' + encodeURIComponent(user_id) : '';
  var flang_val = (typeof filterLang !== 'undefined' ? filterLang : (typeof appLang !== 'undefined' ? appLang : 'en'));
  window.location.href = 'individual-tree-profile.html?treeId=' + encodeURIComponent(id) + '&parent=' + parent_url + '&flang=' + encodeURIComponent(flang_val) + user_param;
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


// Add tree

function projectMemberATree(f) {
  console.log('[project-member] projectMemberATree called', f);
  var login = window.__login || (window.__login = {});
  var tl = login['tree-login'] || (login['tree-login'] = {});
  var role = tl.projectMember || (tl.projectMember = {});
  var cards = role.cards || (role.cards = {});
  var waiting = cards.waiting || (cards.waiting = []);
  var waiting_ids = waiting.map(function(e){ return e.treeId; });
  if (f.treeId && waiting_ids.indexOf(f.treeId) === -1) { waiting.push({ treeId: f.treeId, addedAt: getCurrentAddedAtString() }); console.log('[project-member] projectMemberATree added to waiting', f.treeId); } else { console.log('[project-member] projectMemberATree already in waiting or no treeId', f.treeId); }
  appendProjectMemberWaitingCard(f);
  storage.set('login', login);
  console.log('[project-member] projectMemberATree saved login waiting', waiting);
  if (window.render && typeof window.render.init === 'function') { window.render.init(); }
  setTimeout(function(){ console.log('[project-member] projectMemberATree open full waiting list'); openProjectMemberWaitingRequests(); }, 700);
}

function setStatById(id, value) {
  var el = document.getElementById(id);
  if (el) el.textContent = value;
}

function appendProjectMemberWaitingCard(form) {
  var titleEl = document.getElementById('swaiting-page-title');
  if (titleEl) titleEl.textContent = 'Project member request';
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
  var full_name = tree ? (projectMemberCardName(tree) || '') : '';
  var name = form.name || (tree ? (full_name ? full_name + ' #' + id : '#' + id) : '');
  var full_addr = tree ? projectMemberCardAddr(tree) : '';
  var loc = form.loc || (tree ? (full_addr ? full_addr.split(', ')[0] : full_addr) : '');
  var bg = form.bg || (tree ? tree.bg || '' : '');
  var emoji = form.emoji || (tree ? tree.emoji || '🌳' : '🌳');
  var height = form.height != null ? form.height : (st.height || (tree && tree.card && tree.card.height) || '—');
  var diam = form.diam || st.diameter || (tree && tree.card && tree.card.diameter) || '—';
  var logs = form.logs != null ? form.logs : (keys.length || (tree && tree.encounters) || 0);
  var cardsEl = document.getElementById('project-member-waiting-cards');
  var emptyEl = document.getElementById('project-member-waiting-empty');
  if (emptyEl) emptyEl.style.display = 'none';
  if (!cardsEl) { return; }
  var card = document.createElement('div');
  card.className = 'tree-card-projectMember';
  var height_display = height === '—' ? '—' : String(height).replace(/\s*m$/, '') + 'm';
  card.innerHTML = '<div class="tree-card-hero" style="background:'+bg+';cursor:pointer;position:relative;" onclick="openProfile(\''+id+'\')"><button class="card-pin-btn" type="button" onclick="event.stopPropagation();openTreeMapById(\''+id+'\')"><i class="ti ti-map-pin" style="font-size:0.8rem"></i></button><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>'+emoji+' '+name+'</h3><p><i class="ti ti-map-pin" style="font-size:0.6rem"></i> '+loc+'</p></div></div><div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">'+height_display+'</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">'+diam+'</div></div><div class="tcs"><div class="tcs-label">Logs</div><div class="tcs-val">'+logs+'</div></div></div></div>';
  cardsEl.appendChild(card);
  console.log('[project-member] appendProjectMemberWaitingCard added card', id, 'now count', cardsEl.querySelectorAll('.tree-card-projectMember').length);
  setStatById('c-care-waiting', cardsEl.querySelectorAll('.tree-card-projectMember').length);
  setTimeout(function(){ console.log('[project-member] appendProjectMemberWaitingCard goTo project-member-waiting'); goTo('project-member-waiting'); }, 500);
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
function openProjectMemberWaitingRequests() {
  var titleEl = document.getElementById('swaiting-page-title');
  if (titleEl) titleEl.textContent = 'Project member request';
  var role = (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
  var waiting_raw = (role.cards || {}).waiting || [];
  var sorted_waiting = getSortedWaitingList(waiting_raw, 'desc');
  var ids = sorted_waiting.map(function(e){ return e.treeId; });
  var added_map = {};
  sorted_waiting.forEach(function(e){ added_map[e.treeId] = e.addedAt; });
  var data = window.__TREE_DATA || [];
  var requestList = ids.map(function(id){ for(var i=0;i<data.length;i++){ if(data[i].treeId===id) { var copy_t = {}; for(var k in data[i]) copy_t[k]=data[i][k]; copy_t.addedAt = added_map[id]; return copy_t; } } return null; }).filter(function(t){ return !!t; });
  var cardsEl = document.getElementById('project-member-waiting-cards');
  var emptyEl = document.getElementById('project-member-waiting-empty');
  if (cardsEl) cardsEl.innerHTML = requestList.map(projectMemberSubmittedCardHtml).join('');
  if (emptyEl) emptyEl.style.display = requestList.length ? 'none' : 'block';
  goTo('project-member-waiting');
}

function openWaitingRequests(type) {
  var is_care = String(type || 'care').toLowerCase().indexOf('care') > -1;
  var care_el = document.getElementById('care-waiting-section');
  var reg_el = document.getElementById('register-waiting-section');
  var title_el = document.getElementById('waiting-page-title') || document.getElementById('swaiting-page-title');
  if (title_el) title_el.textContent = is_care ? 'Care requests' : 'Register requests';
  if (care_el) care_el.style.display = is_care ? '' : 'none';
  if (reg_el) reg_el.style.display = is_care ? 'none' : '';
  var waiting_cards = document.getElementById('project-member-waiting-cards');
  var register_cards = document.getElementById('register-waiting-cards');
  if (is_care) {
    openProjectMemberWaitingRequests();
    if (reg_el) reg_el.style.display = 'none';
    if (care_el) care_el.style.display = '';
  } else {
    if (waiting_cards) waiting_cards.innerHTML = '';
    if (register_cards) register_cards.innerHTML = '<div class="waiting-empty">No register requests</div>';
    goTo('project-member-waiting');
    if (care_el) care_el.style.display = 'none';
    if (reg_el) reg_el.style.display = '';
  }
}

function openProjectMemberSeeing() {
  checkNewProjectMemberTrees();
}

function projectMemberSeeingCardHtml(t) {
  var q = String.fromCharCode(39);
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var status = c.statusLogged || c.statusChecked || st.health || '';
  var name_txt = projectMemberCardName(t);
  var addr_txt = projectMemberCardAddr(t);
  return '<div class="sponsor-tree-card">'
    + '<div class="tree-card-hero" style="background:' + (t.bg || c.bg || '') + '" onclick="openProfile(' + q + t.treeId + q + ')"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (t.emoji || c.emoji || '') + ' ' + name_txt + ' <span class="tcard-id">' + t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + q + t.treeId + q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + addr_txt + '</span></p></div></div>'
    + '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Health</div><div class="tcs-val">' + (st.health || status || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (formatLength(st.height||c.height,'height') || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (formatLength(st.diameter||c.diameter,'diameter') || '—') + '</div></div></div></div>'
    + '<div class="project-member-seeing-actions"><button class="tcbtn tcbtn-logs" onclick="event.stopPropagation();confirmPendingProjectMember(' + q + t.treeId + q + ')"><i class="ti ti-check"></i> Confirm</button><button class="tcbtn tcbtn-danger" onclick="event.stopPropagation();removePendingProjectMember(' + q + t.treeId + q + ')"><i class="ti ti-trash"></i> Decline</button></div>'
    + '</div>';
}

function openProjectMemberSeeingModal(pending_trees) {
  var grid = document.getElementById('project-member-seeing-grid');
  var empty = document.getElementById('project-member-seeing-empty');
  if (grid) grid.innerHTML = pending_trees.map(projectMemberSeeingCardHtml).join('');
  if (empty) empty.style.display = pending_trees.length ? 'none' : 'block';
  goTo('project-member-seeing');
  window._projectMemberSeeingBack = 'project-member-dash';
}

function closeProjectMemberSeeingModal() { goTo('project-member-dash'); }

function confirmPendingProjectMember(tree_id) {
  try {
    var list = JSON.parse(sessionStorage.getItem('projectMemberWaiting') || '[]');
    projectMemberATree({ treeId: tree_id });
    var idx = list.indexOf(tree_id);
    if (idx > -1) { list.splice(idx, 1); sessionStorage.setItem('projectMemberWaiting', JSON.stringify(list)); }
  } catch (e) {}
  closeProjectMemberSeeingModal(); if (window.render && typeof window.render.init === 'function') window.render.init();
}

function removePendingProjectMember(tree_id) {
  var list = [];
  try { list = JSON.parse(sessionStorage.getItem('projectMemberWaiting') || '[]'); } catch (e) {}
  var idx = list.indexOf(tree_id);
  if (idx > -1) list.splice(idx, 1);
  sessionStorage.setItem('projectMemberWaiting', JSON.stringify(list));
  if (list.length) checkNewProjectMemberTrees();
  else { closeProjectMemberSeeingModal(); if (window.render && typeof window.render.init === 'function') window.render.init(); }
}

function projectMemberBaseData(t) {
  var q = String.fromCharCode(39);
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var status = c.statusLogged || c.statusChecked || st.health || '';
  var name_txt = projectMemberCardName(t);
  var addr_txt = projectMemberCardAddr(t);
  var due_raw = t['encounter-due-date'] || '';
  var due_display = '';
  if (due_raw) { var dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(due_raw); due_display = dm ? dm[3] + '-' + dm[2] + '-' + dm[1] : due_raw; }
  var logs_display = keys.length || c.logs || 0;
  return { t:t, q:q, c:c, enc:enc, keys:keys, last:last, st:st, status:status, name_txt:name_txt, addr_txt:addr_txt, due_raw:due_raw, due_display:due_display, logs_display:logs_display };
}
function projectMemberCurrentCardHtml(t) {
  var d = projectMemberBaseData(t);
  return '<div class="tree-card-projectMember project-member-current-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + d.t.addedAt + '</span><button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); openDeleteConfirm(\'' + d.t.treeId + '\')"><i class="ti ti-trash"></i></button></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' + '</div>';
}
function projectMemberSurveyCurrentCardHtml(t) {
  var d = projectMemberBaseData(t);
  return '<div class="tree-card-projectMember project-member-survey-current-card" onclick="surveyDueTree(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + d.t.addedAt + '</span><button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); openDeleteConfirm(\'' + d.t.treeId + '\')"><i class="ti ti-trash"></i></button></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' + '</div>';
}
function projectMemberPastCardHtml(t) {
  var d = projectMemberBaseData(t);
  return '<div class="tree-card-projectMember project-member-past-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + d.t.addedAt + '</span></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' + '</div>';
}
function projectMemberSubmittedCardHtml(t) {
  var d = projectMemberBaseData(t);
  return '<div class="tree-card-projectMember project-member-submitted-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + d.t.addedAt + '</span><button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); openDeleteConfirm(\'' + d.t.treeId + '\')"><i class="ti ti-trash"></i></button></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' + '</div>';
}
function projectMemberDueCardHtml(t) {
  var d = projectMemberBaseData(t);
  return '<div class="tree-card-projectMember project-member-due-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Due: ' + d.due_display + '</span></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' + '</div>';
}
function projectMemberFinishedCardHtml(t) {
  var d = projectMemberBaseData(t);
  return '<div class="tree-card-projectMember project-member-finished-card" onclick="openProfile(\'' + d.t.treeId + '\')">' +
    '<div class="tcard-added-at"><span><i class="ti ti-clock" style="font-size:0.6667rem"></i> Added: ' + d.t.addedAt + '</span></div>' +
    '<div class="tree-card-hero" style="background:' + (d.t.bg || d.c.bg || '') + '"><div class="tree-card-overlay"></div><div class="tree-card-title"><h3>' + (d.t.emoji || d.c.emoji || '') + ' ' + d.name_txt + ' <span class="tcard-id">' + d.t.treeId + '</span></h3><p><button class="gis-pin" type="button" onclick="event.stopPropagation();showInMap([' + d.q + d.t.treeId + d.q + '])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + d.addr_txt + '</span></p></div></div>' +
    '<div class="tree-card-body"><div class="tree-card-stats"><div class="tcs"><div class="tcs-label">Status</div><div class="tcs-val">' + (d.status || d.st.health || '—') + '</div></div><div class="tcs"><div class="tcs-label">Height</div><div class="tcs-val">' + (d.st.height || d.c.height || '—') + '</div></div><div class="tcs"><div class="tcs-label">Diameter</div><div class="tcs-val">' + (d.st.diameter || d.c.diameter || '—') + '</div></div></div></div>' + '</div>';
}
function projectMemberCardHtml(t) { return projectMemberSubmittedCardHtml(t); }
function removeProjectMemberCard(remove_tree_id) {
  var login_data = window.__login || {};
  var tree_login = login_data['tree-login'] || {};
  var projectMember_role = tree_login.projectMember || {};
  var projectMember_cards = projectMember_role.cards || {};
  ['waiting','current','past'].forEach(function(list_name){
    var list_data = projectMember_cards[list_name] || [];
    projectMember_cards[list_name] = list_data.filter(function(e){ var id = typeof e === 'string' ? e : e.treeId; return id !== remove_tree_id; });
  });
  storage.set('login', login_data);
  if (window.render && typeof window.render.init === 'function') window.render.init();
}
var pending_delete_id = '';
var pending_projectMember_log_type = '';
var pending_projectMember_log_key = '';
function openDeleteConfirm(delete_tree_id) {
  pending_delete_id = delete_tree_id;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove tree ' + delete_tree_id + ' from your list?';
  document.getElementById('delete-confirm-modal').classList.add('open');
}
function deleteProjectMemberLog(tree_id, log_type) {
  var tid = tree_id || '';
  var type_key = log_type || 'register-log';
  pending_projectMember_log_type = type_key;
  pending_projectMember_log_key = tid;
  var text_el = document.getElementById('delete-confirm-text');
  if (text_el) text_el.textContent = 'Remove ' + (type_key === 'survey-log' ? 'survey' : 'register') + ' log "' + tid + '"? This will remove it from your submitted logs.';
  document.getElementById('delete-confirm-modal').classList.add('open');
}
function confirmDeleteCard() {
  document.getElementById('delete-confirm-modal').classList.remove('open');
  if (pending_projectMember_log_type && pending_projectMember_log_key) {
    var log_type = pending_projectMember_log_type;
    var log_key = pending_projectMember_log_key;
    pending_projectMember_log_type = '';
    pending_projectMember_log_key = '';
    var login_data = window.__login || storage.get('login') || {};
    var projectMember_role = (login_data['tree-login'] && login_data['tree-login']['project-member']) || {};
    var cards = projectMember_role.cards || {};
    var log_list = (cards[log_type] && cards[log_type].submitted) || [];
    var filtered = log_list.filter(function (e) { return String(e.treeId || e) !== String(log_key); });
    if (cards[log_type]) cards[log_type].submitted = filtered;
    projectMember_role.cards = cards;
    login_data['tree-login'] = login_data['tree-login'] || {};
    login_data['tree-login']['project-member'] = projectMember_role;
    try { storage.set('login', login_data); window.__login = login_data; } catch (e) {}
    try { var is_survey = log_type === 'survey-log'; setStatById(is_survey ? 'c-survey-log-submitted' : 'c-register-log-submitted', filtered.length); } catch (e) {}
    renderProjectMemberLogs(log_type, 'submitted');
    return;
  }
  if (pending_delete_id) { removeProjectMemberCard(pending_delete_id); pending_delete_id = ''; }
}
function cancelDeleteCard() {
  pending_delete_id = '';
  pending_projectMember_log_type = '';
  pending_projectMember_log_key = '';
  document.getElementById('delete-confirm-modal').classList.remove('open');
}
function renderProjectMemberCards() {
  var data = window.__TREE_DATA || [];
  var role = (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
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
  var currentCards = document.getElementById('project-member-current-cards');
  if (currentCards) currentCards.innerHTML = currentList.map(projectMemberCurrentCardHtml).join('');
  var surveyCurrentCards = document.getElementById('project-member-survey-current-cards');
  if (surveyCurrentCards) surveyCurrentCards.innerHTML = currentList.map(projectMemberSurveyCurrentCardHtml).join('');
  var pastCards = document.getElementById('project-member-past-cards');
  if (pastCards) pastCards.innerHTML = pastList.map(projectMemberPastCardHtml).join('');
  projectMemberedCount = currentList.length + pastList.length;
  setStatById('c-tree-current', currentList.length);
  setStatById('c-tree-past', pastList.length);
  setStatById('s-current-count', currentList.length);
  setStatById('s-past-count', pastList.length);
  setStatById('c-care-waiting', (cards.waiting || []).length);
  var monthlyEl = document.getElementById('c-monthly');
  if (monthlyEl) monthlyEl.textContent = '₹' + (projectMemberedCount * 300);
}

function consumePendingProjectMemberRequest() {
  try {
    var raw = sessionStorage.getItem('pendingCare');
    console.log('[project-member] consumePendingProjectMember raw', raw);
    if (!raw) return false;
    var pending = JSON.parse(raw);
    var login = storage.get('login') || window.__login || {};
    var tl = login['tree-login'] || (login['tree-login'] = {});
    var changed = false;
    for (var userid in pending) {
      if (!Object.prototype.hasOwnProperty.call(pending, userid)) continue;
      var treeId = pending[userid];
      console.log('[project-member] processing pending', userid, treeId);
      var target = null; var target_key = null;
      for (var k in tl) { if (tl[k] && tl[k].userId === userid) { target = tl[k]; target_key = k; break; } }
      if (!target && userid === 'project-member') {
        for (var kk in tl) { if (tl[kk] && tl[kk].type === 'project-member') { target = tl[kk]; target_key = kk; break; } }
      }
      console.log('[project-member] target found', target_key, !!target);
      if (target) {
        var cards = target.cards || (target.cards = {});
        var waiting = cards.waiting || (cards.waiting = []);
        var waiting_ids = waiting.map(function(e){ return e.treeId; });
        if (waiting_ids.indexOf(treeId) === -1) { waiting.push({treeId: treeId, addedAt: getCurrentAddedAtString()}); changed = true; console.log('[project-member] added to waiting', treeId); } else { console.log('[project-member] already in waiting', treeId); }
        cards.waiting = waiting; target.cards = cards; tl[target_key] = target;
      } else { console.log('[project-member] no target for userid', userid); }
    }
    if (changed) { login['tree-login'] = tl; storage.set('login', login); window.__login = login; console.log('[project-member] saved login', login); }
    sessionStorage.removeItem('pendingCare');
    console.log('[project-member] consume done changed', changed);
    return changed;
  } catch (e) { console.log('[project-member] consume error', e); try { sessionStorage.removeItem('pendingCare'); } catch (e2) {} return false; }
}
function updateChecksThisMonthStats() {
  var data = window.__TREE_DATA || storage.get('treeCards') || [];
  var role = (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
  var cards = role.cards || {};
  var currentIds = (cards.current || []).map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var currentList = currentIds.length ? data.filter(function (t) { return currentIds.indexOf(t.treeId) > -1; }) : data.filter(function (t) { return t.roles && t.roles.indexOf('project-member') > -1; });
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
  var checksCardsEl = document.getElementById('project-member-checks-cards');
  if (checksCardsEl) {
    checksCardsEl.innerHTML = finishedTrees.map(function (t) { var c={}; for(var k in t) c[k]=t[k]; c.addedAt=currentMapForChecks[t.treeId]||''; return projectMemberFinishedCardHtml(c); }).join('');
    var checksEmptyEl = document.getElementById('project-member-checks-empty');
    if (checksEmptyEl) checksEmptyEl.style.display = finishedTrees.length ? 'none' : 'block';
  }
  var checksDueEl = document.getElementById('project-member-checks-due-cards');
  if (checksDueEl) {
    checksDueEl.innerHTML = dueTrees.map(function (t) { var c={}; for(var k in t) c[k]=t[k]; c.addedAt=currentMapForChecks[t.treeId]||''; return projectMemberDueCardHtml(c); }).join('');
    var checksDueEmptyEl = document.getElementById('project-member-checks-due-empty');
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
  window._projectMemberNextDueList = dueListForNext.slice(0,3).map(function(x){ return x.tree.treeId; });
  window._projectMemberNextDueId = window._nextCheckTreeId;
  var c_next_due_list_el = document.getElementById('c-next-due-list');
  if(c_next_due_list_el){
    var next3 = dueListForNext.slice(0,3);
    if(!next3.length && nextCheckTreeForLabel){ next3 = [{tree: nextCheckTreeForLabel, due: chosenNext ? chosenNext.due : ''}]; window._projectMemberNextDueList = next3.map(function(x){ return x.tree.treeId; }); }
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
  try { sessionStorage.removeItem('projectMemberNextDueSingle'); } catch (e) {}
  if (window._nextCheckTreeId && typeof openProfile === 'function') { openProfile(window._nextCheckTreeId); return; }
  var data = window.__TREE_DATA || storage.get('treeCards') || [];
  var role = (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
  var cards = role.cards || {};
  var currentIds = (cards.current || []).map(function(e){ return typeof e === 'string' ? e : e.treeId; });
  var currentList = currentIds.length ? data.filter(function(t){ return currentIds.indexOf(t.treeId) > -1; }) : data.filter(function(t){ return t.roles && t.roles.indexOf('project-member') > -1; });
  if (!currentList.length) { goTo('project-member-current'); return; }
  var dueList = currentList.map(function(t){ return {tree: t, due: t['encounter-due-date'] || ''}; }).filter(function(x){ return x.due; }).sort(function(a,b){ return a.due.localeCompare(b.due); });
  if (dueList.length) {
    var nowDate = new Date();
    var todayStr = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).padStart(2, '0') + '-' + String(nowDate.getDate()).padStart(2, '0');
    var future = dueList.filter(function(x){ return x.due >= todayStr; });
    var chosen = future.length ? future[0] : dueList[dueList.length - 1];
    openProfile(chosen.tree.treeId);
    return;
  }
  goTo('project-member-current');
}
function renderProjectMemberNextDueSingleCard(single_tid) {
  if (!single_tid) return false;
  var ram = storage.get('treeCards') || window.__TREE_DATA || [];
  var t = null; for (var i = 0; i < ram.length; i++) if (ram[i].treeId === single_tid) { t = ram[i]; break; }
  if (!t) return false;
  var login_data = storage.get('login') || window.__login || {};
  var cards = ((login_data['tree-login'] && login_data['tree-login']['project-member']) || {}).cards || {};
  var sorted = getSortedWaitingList(cards.current || [], 'desc'); var m = {}; sorted.forEach(function(e){ if(e && e.treeId) m[e.treeId] = e.addedAt; });
  var c = {}; for (var k in t) c[k] = t[k]; c.addedAt = m[single_tid] || ''; c.isDueCard = true;
  var cardEl = document.getElementById('project-member-checks-due-cards'); var emptyEl = document.getElementById('project-member-checks-due-empty');
  if (emptyEl) emptyEl.style.display = 'none'; if (cardEl) cardEl.innerHTML = projectMemberCardHtml(c);
  return true;
}
function openNextCheckTreeCard(projectMember_next_due_event, projectMember_next_due_idx) {
  if (projectMember_next_due_event) projectMember_next_due_event.stopPropagation();
  var projectMember_next_due_list_local = window._projectMemberNextDueList || [];
  var projectMember_next_due_tree_id = '';
  if (typeof projectMember_next_due_idx === 'number' && projectMember_next_due_list_local[projectMember_next_due_idx]) {
    projectMember_next_due_tree_id = projectMember_next_due_list_local[projectMember_next_due_idx];
  } else {
    projectMember_next_due_tree_id = window._projectMemberNextDueId || window._nextCheckTreeId || '';
  }
  if (!projectMember_next_due_tree_id) return;
  if (!renderProjectMemberNextDueSingleCard(projectMember_next_due_tree_id)) return;
  try { sessionStorage.setItem('projectMemberNextDueSingle', projectMember_next_due_tree_id); } catch (e) {}
  goTo('project-member-checks-due');
}
function openProjectMemberDueList() {
  try { sessionStorage.removeItem('projectMemberNextDueSingle'); } catch (e) {}
  goTo('project-member-checks-due');
}

function loadDashboard() {
  var ram_data = storage.get('treeCards') || window.__TREE_DATA || [];
  console.log('[project-member] loadDashboard RAM', ram_data.length, 'login', (storage.get('login')||{}));
  window.__TREE_DATA = ram_data;
  albumData = Array.isArray(ram_data) ? ram_data : (ram_data.albumData || []);
  renderProjectMemberCards();
  updateChecksThisMonthStats();
  var new_projectMember_ids = checkNewProjectMemberTrees();
  setStatById('c-care-seeing', new_projectMember_ids.length);
  var dash_role = (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
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
  if (!ram_data.length) console.warn('[project-member] loadDashboard: RAM empty');
  return { ram_data: ram_data, new_projectMember_ids: new_projectMember_ids, register_approved: register_approved, register_submitted: register_submitted, survey_approved: survey_approved, survey_submitted: survey_submitted };
}

window.render = {
  init: function () {
    if (hubMode === 'login') { return; }
    if (!loginCheckProjectMember()) return;
    var qp = new URLSearchParams(location.search);
    var saved_scroll = qp.get('scroll');
    if (!saved_scroll) {
      try { saved_scroll = sessionStorage.getItem('hubScrollTop'); } catch (e) {}
    }
    var had_pending = false;
    if (hubMode === 'project-member-dash' || hubMode === 'project-member-waiting') { had_pending = consumePendingProjectMemberRequest(); }
    loadDashboard();
    var role = (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
    var cards = role.cards || {};
    if (had_pending) { openProjectMemberWaitingRequests(); restoreHubScrollPosition(saved_scroll); return; }
    if (hubMode === 'project-member-waiting') { openProjectMemberWaitingRequests(); }
    if (hubMode === 'project-member-seeing') { checkNewProjectMemberTrees(); }
    if (hubMode === 'project-member-checks-due') {
      var single = null; try { single = sessionStorage.getItem('projectMemberNextDueSingle'); } catch (e) {}
      if (single && renderProjectMemberNextDueSingleCard(single)) { goTo('project-member-checks-due'); }
    }
    if (hubMode === 'project-member-logs-approved') { goTo('project-member-logs-approved'); renderProjectMemberLogs('approved'); }
    if (hubMode === 'project-member-logs-submitted') { goTo('project-member-logs-submitted'); renderProjectMemberLogs('submitted'); }
    restoreHubScrollPosition(saved_scroll);
  }
};

window.addEventListener('pageshow', function () {
  try {
    var saved_scroll = sessionStorage.getItem('hubScrollTop');
    if (saved_scroll) restoreHubScrollPosition(saved_scroll);
  } catch (e) {}
});
function treeCardHtml(t, cfg) {
  var q = String.fromCharCode(39);
  cfg = cfg || {};
  var c = t.card || {};
  var enc = t['encounters-list'] || {};
  var keys = Object.keys(enc);
  var last = enc[keys[keys.length - 1]] || {};
  var st = last['health-status'] || {};
  var addr_raw = projectMemberCardAddr(t) || c.addr || '';
  var addr = (cfg.addrMode === 'full' && c.addrFull) ? c.addrFull : addr_raw;
  var status = t.past ? (c.status || '') : (cfg.verb === 'logged' ? (c.statusLogged || c.statusChecked || st.health || '') : (c.statusChecked || c.statusLogged || st.health || ''));
  var latest = (cfg.showLatest && c.latest) ? '<div class="tcard-latest"><i class="ti ti-timeline" style="font-size:0.7333rem;flex-shrink:0"></i><span>' + c.latest + '</span></div>' : '';
  var todo = (cfg.showTodo && c.todo) ? '<div class="tcard-todo"><i class="ti ti-clipboard-check" style="font-size:0.7333rem;flex-shrink:0"></i><span>' + c.todo + '</span></div>' : '';
  var btn2Type = (cfg.btn2 !== undefined) ? cfg.btn2 : (c.btn2 || null);
  var btn2 = '';
  if (btn2Type === 'profile') {
    btn2 = '<button class="tcbtn tcbtn-pay" onclick="openProfile(' + q + t.treeId + q + ')"><i class="ti ti-leaf" style="font-size:0.8667rem"></i> Tree profile</button>';
  }
  return '<div class="tree-card-projectMember tcard">' +
    '<div class="tcard-head"><div class="tcard-row"><span class="tcard-id">' + (t.emoji || c.emoji || '') + ' ' + t.treeId + '</span><button class="tcard-toggle" type="button" onclick="toggleTreeCard(this)"><i class="ti ti-chevron-down"></i></button></div>' +
    '<div class="tcard-addr"><i class="ti ti-map-pin" style="font-size:0.6667rem"></i> ' + addr + '</div></div>' +
    '<div class="tcard-collapse" style="display:none;"><div class="tcard-img" style="background:' + (t.bg || c.bg || '') + ';">' + (t.emoji || c.emoji || '') + '</div>' + latest +
    '<div class="tcard-stats"><div class="tcard-stat"><div class="tcard-stat-lbl">Height</div><div class="tcard-stat-val">' + (formatLength(st.height||c.height,'height') || '—') + '</div></div><div class="tcard-stat"><div class="tcard-stat-lbl">Diameter</div><div class="tcard-stat-val">' + (formatLength(st.diameter||c.diameter,'diameter') || '—') + '</div></div><div class="tcard-stat"><div class="tcard-stat-lbl">Logs</div><div class="tcard-stat-val">' + (keys.length || c.logs || 0) + '</div></div></div>' +
    '<div class="tcard-status"><div class="status-dot" style="background:' + (c.statusDot || '#4ade80') + '"></div><div class="status-txt">' + status + '</div></div>' + todo +
    '<div class="tcard-btns">' + btn2 + '</div></div></div>';
}
function renderRoleCards(target, role, cfg) {
  var el = document.getElementById(target);
  if (!el) { return; }
  var data = window.__TREE_DATA || [];
  var list = data.filter(function (t) { return t.roles && t.roles.indexOf(role) > -1; });
  el.innerHTML = list.map(function (t) { return treeCardHtml(t, cfg); }).join('');
}

function openTreePool() {
  var login = storage.get('login') || window.__login || {};
  var role = (login['tree-login'] && login['tree-login']['project-member']) || (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['project-member']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var cards = role.cards || {};
  var project_member_waiting = []; try { project_member_waiting = JSON.parse(sessionStorage.getItem('projectMemberWaiting') || '[]'); } catch (e) {}
  var exclude = [].concat(
    (cards.current || []).map(function(c){ return c.treeId; }),
    (cards.past || []).map(function(c){ return c.treeId; }),
    (cards.waiting || []).map(function(c){ return c.treeId; }),
    project_member_waiting
  ).join(',');
  var active_el = document.querySelector('.page.active');
  var scroll_el = active_el ? active_el.querySelector('.scrollable') : null;
  var scroll_pos = scroll_el ? scroll_el.scrollTop : 0;
  try { sessionStorage.setItem('hubScrollTop', String(scroll_pos)); } catch (e) {}
  var current_hub = active_el ? active_el.id.replace('page-','') : 'project-member-dash';
  var parent_url = encodeURIComponent('project-member.html?hub=' + current_hub + '&scroll=' + scroll_pos);
  var user_id = role.userId ? role.userId : '';
  var target_url = 'filter.html?userid=' + encodeURIComponent(user_id) + '&parent=' + parent_url + '&exclude=' + encodeURIComponent(exclude);
  sessionStorage.setItem('gobackFromTreeProfile', target_url);
  console.log('[project-member] openTreePool ->', target_url);
  window.location.href = target_url;
}
function openSurveyATreePage() {
  var login = storage.get('login') || window.__login || {};
  var role = (login['tree-login'] && login['tree-login']['project-member']) || (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['project-member']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var parent = encodeURIComponent('project-member.html?hub=project-member-dash');
  var userid = role.userId || '';
  var url = 'survey-a-tree.html?parent=' + parent + '&userid=' + encodeURIComponent(userid);
  window.location.href = url;
}
function surveyDueTree(treeId) {
  var login = storage.get('login') || window.__login || {};
  var role = (login['tree-login'] && login['tree-login']['project-member']) || (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['project-member']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var active_el = document.querySelector('.page.active');
  var scroll_el = active_el ? active_el.querySelector('.scrollable') : null;
  var scroll_pos = scroll_el ? scroll_el.scrollTop : 0;
  try { sessionStorage.setItem('hubScrollTop', String(scroll_pos)); } catch (e) {}
  var current_hub = active_el ? active_el.id.replace('page-','') : 'project-member-dash';
  var parent_url = encodeURIComponent('project-member.html?hub=' + current_hub + '&scroll=' + scroll_pos);
  var user_id = role.userId ? role.userId : '';
  var target_url = 'survey-a-tree.html?parent=' + parent_url + '&userid=' + encodeURIComponent(user_id) + '&treeid=' + encodeURIComponent(treeId);
  window.location.href = target_url;
}
function openRegisterATreePage() {
  var login = storage.get('login') || window.__login || {};
  var role = (login['tree-login'] && login['tree-login']['project-member']) || (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['project-member']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var parent = encodeURIComponent('project-member.html?hub=project-member-dash');
  var userid = role.userId || '';
  var url = 'register-a-tree.html?parent=' + parent + '&userid=' + encodeURIComponent(userid);
  window.location.href = url;
}
function openLogsPage() {
  var login = storage.get('login') || window.__login || {};
  var role = (login['tree-login'] && login['tree-login']['project-member']) || (window.__login && window.__login['tree-login'] && window.__login['tree-login']['project-member']) || {};
  try { if (!role.userId) { var sess = JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); var sp = sess['tree-login'] && sess['tree-login']['project-member']; if (sp && sp.userId) role = sp; } } catch (e) {}
  var parent = encodeURIComponent('project-member.html?hub=project-member-dash');
  var userid = role.userId || '';
  var url = 'project-member.html?hub=project-member-logs-approved&parent=' + parent + '&userid=' + encodeURIComponent(userid);
  window.location.href = url;
}
function openLogsByType(logType, status) {
  var typeKey = (logType === 'survey-log') ? 'survey-log' : 'register-log';
  var st = (status === 'submitted') ? 'submitted' : 'approved';
  if (st === 'approved') { goTo('project-member-logs-approved'); renderProjectMemberLogs(typeKey, 'approved'); }
  else { goTo('project-member-logs-submitted'); renderProjectMemberLogs(typeKey, 'submitted'); }
}
function renderProjectMemberLogs(logType, status) {
  if (typeof status === 'undefined') { status = logType; logType = 'register-log'; }
  var typeKey = (logType === 'survey-log') ? 'survey-log' : 'register-log';
  var type = (status === 'submitted') ? 'submitted' : 'approved';
  var list_el = document.getElementById(type === 'submitted' ? 'project-member-logs-submitted-list' : 'project-member-logs-approved-list');
  var empty_el = document.getElementById(type === 'submitted' ? 'project-member-logs-submitted-empty' : 'project-member-logs-approved-empty');
  var login = storage.get('login') || window.__login || {};
  var projectMember_cards = ((login['tree-login'] && login['tree-login']['project-member'] && login['tree-login']['project-member'].cards) || {});
  var logs = (projectMember_cards[typeKey] && projectMember_cards[typeKey][type]) || [];
  if (!list_el) return 0;
  if (!logs.length) { list_el.innerHTML = ''; if (empty_el) empty_el.style.display = 'block'; return 0; }
  if (empty_el) empty_el.style.display = 'none';
  var html = '';
  var is_submitted = type === 'submitted' ? true : false;
  var render_logs = logs.slice().sort(function(a,b){ return String(b.loggedAt||'').localeCompare(String(a.loggedAt||'')); });
  for (var i = 0; i < render_logs.length; i++) {
    var entry = render_logs[i]; var tid = entry.treeId || ''; var t = null;
    try { t = storage.pullTreeDetail ? storage.pullTreeDetail(tid) : null; } catch (e) {}
    if (!t) { var d = window.__TREE_DATA || storage.get('treeCards') || []; for (var r = 0; r < d.length; r++) if (d[r].treeId === tid) { t = d[r]; break; } }
    var name = t ? (projectMemberCardName(t) || tid) : tid;
    var addr = t ? projectMemberCardAddr(t) : '';
    var enc = t ? (t['encounters-list'] || {}) : {}; var keys = t ? Object.keys(enc) : []; var last = t ? enc[keys[keys.length - 1]] || {} : {}; var st = last['health-status'] || {};
    var date = entry.loggedAt || ''; var label = date;
    var date_param = date || '';
    var delete_btn = is_submitted ? '<button class="tcard-delete-btn" type="button" onclick="event.stopPropagation(); deleteProjectMemberLog(\'' + tid + '\',\'' + typeKey + '\')"><i class="ti ti-trash"></i></button>' : '';
    var header_html = is_submitted ? '<div class="project-member-log-header"><span class="project-member-log-header-title">' + (typeKey === 'survey-log' ? 'Survey log' : 'Register request') + '</span>' + delete_btn + '</div>' : '';
    html += '<div class="log-entry" style="cursor:pointer;flex-direction:column;align-items:stretch;">' + header_html + '<div style="display:flex;gap:9px;align-items:center;cursor:pointer;" onclick="openProjectMemberReviewPage(\'' + tid + '\',\'' + date_param + '\')"><div class="log-dot" style="background:#16a34a"></div><div class="log-body"><div class="log-date">' + label + '</div><div class="log-text">' + name + ' · ' + tid + '</div><div class="log-addr" style="font-size:0.7333rem;color:var(--color-text-secondary)">' + addr + '</div><div class="log-text">Health: ' + (st.health || '—') + '</div><div class="log-text">Height: ' + formatLength(st.height,'height') + '</div><div class="log-text">Diameter: ' + formatLength(st.diameter,'diameter') + '</div><div class="log-text"><span style="color:#dc2626">Note:</span> ' + ((t && t['encounters-list'] && t['encounters-list'][Object.keys(t['encounters-list'])[0]] && t['encounters-list'][Object.keys(t['encounters-list'])[0]].fieldObservation && t['encounters-list'][Object.keys(t['encounters-list'])[0]].fieldObservation.notes) || '—') + '</div><div class="log-text"><span style="color:#dc2626">Recommendation:</span> ' + ((t && t['encounters-list'] && t['encounters-list'][Object.keys(t['encounters-list'])[0]] && t['encounters-list'][Object.keys(t['encounters-list'])[0]].fieldObservation && t['encounters-list'][Object.keys(t['encounters-list'])[0]].fieldObservation.recommendations) || '—') + '</div><div class="log-text"><span class="chip-blue" onclick="event.stopPropagation();openProjectMemberReviewPage(\'' + tid + '\',\'' + date_param + '\')"><i class="ti ti-eye"></i> Review</span></div></div></div></div>';
  }
  list_el.innerHTML = html;
  return logs.length;
}

function openProjectMemberReviewPage(treeId, loggedAt) {
  var active_el = document.querySelector('.page.active');
  var scroll_el = active_el ? active_el.querySelector('.scrollable') : null;
  var scroll_pos = scroll_el ? scroll_el.scrollTop : 0;
  try { sessionStorage.setItem('hubScrollTop', String(scroll_pos)); } catch (e) {}
  var current_hub = active_el ? active_el.id.replace('page-','') : 'project-member-dash';
  var parent_url = encodeURIComponent('project-member.html?hub=' + current_hub + '&scroll=' + scroll_pos);
  var log_date = loggedAt ? loggedAt : '';
  window.location.href = 'review-page.html?treeId=' + encodeURIComponent(treeId) + '&loggedAt=' + encodeURIComponent(log_date) + '&parent=' + parent_url;
}


function getProjectMemberParentUrl() {
  var parent_url = new URLSearchParams(location.search).get('parent');
  return parent_url ? parent_url : null;
}

var hubMode = new URLSearchParams(location.search).get('hub');
console.log('[project-member] hubMode', hubMode, 'href', location.href);
if (hubMode === 'login') { window.location.href = 'login-hub.html?role=project-member'; }

else if (hubMode === 'project-member-dash') { goTo('project-member-dash'); }
else if (hubMode === 'project-member-waiting') { goTo('project-member-waiting'); }
else if (hubMode === 'project-member-seeing') { goTo('project-member-seeing'); }
else if (hubMode === 'project-member-current') { goTo('project-member-current'); }
else if (hubMode === 'project-member-survey-current') { goTo('project-member-survey-current'); }
else if (hubMode === 'project-member-past') { goTo('project-member-past'); }
else if (hubMode === 'project-member-checks-due') { goTo('project-member-checks-due'); }
else if (hubMode === 'project-member-checks-finished') { goTo('project-member-checks-finished'); }
else if (hubMode === 'project-member-logs-approved') { goTo('project-member-logs-approved'); renderProjectMemberLogs('approved'); }
else if (hubMode === 'project-member-logs-submitted') { goTo('project-member-logs-submitted'); renderProjectMemberLogs('submitted'); }
else if (hubMode === 'project-member-browse') { goTo('project-member-browse'); }
else { console.log('[project-member] unknown hubMode, redirect to login-hub'); window.location.href = 'login-hub.html'; }

