// append-a-place-name.js — standalone flow injected into #screen. Reads places from storage and appends new place names.

var appendPlaceNameCSS = "\n\
  .app-name-lbl{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}\n\
  .app-name-script{font-size:0.8rem;color:var(--color-text-secondary);}\n\
  .success-top{background:var(--color-theme-light);padding:24px 20px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;}\n\
  .check-ring{width:58px;height:58px;border-radius:50%;background:var(--color-theme);display:flex;align-items:center;justify-content:center;animation:popIn 0.5s ease forwards;}\n\
  @keyframes popIn{0%{transform:scale(0.4);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}\n\
  .flow-scroll{padding:12px 13px;display:flex;flex-direction:column;gap:10px;min-height:auto;}\n\
  .flow-footer{padding:12px 13px;background:var(--color-background-primary);border-top:0.5px solid var(--color-border-tertiary);flex-shrink:0;}\n\
";

function injectAppendPlaceCSS() {
  if (document.getElementById('append-place-name-css')) { return; }
  var style = document.createElement('style');
  style.id = 'append-place-name-css';
  style.textContent = appendPlaceNameCSS;
  document.head.appendChild(style);
}

function appendPlaceName(place) {
  var place_name = {};
  var en_name = '';
  Object.keys(place.names || {}).forEach(function (lang) {
    var vals = place.names[lang] || [];
    var str = vals.map(function (v) { return String(v).trim(); }).filter(function (v) { return v; }).join(', ');
    place_name[lang] = str;
    if (lang === 'en' && !en_name) en_name = str;
  });
  if (!en_name) {
    for (var fallback_i = 0; fallback_i < Object.keys(place_name).length; fallback_i++) {
      var fl = Object.keys(place_name)[fallback_i];
      if (place_name[fl]) { en_name = place_name[fl]; break; }
    }
  }
  var entry = {
    placeId: String(place.pinCode || '') + (en_name ? '#' + en_name : ''),
    pinCode: place.pinCode,
    placeName: place_name
  };
  var db = storage.get('places') || [];
  var match_i = -1;
  for (var di = 0; di < db.length; di++) {
    if (db[di].placeId === entry.placeId) { match_i = di; break; }
  }
  if (match_i === -1) { db.push(entry); }
  else { db[match_i].placeName = place_name; db[match_i].pinCode = entry.pinCode; }
  storage.commit('places', db);
  return entry;
}

var appendPlaceNamePlaceholders = {
  en: 'London',
  ta: 'மதுரை',
  te: 'హైదరాబాద్',
  kn: 'ಮೈಸೂರು',
  ml: 'കൊച്ചി',
  mr: 'मुंबई',
  or: 'ପୁରୀ',
  as: 'গুৱাহাটী',
  bn: 'কলকাতা',
  hi: 'वाराणसी',
  ne: 'काठमाडौं',
  si: 'මහනුවර',
  kok: 'पणजी',
  tcy: 'ಮಂಗಳೂರು'
};

function appendNameBoxHtml(placeholder) {
  return '<div class="app-name-row">' +
    '<input class="field-input app-name-inp" type="text" placeholder="' + placeholder + '" />' +
    '<button type="button" class="app-name-row-del" onclick="removeAppNameBox(this)"><i class="ti ti-minus"></i></button>' +
  '</div>';
}

function buildAppendPlaceFields() {
  var wrap = document.getElementById('app-place-name-fields');
  if (!wrap) { return; }
  var langs = (storage.get('languages') || []).filter(function(l){ return l.code !== 'sn'; }).slice().sort(function (a, b) {
    if (a.code === 'en') { return -1; }
    if (b.code === 'en') { return 1; }
    return a.name.localeCompare(b.name);
  });
  wrap.innerHTML = langs.map(function (l) {
    return '<div class="field-wrap app-name-group" data-lang="' + l.code + '">' +
      '<div class="field-label app-name-lbl"><i class="ti ti-language" style="font-size:0.8667rem"></i> ' + l.name + ' <span class="app-name-script">' + l.script + '</span></div>' +
      '<input class="field-input app-name-inp" type="text" placeholder="' + (appendPlaceNamePlaceholders[l.code] || ('Type in ' + l.name)) + '" />' +
    '</div>';
  }).join('');
}

var appendPlacePages = "\n\
<div class=\"page\" id=\"page-append-place-name\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goBackAppendFlowPage()\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Append place name</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Append a place name to the database</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">Add a new place with its name in each language and a pincode. It will be available across the app.</div>\n\
    <div class=\"field-wrap\"><div class=\"field-label\"><i class=\"ti ti-hash\" style=\"font-size:0.8667rem\"></i> Pincode</div><input id=\"app-place-pincode\" class=\"field-input\" type=\"text\" placeholder=\"e.g. 625218\" /></div>\n\
    <div id=\"app-place-name-fields\"></div>\n\
  </div>\n\
  <div class=\"flow-footer\"><button class=\"green-btn\" onclick=\"appendPlaceNameToDatabase()\"><i class=\"ti ti-database-plus\" style=\"font-size:0.9333rem\"></i> Append to database</button></div>\n\
</div>\n\
<div class=\"page\" id=\"page-append-place-success\">\n\
  <div class=\"success-top\">\n\
    <div class=\"check-ring\"><i class=\"ti ti-check\" style=\"font-size:1.8667rem;color:var(--color-theme-light)\"></i></div>\n\
    <div style=\"font-size:1.1333rem;font-weight:500;color:#27500A;\">Place name added!</div>\n\
    <div style=\"font-size:0.8rem;color:#3B6D11;text-align:center;line-height:1.5;\">The place name has been appended to the database.</div>\n\
  </div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <button class=\"green-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-list\"></i> Back to list</button>\n\
  </div>\n\
</div>\n";

function appendPlaceNameToDatabase() {
  var names = {};
  document.querySelectorAll('.app-name-group').forEach(function (g) {
    var vals = [];
    g.querySelectorAll('.app-name-inp').forEach(function (i) { if (i.value.trim()) { vals.push(i.value.trim()); } });
    names[g.getAttribute('data-lang')] = vals;
  });
  var payload = {
    pinCode: document.getElementById('app-place-pincode').value,
    names: names
  };
  console.log(payload);
  var editPin=new URLSearchParams(location.search).get('editPin');
  if(editPin){
    try{
      var login=null; try{ login=JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); }catch(e){}
      if(login&&login['tree-login']&&login['tree-login'].surveyor&&login['tree-login'].surveyor.stats&&login['tree-login'].surveyor.stats['place-name']){
        var pn=login['tree-login'].surveyor.stats['place-name'];
        var approved=pn.approved||[]; var idx=-1;
        for(var i=0;i<approved.length;i++) if((approved[i].pinCode||approved[i].pincode)===editPin){ idx=i; break; }
        if(idx!==-1){
          var entry=approved[idx];
          var isDirty=false; try{ isDirty=(payload.pinCode!==entry.pinCode)||(JSON.stringify(payload.names)!==JSON.stringify(entry.names)); }catch(e){ isDirty=true; }
          if(!isDirty){ goTo('append-place-success'); return; }
          entry=approved.splice(idx,1)[0];
          entry.pinCode=payload.pinCode||entry.pinCode;
          entry.names=payload.names||entry.names;
          var now=new Date(); var pad=function(n){ return String(n).padStart(2,'0'); };
          entry.revisedAt=''+now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'T'+pad(now.getHours())+pad(now.getMinutes())+pad(now.getSeconds());
          entry.status='submitted';
          try{ var u=(login['tree-login'].surveyor.userId||'SVY2612345678'); entry.updatedBy=u; }catch(e){}
          pn.submitted=pn.submitted||[]; pn.submitted.push(entry);
          try{ sessionStorage.setItem('loginCredentialsV1', JSON.stringify(login)); }catch(e){}
          try{ if(window.parent&&window.parent!==window&&window.parent.__login) window.parent.__login=login; window.__login=login; if(typeof storage!=='undefined'&&storage.set) storage.set('login', login); }catch(e){}
        } else {
          appendAndRecordPlaceName(payload);
        }
      } else {
        appendAndRecordPlaceName(payload);
      }
    }catch(e){ appendAndRecordPlaceName(payload); }
  } else {
    appendAndRecordPlaceName(payload);
  }
  goTo('append-place-success');
}

function appendAndRecordPlaceName(payload) {
  appendPlaceName(payload);
  try {
    var login = null;
    try { login = JSON.parse(sessionStorage.getItem('loginCredentialsV1') || '{}'); } catch (e) {}
    login = login || {};
    login['tree-login'] = login['tree-login'] || {};
    login['tree-login'].surveyor = login['tree-login'].surveyor || {};
    login['tree-login'].surveyor.stats = login['tree-login'].surveyor.stats || {};
    var place_name_stats = login['tree-login'].surveyor.stats['place-name'] || {};
    var current_time = new Date();
    var pad_number = function(n) { return String(n).padStart(2, '0'); };
    var recorded_entry = {
      pinCode: payload.pinCode || '',
      names: payload.names || {},
      revisedAt: '' + current_time.getFullYear() + pad_number(current_time.getMonth() + 1) + pad_number(current_time.getDate()) + 'T' + pad_number(current_time.getHours()) + pad_number(current_time.getMinutes()) + pad_number(current_time.getSeconds()),
      status: 'submitted',
      updatedBy: login['tree-login'].surveyor.userId || 'SVY2612345678'
    };
    place_name_stats.submitted = place_name_stats.submitted || [];
    place_name_stats.submitted.push(recorded_entry);
    login['tree-login'].surveyor.stats['place-name'] = place_name_stats;
    try { sessionStorage.setItem('loginCredentialsV1', JSON.stringify(login)); } catch (e) {}
    try { if (window.parent && window.parent !== window && window.parent.__login) window.parent.__login = login; window.__login = login; if (typeof storage !== 'undefined' && storage.set) storage.set('login', login); } catch (e) {}
  } catch (e) {}
  return true;
}

function injectAppendPlaceFlow() {
  var existing = document.getElementById('page-append-place-name');
  if (!existing) {
    var screen = document.querySelector('.screen');
    if (screen) screen.insertAdjacentHTML('beforeend', appendPlacePages);
    buildAppendPlaceFields();
  }
}
injectAppendPlaceCSS();
injectAppendPlaceFlow();
(function handleEditPin(){
  var pin=new URLSearchParams(location.search).get('editPin');
  if(!pin) return;
  setTimeout(function(){
    try{
      var login=null; try{ login=JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); }catch(e){}
      var stats=(login&&login['tree-login']&&login['tree-login'].surveyor&&login['tree-login'].surveyor.stats)||{};
      var list=[].concat(stats['place-name']?(stats['place-name'].approved||[]):[]).concat(stats['place-name']?(stats['place-name'].submitted||[]):[]);
      var entry=null; for(var i=0;i<list.length;i++) if((list[i].pinCode||list[i].pincode)===pin){ entry=list[i]; break; }
      if(!entry) return;
      var pin_el=document.getElementById('app-place-pincode'); if(pin_el) pin_el.value=entry.pinCode||pin;
      if(entry.names){
        document.querySelectorAll('.app-name-group').forEach(function(g){
          var code=g.getAttribute('data-lang');
          var vals=entry.names[code]||[];
          var inp=g.querySelector('.app-name-inp');
          if(inp) inp.value=vals[0]||'';
        });
      }
      window._editOriginalPlace={ pin:entry.pinCode||pin, names:JSON.parse(JSON.stringify(entry.names||{})) };
      var btn=document.querySelector('.flow-footer .green-btn');
      if(btn){ btn.disabled=true; btn.style.opacity='0.5'; btn.style.cursor='not-allowed'; }
      function checkDirtyPlace(){
        var curPin=(document.getElementById('app-place-pincode')||{}).value||'';
        var curNames={}; document.querySelectorAll('.app-name-group').forEach(function(g){ var vals=[]; g.querySelectorAll('.app-name-inp').forEach(function(i){ if(i.value.trim()) vals.push(i.value.trim()); }); curNames[g.getAttribute('data-lang')]=vals; });
        var dirty=false;
        try{ dirty=(curPin!==window._editOriginalPlace.pin)||(JSON.stringify(curNames)!==JSON.stringify(window._editOriginalPlace.names)); }catch(e){ dirty=true; }
        if(btn){ btn.disabled=!dirty; btn.style.opacity=dirty?'1':'0.5'; btn.style.cursor=dirty?'pointer':'not-allowed'; }
      }
      document.addEventListener('input', checkDirtyPlace);
    }catch(e){}
  },400);
})();

// --- standalone append-a-place-name.html support (merged from append-a-place-name-page.js) ---
(function(){
  if (location.pathname.indexOf('append-a-place-name.html') === -1) return;
  var parentUrl = new URLSearchParams(location.search).get('parent') || 'test-bed-3.html';
  window.roleDash = function(){ return parentUrl; };
  window.appendPlaceGoTo = function(page){
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
  window.goTo = window.appendPlaceGoTo;
  window.goBackAppendFlowPage = function(){
    try {
      if (window.parent && window.parent !== window && typeof window.parent.goBackAppendFlow === 'function') { window.parent.goBackAppendFlow(); return; }
    } catch(e){}
    try {
      if (window.parent && window.parent !== window && typeof window.parent.backToStart === 'function') { window.parent.backToStart(); return; }
    } catch(e){}
    var p = new URLSearchParams(location.search).get('parent');
    if (p) { window.location.href = decodeURIComponent(p); return; }
    window.location.href = 'index.html';
  };
  window.render = { init: function () { buildAppendPlaceFields(); } };
  window.goTo('append-place-name');
})();