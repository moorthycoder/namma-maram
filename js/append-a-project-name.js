// append-a-project-name.js — standalone flow injected into #screen. Reads projects from storage and appends new project names.

var appendProjectNameCSS = "\n\
  .app-name-lbl{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}\n\
  .app-name-script{font-size:0.8rem;color:var(--color-text-secondary);}\n\
  .success-top{background:var(--color-theme-light);padding:24px 20px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;}\n\
  .check-ring{width:58px;height:58px;border-radius:50%;background:var(--color-theme);display:flex;align-items:center;justify-content:center;animation:popIn 0.5s ease forwards;}\n\
  @keyframes popIn{0%{transform:scale(0.4);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}\n\
  .flow-scroll{padding:12px 13px;display:flex;flex-direction:column;gap:10px;min-height:auto;}\n\
  .flow-footer{padding:12px 13px;background:var(--color-background-primary);border-top:0.5px solid var(--color-border-tertiary);flex-shrink:0;}\n\
";

function injectAppendProjectCSS() {
  if (document.getElementById('append-project-name-css')) { return; }
  var style = document.createElement('style');
  style.id = 'append-project-name-css';
  style.textContent = appendProjectNameCSS;
  document.head.appendChild(style);
}

function appendProjectName(project) {
  var project_name = {};
  var en_name = '';
  Object.keys(project.names || {}).forEach(function (lang) {
    var vals = project.names[lang] || [];
    var str = vals.map(function (v) { return String(v).trim(); }).filter(function (v) { return v; }).join(', ');
    project_name[lang] = str;
    if (lang === 'en' && !en_name) en_name = str;
  });
  var entry = {
    projectId: String(project.projectId || '').trim() || en_name,
    startedAt: String(project.startedAt || '').trim(),
    endedAt: String(project.endedAt || '').trim(),
    projectName: project_name
  };
  var db = storage.get('projects') || [];
  var match_i = -1;
  for (var di = 0; di < db.length; di++) {
    if (String(db[di].projectId).toLowerCase() === String(entry.projectId).toLowerCase()) { match_i = di; break; }
  }
  if (match_i === -1) { db.push(entry); }
  else { db[match_i].projectName = project_name; db[match_i].startedAt = entry.startedAt; db[match_i].endedAt = entry.endedAt; }
  storage.commit('projects', db);
  return entry;
}

var appendProjectNamePlaceholders = {
  en: 'Green TN 2026',
  ta: 'பசுமை TN 2026',
  te: 'గ్రీన్ TN 2026',
  kn: 'ಗ್ರೀನ್ TN 2026',
  ml: 'ഗ്രീൻ TN 2026',
  mr: 'ग्रीन TN 2026',
  or: 'ସବୁଜ TN 2026',
  as: 'সেউজী TN 2026',
  bn: 'সবুজ TN 2026',
  hi: 'ग्रीन TN 2026',
  ne: 'हरित TN 2026',
  si: 'ග්‍රීන් TN 2026',
  kok: 'ग्रीन TN 2026',
  tcy: 'ಗ್ರೀನ್ TN 2026'
};

var appendProjectPages = "\n\
<div class=\"page\" id=\"page-append-project-name\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Append project name</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Append a project name to the database</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">Add a new project with its name, start and end. It will be available across the app.</div>\n\
    <div class=\"field-wrap\"><div class=\"field-label\"><i class=\"ti ti-calendar-event\" style=\"font-size:0.8667rem\"></i> Started at</div><input id=\"app-project-startedat\" class=\"field-input\" type=\"date\" /></div>\n\
    <div class=\"field-wrap\"><div class=\"field-label\"><i class=\"ti ti-calendar-minus\" style=\"font-size:0.8667rem\"></i> Ended at</div><input id=\"app-project-endedat\" class=\"field-input\" type=\"date\" /></div>\n\
    <div class=\"field-wrap\"><div class=\"field-label\"><i class=\"ti ti-hash\" style=\"font-size:0.8667rem\"></i> Project ID</div><input id=\"app-project-projectid\" class=\"field-input\" type=\"text\" placeholder=\"e.g. Green TN 2026\" /></div>\n\
    <div id=\"app-project-name-fields\"></div>\n\
  </div>\n\
  <div class=\"flow-footer\"><button class=\"green-btn\" onclick=\"appendProjectNameToDatabase()\"><i class=\"ti ti-database-plus\" style=\"font-size:0.9333rem\"></i> Append to database</button></div>\n\
</div>\n\
<div class=\"page\" id=\"page-append-project-success\">\n\
  <div class=\"success-top\">\n\
    <div class=\"check-ring\"><i class=\"ti ti-check\" style=\"font-size:1.8667rem;color:var(--color-theme-light)\"></i></div>\n\
    <div style=\"font-size:1.1333rem;font-weight:500;color:#27500A;\">Project name added!</div>\n\
    <div style=\"font-size:0.8rem;color:#3B6D11;text-align:center;line-height:1.5;\">The project name has been appended to the database.</div>\n\
  </div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <button class=\"green-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-list\"></i> Back to list</button>\n\
  </div>\n\
</div>\n";

function buildAppendProjectFields() {
  var wrap = document.getElementById('app-project-name-fields');
  if (!wrap) { return; }
  var langs = (storage.get('languages') || []).filter(function(l){ return l.code !== 'sn'; }).slice().sort(function (a, b) {
    if (a.code === 'en') { return -1; }
    if (b.code === 'en') { return 1; }
    return a.name.localeCompare(b.name);
  });
  wrap.innerHTML = langs.map(function (l) {
    return '<div class="field-wrap app-name-group" data-lang="' + l.code + '">' +
      '<div class="field-label app-name-lbl"><i class="ti ti-language" style="font-size:0.8667rem"></i> ' + l.name + ' <span class="app-name-script">' + l.script + '</span></div>' +
      '<input class="field-input app-name-inp" type="text" placeholder="' + (appendProjectNamePlaceholders[l.code] || ('Type in ' + l.name)) + '" />' +
    '</div>';
  }).join('');
}

function appendProjectNameToDatabase() {
  var names = {};
  document.querySelectorAll('.app-name-group').forEach(function (g) {
    var vals = [];
    g.querySelectorAll('.app-name-inp').forEach(function (i) { if (i.value.trim()) { vals.push(i.value.trim()); } });
    names[g.getAttribute('data-lang')] = vals;
  });
  var payload = {
    projectId: document.getElementById('app-project-projectid').value,
    startedAt: document.getElementById('app-project-startedat').value,
    endedAt: document.getElementById('app-project-endedat').value,
    names: names
  };
  console.log(payload);
  appendProjectName(payload);
  try {
    var login = null;
    try { login = JSON.parse(sessionStorage.getItem('loginCredentialsV1') || '{}'); } catch (e) {}
    login = login || {};
    login['tree-login'] = login['tree-login'] || {};
    login['tree-login']['project-leader'] = login['tree-login']['project-leader'] || {};
    login['tree-login']['project-leader'].stats = login['tree-login']['project-leader'].stats || {};
    var project_name_stats = login['tree-login']['project-leader'].stats['project-name'] || {};
    var current_time = new Date();
    var pad_number = function(n) { return String(n).padStart(2, '0'); };
    var recorded_entry = {
      projectId: payload.projectId || '',
      startedAt: payload.startedAt || '',
      endedAt: payload.endedAt || '',
      names: payload.names || {},
      revisedAt: '' + current_time.getFullYear() + pad_number(current_time.getMonth() + 1) + pad_number(current_time.getDate()) + 'T' + pad_number(current_time.getHours()) + pad_number(current_time.getMinutes()) + pad_number(current_time.getSeconds()),
      status: 'submitted',
      updatedBy: login['tree-login']['project-leader'].userId || 'PLD2612345678'
    };
    project_name_stats.submitted = project_name_stats.submitted || [];
    project_name_stats.submitted.push(recorded_entry);
    login['tree-login']['project-leader'].stats['project-name'] = project_name_stats;
    try { sessionStorage.setItem('loginCredentialsV1', JSON.stringify(login)); } catch (e) {}
    try { if (window.parent && window.parent !== window && window.parent._login) window.parent._login = login; window._login = login; if (typeof storage !== 'undefined' && storage.set) storage.set('login', login); } catch (e) {}
  } catch (e) {}
  goTo('append-project-success');
}

function injectAppendProjectFlow() {
  var existing = document.getElementById('page-append-project-name');
  if (!existing) {
    var screen = document.querySelector('.screen');
    if (screen) screen.insertAdjacentHTML('beforeend', appendProjectPages);
    buildAppendProjectFields();
  }
}
injectAppendProjectCSS();
injectAppendProjectFlow();

// --- standalone append-a-project-name.html support ---
(function(){
  if (location.pathname.indexOf('append-a-project-name.html') === -1) return;
  var parentUrl = new URLSearchParams(location.search).get('parent') || 'test-bed-3.html';
  window.roleDash = function(){ return parentUrl; };
  window.appendProjectGoTo = function(page){
    if (page && /\.html/.test(page)) {
      try { if (window.parent && window.parent !== window && typeof window.parent.backToStart === 'function') { window.parent.backToStart(); return; } } catch(e){}
      var p=new URLSearchParams(location.search).get('parent');
      if(p){ window.location.href=decodeURIComponent(p); return; }
      window.location.href=page; return;
    }
    document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
    var el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');
  };
  window.goTo = window.appendProjectGoTo;
  window.render = { init: function () { buildAppendProjectFields(); } };
  window.goTo('append-project-name');
})();