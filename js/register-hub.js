var TESTING_MODE = true;

var enroll_role_config = {
  'sponsor':           { title: 'Become a sponsor',           desc: 'Support tree maintenance through monthly contributions. Choose a tree to sponsor.' },
  'care-giver':        { title: 'Become a care-giver',        desc: 'Adopt and look after registered trees in your neighbourhood. Your application will be reviewed by the admin.' },
  'ten-trees-ranger':  { title: 'Become a Ten Tree Ranger',   desc: 'Adopt and look after registered trees in your neighbourhood. Your application will be reviewed by the admin.' },
  'project-leader':    { title: 'Become a project leader',    desc: 'Fill in your details to apply as a project leader. Your application will be reviewed by the admin.' },
  'project-member':    { title: 'Become a project member',    desc: 'Adopt and look after registered trees in your neighbourhood. Your application will be reviewed by the admin.' },
  'ranger':            { title: 'Become a field ranger',      desc: 'Fill in your details to apply as a field ranger. Your application will be reviewed by the admin.' },
  'surveyor':          { title: 'Become a field surveyor',    desc: 'Fill in your details to apply as a field surveyor. Your application will be reviewed by the admin.' }
};

var current_enroll_role = '';

function navigateToRegisterPage(role) {
  var cfg = enroll_role_config[role];
  if (!cfg) return;
  current_enroll_role = role;
  document.getElementById('enroll-role-title').textContent = cfg.title;
  document.getElementById('enroll-role-desc').textContent = cfg.desc;
  var mobile_inp = document.querySelector('#page-role-enroll .enroll-mobile-inp');
  if (mobile_inp) { mobile_inp.value = ''; mobile_inp.classList.remove('field-error'); }
  var send_btn = document.getElementById('otp-send-btn');
  if (send_btn) send_btn.disabled = true;
  history.pushState({}, '', 'register-hub.html?role=' + encodeURIComponent(role));
  goTo('role-enroll');
}

var registerStatusData = {
  waiting:          { icon: 'ti ti-clock',      color: '#f59e0b', bg: '#fef3c7', title: 'Application under review', text: 'Your registration is waiting for admin approval. We will notify you once it is reviewed.', go: 'Login' },
  existing_member:  { icon: 'ti ti-user-check', color: '#16a34a', bg: '#dcfce7', title: 'Already registered',       text: 'An account with this email already exists. Please log in instead of registering again.', go: 'Login', to: 'login-hub.html' },
  blocked:          { icon: 'ti ti-ban',        color: '#dc2626', bg: '#fee2e2', title: 'Registration blocked',      text: 'Your registration has been blocked. Please contact support if you think this is a mistake.', go: 'Contact us' }
};

var regTarget = 'register-hub';

function goTo(page) {
  document.querySelectorAll('.page').forEach(function (p) { p.classList.remove('active'); });
  var target = document.getElementById('page-' + page);
  if (target) target.classList.add('active');
  var sb = document.getElementById('sbar');
  if (sb) sb.className = 'status-bar dark';
  window.scrollTo(0, 0);
}

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
  if (go) {
    if (regTarget.indexOf('.html') > -1) { window.location.href = regTarget; }
    else { goTo(regTarget); }
  }
}

function initializeRegisterHubNavigation() {
  var tiles = document.querySelectorAll('.hub-grid .hub-tile');
  tiles.forEach(function (tile) {
    if (tile.classList.contains('disabled') || tile.classList.contains('empty')) return;
    var role = tile.getAttribute('data-role');
    if (role) {
      tile.addEventListener('click', function () { navigateToRegisterPage(role); });
    }
  });
  var send_btn = document.getElementById('otp-send-btn');
  var mobile_inp = document.querySelector('#page-role-enroll .enroll-mobile-inp');
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
  if (url_role && enroll_role_config[url_role]) navigateToRegisterPage(url_role);
}

document.addEventListener('DOMContentLoaded', initializeRegisterHubNavigation);

var otp_value = '';
var otp_seconds = 60;
var otp_timer_handle = null;

function sendOtp() {
  var inp = document.querySelector('#page-role-enroll .enroll-mobile-inp');
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
  document.getElementById('otp-input').value = '';
  document.getElementById('otp-confirm-btn').disabled = true;
  var test = document.getElementById('otp-testing');
  if (test) test.style.display = TESTING_MODE ? 'block' : 'none';
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
  if (otp_timer_handle && typed === otp_value) {
    window.clearInterval(otp_timer_handle);
    otp_timer_handle = null;
    document.getElementById('otp-modal').classList.remove('open');
    document.getElementById('otp-thankyou-modal').classList.add('open');
  } else {
    document.getElementById('otp-modal').classList.remove('open');
    document.getElementById('otp-error-modal').classList.add('open');
  }
}

function retypeOtp() {
  document.getElementById('otp-error-modal').classList.remove('open');
  var inp = document.getElementById('otp-input');
  inp.value = '';
  document.getElementById('otp-confirm-btn').disabled = true;
  document.getElementById('otp-modal').classList.add('open');
  inp.focus();
}

function closeThankyou() {
  document.getElementById('otp-thankyou-modal').classList.remove('open');
  goTo('register-hub');
}