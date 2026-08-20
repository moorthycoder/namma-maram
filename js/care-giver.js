
var TESTING_MODE = true;
var profileFrom = 'main';
var albumFrom = 'tree-profile';
var treeLogsFrom = 'trees';
var sponsoredCount = 2;
var max_register_care_giver = 5;
var logoutTarget = 'caregiver-dash';

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
    var currentEl = document.getElementById('caregiver-current-count');
    var pastEl = document.getElementById('caregiver-past-count');
    if (currentEl && role.cards) currentEl.textContent = (role.cards.current || []).length;
    if (pastEl && role.cards) pastEl.textContent = (role.cards.past || []).length;
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
  existing_member:  { icon:'ti ti-user-check',  color:'#16a34a', bg:'#dcfce7', title:'Already registered',        text:'An account with this email already exists. Please log in instead of registering again.', go:'Login', to:'caregiver-login' },
  blocked:          { icon:'ti ti-ban',         color:'#dc2626', bg:'#fee2e2', title:'Registration blocked',       text:'Your registration has been blocked. Please contact support if you think this is a mistake.', go:'Contact us', to:'caregiver-login' },
  limit:            { icon:'ti ti-circle-x',    color:'#dc2626', bg:'#fee2e2', title:'Limit reached',              text:'Your limit reached. Kindly contact your ten tree ranger.' }
};

// Register status modal — waiting / existing_member / blocked
var regTarget = 'caregiver-dash';

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








function toggleCLogoutDrop() {
  document.getElementById('clogout-drop').classList.toggle('open');
}




// Navigation

function goTo(page) {
  if (page === 'tree-logs') {
    var activePage = document.querySelector('.page.active');
    if (activePage) {
      var fromPage = activePage.id.replace('page-', '');
      if (fromPage !== 'album' && fromPage !== 'tree-profile') {
        treeLogsFrom = fromPage;
      }
    }
  }
  
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('page-'+page).classList.add('active');
  var sb = document.getElementById('sbar');
  sb.className = 'status-bar';
  if (['caregiver-login','caregiver-enroll','append-tree-name','register-tree','register-form'].indexOf(page) > -1) sb.classList.add('dark');
  else if (['caregiver-login','caregiver-dash','caregiver-current','caregiver-past','caregiver-waiting','caregiver-checks-due','caregiver-checks-finished'].indexOf(page) > -1) sb.classList.add('blue');
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


// Open tree profile

function openTreeProfile(treeId) {
  var from = document.querySelector('.page.active').id.replace('page-','');
  treeProfileFrom = from;
  var id = treeId || '625501-06-0001';
  document.getElementById('tree-profile-id-label').textContent = id;
  goTo('tree-profile');
}


function treeProfileBack() { goTo(treeProfileFrom); }

function openProfile(treeId) { openTreeProfile(treeId); }


// Open the map pinned to the tree currently shown in the tree profile

function openTreeMap() {
  var id = document.getElementById('tree-profile-id-label').textContent;
  var tree = null;
  var data = window.__TREE_DATA || [];
  for (var i = 0; i < data.length; i++) {
    if (data[i].treeId === id) { tree = data[i]; break; }
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


// Care-giver add tree — capped at 4 cards

function toggleTreeCard(btn) {
  var card = btn.closest('.tcard');
  if (!card) return;
  var coll = card.querySelector('.tcard-collapse');
  var ic = btn.querySelector('i');
  var open = coll.style.display === 'block';
  coll.style.display = open ? 'none' : 'block';
  ic.className = open ? 'ti ti-chevron-down' : 'ti ti-chevron-up';
}

function registerAndAdoptATree() {
  var reg = registerATree();
  var waitingCards = document.getElementById('register-waiting-cards');
  if (waitingCards.querySelectorAll('.tree-card-sponsor').length >= max_register_care_giver) {
    showRegisterStatus('limit');
    return;
  }
  appendWaitingTreeCard(reg, 'register');
}

function careATree(form) {
  var waitingCards = document.getElementById('care-waiting-cards');
  if (waitingCards.querySelectorAll('.tree-card-sponsor').length >= max_register_care_giver) {
    showRegisterStatus('limit');
    return;
  }
  if (form.btn) {
    form.btn.classList.add('added');
    form.btn.innerHTML = '<i class="ti ti-check"></i>';
    form.btn.onclick = null;
  }
  appendWaitingTreeCard(form, 'care');
}


function setStatById(idValue, statValue) {
  var matchingElements = document.querySelectorAll('[id="' + idValue + '"]');
  for (var index = 0; index < matchingElements.length; index++) { matchingElements[index].textContent = statValue; }
}
function refreshTreesInCareCount() {
  var cardsEl = document.getElementById('caregiver-cards');
  var count = cardsEl ? cardsEl.querySelectorAll('.tree-card-sponsor').length : 0;
  setStatById('c-tree-current', count);
  setStatById('caregiver-current-count', count);
}
function openWaitingRequests(requestType) {
  var isCare = requestType === 'care';
  var careSection = document.getElementById('care-waiting-section');
  var registerSection = document.getElementById('register-waiting-section');
  if (careSection) careSection.style.display = isCare ? 'block' : 'none';
  if (registerSection) registerSection.style.display = isCare ? 'none' : 'block';
  var titleEl = document.getElementById('waiting-page-title');
  if (titleEl) titleEl.textContent = isCare ? 'Care request' : 'Register request';
  var role = (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
  var ids = (role.cards || {}).waiting || [];
  var data = window.__TREE_DATA || [];
  var requestList = ids.length ? data.filter(function (t) { return ids.indexOf(t.treeId) > -1; }) : [];
  var cardsId = isCare ? 'care-waiting-cards' : 'register-waiting-cards';
  var emptyId = isCare ? 'care-waiting-empty' : 'register-waiting-empty';
  var cardsEl = document.getElementById(cardsId);
  var emptyEl = document.getElementById(emptyId);
  if (cardsEl) cardsEl.innerHTML = requestList.map(function (t) { return treeCardHtml(t, window.TREE_CFG); }).join('');
  if (emptyEl) emptyEl.style.display = requestList.length ? 'none' : 'block';
  goTo('caregiver-waiting');
}
function appendWaitingTreeCard(form, requestType) {
  var isCare = requestType === 'care';
  var careSection = document.getElementById('care-waiting-section');
  var registerSection = document.getElementById('register-waiting-section');
  if (careSection) careSection.style.display = isCare ? 'block' : 'none';
  if (registerSection) registerSection.style.display = isCare ? 'none' : 'block';
  var titleEl = document.getElementById('waiting-page-title');
  if (titleEl) titleEl.textContent = isCare ? 'Care request' : 'Register request';
  var waitingCards = document.getElementById(isCare ? 'care-waiting-cards' : 'register-waiting-cards');
  var emptyEl = document.getElementById(isCare ? 'care-waiting-empty' : 'register-waiting-empty');
  if (emptyEl) emptyEl.style.display = 'none';
  var id = form.treeId || '';
  var loc = form.address || '';
  var height = form.height !== undefined ? form.height : 0;
  var diam = form.diam || '—';
  var logs = form.logs !== undefined ? form.logs : 0;
  var card = document.createElement('div');
  card.className = 'tree-card-sponsor tcard';
  card.style.opacity = '0';
  card.innerHTML = '<div class="tcard-head"><div class="tcard-row"><span class="tcard-id">'+form.emoji+' '+id+'</span><button class="tcard-toggle" type="button" onclick="toggleTreeCard(this)"><i class="ti ti-chevron-down"></i></button></div><div class="tcard-addr"><i class="ti ti-map-pin" style="font-size:0.6667rem"></i> '+loc+'</div></div><div class="tcard-collapse" style="display:none;"><div class="tcard-img" style="background:'+form.bg+';">'+form.emoji+'</div><div class="tcard-latest"><i class="ti ti-timeline" style="font-size:0.7333rem;flex-shrink:0"></i><span>Latest encounter \u2014 Today \u2014 You</span></div><div class="tcard-stats"><div class="tcard-stat"><div class="tcard-stat-lbl">Height</div><div class="tcard-stat-val">'+height+'m</div></div><div class="tcard-stat"><div class="tcard-stat-lbl">Diameter</div><div class="tcard-stat-val">'+diam+'</div></div><div class="tcard-stat"><div class="tcard-stat-lbl">Logs</div><div class="tcard-stat-val">'+logs+'</div></div></div><div class="tcard-status"><div class="status-dot" style="background:#f59e0b"></div><div class="status-txt">Waiting approval</div></div><div class="tcard-todo"><i class="ti ti-clipboard-check" style="font-size:0.7333rem;flex-shrink:0"></i><span>To do \u2014 Waiting for admin approval.</span></div><div class="tcard-btns"><button class="tcbtn tcbtn-logs" onclick="goTo(\'tree-logs\')"><i class="ti ti-list" style="font-size:0.8667rem"></i> View logs</button></button></div></div>';
  waitingCards.appendChild(card);
  requestAnimationFrame(function(){ card.style.transition = 'opacity .3s'; card.style.opacity = '1'; });
  setStatById(isCare ? 'c-care-waiting' : 'c-register-waiting', waitingCards.querySelectorAll('.tree-card-sponsor').length);
  var login = window._login || (window._login = {});
  var tl = login['tree-login'] || (login['tree-login'] = {});
  var role = tl.caregiver || (tl.caregiver = {});
  var roleCards = role.cards || (role.cards = {});
  var waiting = roleCards.waiting || (roleCards.waiting = []);
  if (id && waiting.indexOf(id) === -1) { waiting.push(id); }
  storage.set('login', login);
  if (window.render && typeof window.render.init === 'function') { window.render.init(); }
  setTimeout(function(){ goTo('caregiver-waiting'); }, 500);
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
  if (btn2Type === 'tree-profile') {
    btn2 = cfg.btn2GoTo ? '<button class="tcbtn tcbtn-pay" onclick="goTo(' + q + 'tree-profile' + q + ')"><i class="ti ti-leaf" style="font-size:0.8667rem"></i> Tree profile</button>'
                       : '<button class="tcbtn tcbtn-pay" onclick="openTreeProfile(' + q + t.treeId + q + ')"><i class="ti ti-leaf" style="font-size:0.8667rem"></i> Tree profile</button>';
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

window.TREE_CFG = { verb: 'checked', showLatest: true, showTodo: true, btn2: null, addrMode: 'full' };

window.render = {
  init: function () {
    var data = storage.get('treeCards') || [];
    window.__TREE_DATA = data;
    var role = (window._login && window._login['tree-login'] && window._login['tree-login']['caregiver']) || {};
    var cards = role.cards || {};
    var currentIds = cards.current || [];
    var pastIds = cards.past || [];
    var byIds = function (ids) {
      return data.filter(function (t) { return ids.indexOf(t.treeId) > -1; });
    };
    var currentList = currentIds.length ? byIds(currentIds) : data.filter(function (t) { return t.roles && t.roles.indexOf('caregiver') > -1; });
    var pastList = pastIds.length ? byIds(pastIds) : data.filter(function (t) { return t.roles && t.roles.indexOf('caregiver-past') > -1; });
    document.getElementById('caregiver-cards').innerHTML = currentList.map(function (t) { return treeCardHtml(t, window.TREE_CFG); }).join('');
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
    var currentYearMonth = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).replace(/^(\d)$/, '0$1');
    var todayStr = nowDate.getFullYear() + '-' + String(nowDate.getMonth() + 1).replace(/^(\d)$/, '0$1') + '-' + String(nowDate.getDate()).replace(/^(\d)$/, '0$1');
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
    var finishedTrees = [];
    var dueTrees = [];
    currentList.forEach(function (t) {
      var stat = dueStatDecider(t);
      if (stat === 'finished') { finishedTrees.push(t); }
      else if (stat === 'due') { dueTrees.push(t); }
    });
    var checksCardsEl = document.getElementById('caregiver-checks-cards');
    if (checksCardsEl) {
      checksCardsEl.innerHTML = finishedTrees.map(function (t) { return treeCardHtml(t, window.TREE_CFG); }).join('');
      var checksEmptyEl = document.getElementById('caregiver-checks-empty');
      if (checksEmptyEl) checksEmptyEl.style.display = finishedTrees.length ? 'none' : 'block';
    }
    var checksDueEl = document.getElementById('caregiver-checks-due-cards');
    if (checksDueEl) {
      checksDueEl.innerHTML = dueTrees.map(function (t) { return treeCardHtml(t, window.TREE_CFG); }).join('');
      var checksDueEmptyEl = document.getElementById('caregiver-checks-due-empty');
      if (checksDueEmptyEl) checksDueEmptyEl.style.display = dueTrees.length ? 'none' : 'block';
    }
    encounterDates.sort();
    var latestDate = encounterDates.length ? new Date(encounterDates[encounterDates.length - 1]) : null;
    var nextCheckLabel = '—';
    if (latestDate) {
      latestDate.setDate(latestDate.getDate() + 90);
      nextCheckLabel = latestDate.getDate() + ' ' + monthNames[latestDate.getMonth()];
    }
    setStatById('c-monthly', finishedTrees.length);
    setStatById('c-checks-due', dueTrees.length);
    setStatById('c-next', nextCheckLabel);
    setStatById('c-care-waiting', cards.waiting.length);
    setStatById('c-register-waiting', cards.waiting.length);
    setStatById('caregiver-past-count', pastList.length);
    setStatById('c-tree-past', pastList.length);
    refreshTreesInCareCount();
    document.getElementById('caregiver-past-cards').innerHTML = pastList.map(function (t) { return treeCardHtml(t, { verb: 'checked', showLatest: true, showTodo: false, btn2: null, addrMode: 'short' }); }).join('');
    var browseEl = document.getElementById('caregiver-browse-cards');
    if (browseEl) {
      var q = String.fromCharCode(39);
      var taken = currentIds.concat(pastIds, cards.waiting || []);
      browseEl.innerHTML = data.filter(function (t) { return taken.indexOf(t.treeId) === -1; }).map(function (t) {
        var enc = t['encounters-list'] || {};
        var keys = Object.keys(enc);
        var last = enc[keys[keys.length - 1]] || {};
        var st = last['health-status'] || {};
        var loc = t.address ? t.address.split(', ')[0] : '';
        var height = parseFloat(st.height) || 0;
        var diam = st.diameter || '—';
        var logs = keys.length || t.encounters || 0;
        return '<div class="browse-card">' +
          '<div class="browse-card-thumb" style="background:' + t.bg + ';">' + t.emoji + '</div>' +
          '<div class="browse-card-body"><div class="browse-card-id">' + t.treeId + '</div><div class="browse-card-name">' + t.englishName + '</div><div class="browse-card-loc"><i class="ti ti-map-pin" style="font-size:0.6667rem"></i>' + loc + '</div></div>' +
          '<button class="add-btn" id="cg-add-' + t.treeId + '" onclick="var f={btn:this,treeId:' + q + t.treeId + q + ',englishName:' + q + t.englishName + q + ',address:' + q + loc + q + ',bg:' + q + t.bg + q + ',emoji:' + q + t.emoji + q + ',height:' + height + ',diam:' + q + diam + q + ',logs:' + logs + '};careATree(f)"><i class="ti ti-plus"></i></button>' +
          '</div>';
      }).join('');
    }
  }
};

var hubMode = new URLSearchParams(location.search).get('hub');
if (hubMode === 'login') { goTo('caregiver-login'); }
else if (hubMode === 'register') { goTo('caregiver-enroll'); }

