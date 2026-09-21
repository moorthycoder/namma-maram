var TESTING_MODE = true;

var login_role_config = {
  'sponsor':           { title: 'Sponsor login',                     desc: 'Sign in to manage the trees you sponsor.',          file: 'sponsor.html',          dashPage: 'sponsor-dash' },
  'care-giver':        { title: 'Care-giver login',                  desc: 'Sign in to manage the trees you care for.',        file: 'care-giver.html',       dashPage: 'care-giver-dash' },
  'ten-trees-ranger':  { title: 'Ten Tree Ranger login',             desc: 'Sign in to manage the trees in your block.',       file: 'ten-trees-ranger.html', dashPage: 'ten-trees-ranger-dash' },
  'project-leader':    { title: 'Project Leader login',              desc: 'Sign in to manage projects.',                      file: 'project-leader.html',   dashPage: 'project-leader-dash' },
  'project-member':    { title: 'Project member login',              desc: 'Sign in to manage the trees you grow.',            file: 'project-member.html',   dashPage: 'project-member-dash' },
  'ranger':            { title: 'Ranger login',                      desc: 'Sign in to log field data.',                       file: 'ranger.html',           dashPage: 'ranger-dash' },
  'surveyor':          { title: 'Surveyor login',                    desc: 'Sign in to survey field data.',                    file: 'surveyor.html',         dashPage: 'surveyor-dash' },
  'admin':             { title: 'App Admin login',                   desc: 'Sign in for system management.',                   file: 'admin.html',            dashPage: 'admin-dash' }
};

var current_login_role = '';

function getUserCredentialsByRole(role, phone) {
  var login_data = null;
  try { login_data = (window.storage && storage.get('login')) || window.__login || null; } catch (e) {}
  if (!login_data) { return null; }
  var tl = login_data['tree-login'] || {};
  var cred = tl[role] || null;
  if (!cred) { return null; }
  if (phone && cred.phone && stringifyPhone(cred.phone) !== stringifyPhone(phone)) { return null; }
  return cred;
}

function getRoleByPhone(phone) {
  var login_data = null;
  try { login_data = (window.storage && storage.get('login')) || window.__login || null; } catch (e) {}
  if (!login_data) { return null; }
  var tl = login_data['tree-login'] || {};
  var normalized = stringifyPhone(phone);
  for (var key in tl) {
    if (tl[key] && tl[key].phone && stringifyPhone(tl[key].phone) === normalized) { return key; }
  }
  return null;
}

function stringifyPhone(p) { return String(p || '').replace(/\D/g, ''); }

function goTo(page) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  window.scrollTo(0, 0);
}

function navigateToLoginPage(role) {
  if (role === 'admin') {
    window.location.href = 'admin.html?hub=login';
    return;
  }
  var cfg = login_role_config[role];
  if (!cfg) return;
  current_login_role = role;
  document.getElementById('login-role-title').textContent = cfg.title;
  document.getElementById('login-role-desc').textContent = cfg.desc;
  var mobile_inp = document.querySelector('#page-role-login .login-mobile-inp');
  if (mobile_inp) { mobile_inp.value = ''; mobile_inp.classList.remove('field-error'); }
  var send_btn = document.getElementById('login-send-btn');
  if (send_btn) send_btn.disabled = true;
  if (TESTING_MODE) {
    var cred = getUserCredentialsByRole(role);
    if (cred && cred.phone && mobile_inp) {
      mobile_inp.value = stringifyPhone(cred.phone);
      mobile_inp.classList.remove('field-error');
      if (send_btn) send_btn.disabled = false;
    }
  }
  history.pushState({}, '', 'login-hub.html?role=' + encodeURIComponent(role));
  goTo('role-login');
}

function initializeLoginHubNavigation() {
  var tiles = document.querySelectorAll('.hub-grid .hub-tile');
  tiles.forEach(function (tile) {
    if (tile.classList.contains('disabled') || tile.classList.contains('empty')) return;
    var role = tile.getAttribute('data-role');
    if (role) {
      tile.addEventListener('click', function () { navigateToLoginPage(role); });
    }
  });
  var send_btn = document.getElementById('login-send-btn');
  var mobile_inp = document.querySelector('#page-role-login .login-mobile-inp');
  if (mobile_inp && send_btn) {
    mobile_inp.addEventListener('input', function () {
      var v = mobile_inp.value.replace(/\D/g, '');
      send_btn.disabled = !(v.length === 10 && v.charAt(0) >= '6');
      if (!send_btn.disabled) mobile_inp.classList.remove('field-error');
    });
  }
  var confirm_btn = document.getElementById('otp-confirm-btn');
  var otp_inp = document.getElementById('otp-input');
  if (otp_inp && confirm_btn) {
    otp_inp.addEventListener('input', function () {
      confirm_btn.disabled = otp_inp.value.replace(/\D/g, '').length !== 6;
    });
  }
  var url_role = new URLSearchParams(window.location.search).get('role');
  if (url_role && (url_role === 'admin' || login_role_config[url_role])) navigateToLoginPage(url_role);
}

document.addEventListener('DOMContentLoaded', initializeLoginHubNavigation);

var otp_value = '';
var otp_seconds = 60;
var otp_timer_handle = null;

function sendOtp() {
  var inp = document.querySelector('#page-role-login .login-mobile-inp');
  if (!inp) return;
  var mobile = inp.value.replace(/\D/g, '');
  if (mobile.length !== 10 || mobile.charAt(0) < '6') {
    inp.classList.add('field-error');
    return;
  }
  inp.classList.remove('field-error');
  otp_value = Math.floor(100000 + Math.random() * 900000).toString();
  otp_seconds = 60;
  document.getElementById('otp-code').textContent = otp_value;
  document.getElementById('otp-sent-to').textContent = 'A one-time password was sent to +91 ' + mobile;
  var timer = document.getElementById('otp-timer');
  timer.textContent = '1:00';
  timer.classList.remove('expired');
  if (TESTING_MODE) {
    document.getElementById('otp-input').value = otp_value;
    document.getElementById('otp-confirm-btn').disabled = false;
  } else {
    document.getElementById('otp-input').value = '';
    document.getElementById('otp-confirm-btn').disabled = true;
  }
  var test = document.getElementById('otp-testing');
  if (test) { TESTING_MODE ? test.classList.add('show') : test.classList.remove('show'); }
  document.getElementById('otp-modal').classList.add('open');
  if (otp_timer_handle) window.clearInterval(otp_timer_handle);
  otp_timer_handle = window.setInterval(updateOtpTimer, 1000);
}

function updateOtpTimer() {
  otp_seconds--;
  if (otp_seconds <= 0) {
    otp_seconds = 0;
    window.clearInterval(otp_timer_handle);
    otp_timer_handle = null;
    var t = document.getElementById('otp-timer');
    t.textContent = 'Expired · request a new OTP';
    t.classList.add('expired');
    return;
  }
  var mins = Math.floor(otp_seconds / 60);
  var secs = otp_seconds % 60;
  document.getElementById('otp-timer').textContent = mins + ':' + (secs < 10 ? '0' : '') + secs;
}

function verifyOtp() {
  var typed = document.getElementById('otp-input').value.replace(/\D/g, '');
  if (!otp_timer_handle || typed !== otp_value) {
    document.getElementById('otp-modal').classList.remove('open');
    document.getElementById('otp-error-title').textContent = 'Incorrect OTP';
    document.getElementById('otp-error-text').textContent = 'The code you entered does not match. Please re-type the OTP.';
    document.getElementById('otp-error-modal').classList.add('open');
    return;
  }
  window.clearInterval(otp_timer_handle);
  otp_timer_handle = null;
  var mobile_inp = document.querySelector('#page-role-login .login-mobile-inp');
  var phone = mobile_inp ? mobile_inp.value : '';
  var cred = getUserCredentialsByRole(current_login_role, phone);
  if (!cred) {
    document.getElementById('otp-modal').classList.remove('open');
    document.getElementById('otp-error-title').textContent = 'Number not registered';
    document.getElementById('otp-error-text').textContent = 'No account found for this mobile number. Please try another number.';
    document.getElementById('otp-error-modal').classList.add('open');
    return;
  }
  cred.loggedIn = true;
  try {
    if (window.storage) {
      var login_data = storage.get('login') || {};
      if (login_data && login_data['tree-login']) { login_data['tree-login'][current_login_role] = cred; storage.set('login', login_data); }
    }
  } catch (e) {}
  document.getElementById('otp-modal').classList.remove('open');
  var cfg = login_role_config[current_login_role] || {};
  var role_key = current_login_role;
  window.location.href = (cfg.file || 'index.html') + '?hub=' + (cred.dashPage || cfg.dashPage || 'dash') + '&userid=' + encodeURIComponent(cred.userId);
}

function retypeOtp() {
  document.getElementById('otp-error-modal').classList.remove('open');
  var inp = document.getElementById('otp-input');
  inp.value = '';
  document.getElementById('otp-confirm-btn').disabled = true;
  document.getElementById('otp-modal').classList.add('open');
  inp.focus();
}