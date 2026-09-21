// append-a-tree-species-name.js — standalone flow injected into #screen. Reads tree names from storage and appends new tree names.
// Entry format: { "<scientificName>": { en: [], ta: [], te: [], ... }, "variety": [] }

var appendTreeNameCSS = "\n\
  .app-name-group{display:flex;flex-direction:column;gap:8px;}\n\
  .app-name-lbl{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}\n\
  .app-name-script{font-size:0.8rem;color:var(--color-text-secondary);}\n\
  .app-name-add{background:var(--color-theme-light);border:1px solid var(--color-theme);color:var(--color-theme);border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:0.8rem;line-height:1;margin-left:auto;}\n\
  .app-name-row{display:flex;align-items:center;gap:8px;}\n\
  .app-name-row .field-input{flex:1;}\n\
  .app-name-row-del{background:var(--color-background-secondary);border:0.5px solid #e6b8b8;color:#dc2626;border-radius:50%;width:22px;height:22px;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:0.8rem;line-height:1;}\n\
  .app-name-row-del:disabled{opacity:0.35;cursor:not-allowed;}\n\
  .success-top{background:var(--color-theme-light);padding:24px 20px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;}\n\
  .check-ring{width:58px;height:58px;border-radius:50%;background:var(--color-theme);display:flex;align-items:center;justify-content:center;animation:popIn 0.5s ease forwards;}\n\
  @keyframes popIn{0%{transform:scale(0.4);opacity:0;}70%{transform:scale(1.1);}100%{transform:scale(1);opacity:1;}}\n\
  .flow-scroll{padding:12px 13px;display:flex;flex-direction:column;gap:10px;min-height:auto;}\n\
  .flow-footer{padding:12px 13px;background:var(--color-background-primary);border-top:0.5px solid var(--color-border-tertiary);flex-shrink:0;}\n\
";

function injectAppendTreeCSS() {
  if (document.getElementById('append-tree-name-css')) { return; }
  var style = document.createElement('style');
  style.id = 'append-tree-name-css';
  style.textContent = appendTreeNameCSS;
  document.head.appendChild(style);
}

function appendTreeName(treeName) {
  var botanicalName = (treeName.scientificName || '').trim();
  var langs = storage.get('languages') || [];
  var db = storage.get('treeSpeciesName') || [];
  var match_i = -1;
  for (var i = 0; i < db.length; i++) {
    if (Object.prototype.hasOwnProperty.call(db[i], botanicalName)) { match_i = i; break; }
  }
  if (match_i === -1) {
    var entry = {};
    entry[botanicalName] = {};
    langs.forEach(function(l){ entry[botanicalName][l.code] = (l.code === 'sn') ? [botanicalName] : ((treeName.names && treeName.names[l.code]) || []); });
    entry.variety = [];
    db.push(entry);
  } else {
    langs.forEach(function(l) {
      var src = (l.code === 'sn') ? [botanicalName] : (((treeName.names && treeName.names[l.code]) || []).slice());
      var cur = db[match_i][botanicalName][l.code] || [];
      src.forEach(function(v){ if (cur.indexOf(v) === -1) { cur = cur.concat([v]); } });
      db[match_i][botanicalName][l.code] = cur;
    });
  }
  storage.commit('treeSpeciesName', db);
  return match_i === -1 ? db[db.length - 1] : db[match_i];
}

var appendTreePages = "\n\
<div class=\"page\" id=\"page-append-tree-name\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goBackAppendFlowPage()\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Append tree name</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);\">Append a tree name to the database</div>\n\
    <div style=\"font-size:0.7333rem;color:var(--color-text-secondary);\">Add a new tree name with its scientific name and names in each language. It will be available across the app.</div>\n\
    <div class=\"field-wrap\"><div class=\"field-label\"><i class=\"ti ti-abc\" style=\"font-size:0.8667rem\"></i> Scientific name</div><input id=\"app-scientific-name\" class=\"field-input\" type=\"text\" placeholder=\"e.g. Borassus flabellifer\" /></div>\n\
    <div id=\"app-name-fields\"></div>\n\
  </div>\n\
  <div class=\"flow-footer\"><button class=\"green-btn\" onclick=\"appendTreeNameToDatabase()\"><i class=\"ti ti-database-plus\" style=\"font-size:0.9333rem\"></i> Append to database</button></div>\n\
</div>\n\
<div class=\"page\" id=\"page-append-tree-success\">\n\
  <div class=\"success-top\">\n\
    <div class=\"check-ring\"><i class=\"ti ti-check\" style=\"font-size:1.8667rem;color:var(--color-theme-light)\"></i></div>\n\
    <div style=\"font-size:1.1333rem;font-weight:500;color:#27500A;\">Tree name added!</div>\n\
    <div style=\"font-size:0.8rem;color:#3B6D11;text-align:center;line-height:1.5;\">The tree name has been appended to the database.</div>\n\
  </div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <button class=\"green-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-list\"></i> Back to list</button>\n\
  </div>\n\
</div>\n";

var appendTreeNamePlaceholders = {
  en: 'Palmyra Palm',
  ta: 'பனைமரம்',
  te: 'తాటి చెట్టు',
  kn: 'ತಾಳೆಮರ',
  ml: 'കരിമ്പന',
  mr: 'ताड',
  or: 'ତାଳ ଗଛ',
  as: 'তাল গছ',
  bn: 'তাল গাছ',
  hi: 'ताड़',
  ne: 'ताड',
  si: 'තල් ගස',
  kok: 'इरोळ',
  tcy: 'ತಾರಿ'
};

function appendNameBoxHtml(placeholder) {
  return '<div class="app-name-row">' +
    '<input class="field-input app-name-inp" type="text" placeholder="' + placeholder + '" />' +
    '<button type="button" class="app-name-row-del" onclick="removeAppNameBox(this)"><i class="ti ti-minus"></i></button>' +
  '</div>';
}

function buildAppendNameFields() {
  var wrap = document.getElementById('app-name-fields');
  if (!wrap) { return; }
  var langs = (storage.get('languages') || []).filter(function(l){ return l.code !== 'sn'; }).slice().sort(function (a, b) {
    if (a.code === 'en') { return -1; }
    if (b.code === 'en') { return 1; }
    return a.name.localeCompare(b.name);
  });
  wrap.innerHTML = langs.map(function (l) {
    return '<div class="field-wrap app-name-group" data-lang="' + l.code + '">' +
      '<div class="field-label app-name-lbl"><i class="ti ti-language" style="font-size:0.8667rem"></i> ' + l.name + ' <span class="app-name-script">' + l.script + '</span><button type="button" class="app-name-add" onclick="addAppNameBox(this)"><i class="ti ti-plus"></i></button></div>' +
      appendNameBoxHtml(appendTreeNamePlaceholders[l.code] || ('Type in ' + l.name)) +
    '</div>';
  }).join('');
  wrap.querySelectorAll('.app-name-group').forEach(syncDelButtons);
}

function addAppNameBox(btn) {
  var group = btn.closest('.app-name-group');
  var placeholder = group.querySelector('.app-name-inp').getAttribute('placeholder');
  group.insertAdjacentHTML('beforeend', appendNameBoxHtml(placeholder));
  syncDelButtons(group);
}

function removeAppNameBox(btn) {
  var group = btn.closest('.app-name-group');
  if (group.querySelectorAll('.app-name-row').length <= 1) { return; }
  btn.closest('.app-name-row').remove();
  syncDelButtons(group);
}

function syncDelButtons(group) {
  var rows = group.querySelectorAll('.app-name-row');
  rows.forEach(function (row, index) {
    var del = row.querySelector('.app-name-row-del');
    if (del) del.disabled = rows.length <= 1;
  });
}

function appendTreeNameToDatabase() {
  var names = {};
  document.querySelectorAll('.app-name-group').forEach(function (g) {
    var vals = [];
    g.querySelectorAll('.app-name-inp').forEach(function (i) { if (i.value.trim()) { vals.push(i.value.trim()); } });
    names[g.getAttribute('data-lang')] = vals;
  });
  var payload = {
    scientificName: document.getElementById('app-scientific-name').value,
    names: names
  };
  console.log(payload);
  var editSci=new URLSearchParams(location.search).get('editSci');
  if(editSci){
    try{
      var login=null; try{ login=JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); }catch(e){}
      if(login&&login['tree-login']&&login['tree-login'].surveyor&&login['tree-login'].surveyor.stats&&login['tree-login'].surveyor.stats['tree-name']){
        var tn=login['tree-login'].surveyor.stats['tree-name'];
        var approved=tn.approved||[]; var idx=-1;
        for(var i=0;i<approved.length;i++) if((approved[i].scientificName||approved[i].sn)===editSci){ idx=i; break; }
        if(idx!==-1){
          var entry=approved[idx];
          var isDirty=false;
          try{ isDirty=(payload.scientificName!==entry.scientificName)||(JSON.stringify(payload.names)!==JSON.stringify(entry.names)); }catch(e){ isDirty=true; }
          if(!isDirty){
            goTo('append-tree-success');
            return;
          }
          entry=approved.splice(idx,1)[0];
          entry.scientificName=payload.scientificName||entry.scientificName;
          entry.names=payload.names||entry.names;
          var now=new Date(); var pad=function(n){ return String(n).padStart(2,'0'); };
          entry.revisedAt=''+now.getFullYear()+pad(now.getMonth()+1)+pad(now.getDate())+'T'+pad(now.getHours())+pad(now.getMinutes())+pad(now.getSeconds());
          entry.status='submitted';
          try{ var u=(login['tree-login'].surveyor.userId||'SVY2612345678'); entry.updatedBy=u; }catch(e){}
          tn.submitted=tn.submitted||[]; tn.submitted.push(entry);
          try{ sessionStorage.setItem('loginCredentialsV1', JSON.stringify(login)); }catch(e){}
          try{ if(window.parent&&window.parent!==window&&window.parent.__login) window.parent.__login=login; window.__login=login; if(typeof storage!=='undefined'&&storage.set) storage.set('login', login); }catch(e){}
        } else {
          appendAndRecordTreeName(payload);
        }
      } else {
        appendAndRecordTreeName(payload);
      }
    }catch(e){ appendAndRecordTreeName(payload); }
  } else {
    appendAndRecordTreeName(payload);
  }
  goTo('append-tree-success');
}

function appendAndRecordTreeName(payload) {
  appendTreeName(payload);
  try {
    var login = null;
    try { login = JSON.parse(sessionStorage.getItem('loginCredentialsV1') || '{}'); } catch (e) {}
    login = login || {};
    login['tree-login'] = login['tree-login'] || {};
    login['tree-login'].surveyor = login['tree-login'].surveyor || {};
    login['tree-login'].surveyor.stats = login['tree-login'].surveyor.stats || {};
    var tree_name_stats = login['tree-login'].surveyor.stats['tree-name'] || {};
    var current_time = new Date();
    var pad_number = function(n) { return String(n).padStart(2, '0'); };
    var recorded_entry = {
      scientificName: payload.scientificName || '',
      names: payload.names || {},
      revisedAt: '' + current_time.getFullYear() + pad_number(current_time.getMonth() + 1) + pad_number(current_time.getDate()) + 'T' + pad_number(current_time.getHours()) + pad_number(current_time.getMinutes()) + pad_number(current_time.getSeconds()),
      status: 'submitted',
      updatedBy: login['tree-login'].surveyor.userId || 'SVY2612345678'
    };
    tree_name_stats.submitted = tree_name_stats.submitted || [];
    tree_name_stats.submitted.push(recorded_entry);
    login['tree-login'].surveyor.stats['tree-name'] = tree_name_stats;
    try { sessionStorage.setItem('loginCredentialsV1', JSON.stringify(login)); } catch (e) {}
    try { if (window.parent && window.parent !== window && window.parent.__login) window.parent.__login = login; window.__login = login; if (typeof storage !== 'undefined' && storage.set) storage.set('login', login); } catch (e) {}
  } catch (e) {}
  return true;
}

function injectAppendTreeFlow() {
  var existing = document.getElementById('page-append-tree-name');
  if (!existing) {
    var screen = document.querySelector('.screen');
    if (screen) screen.insertAdjacentHTML('beforeend', appendTreePages);
    buildAppendNameFields();
  }
}
injectAppendTreeCSS();
injectAppendTreeFlow();
(function handleEditSci(){
  var sci=new URLSearchParams(location.search).get('editSci');
  if(!sci) return;
  setTimeout(function(){
    try{
      var login=null; try{ login=JSON.parse(sessionStorage.getItem('loginCredentialsV1')||'{}'); }catch(e){}
      var stats=(login&&login['tree-login']&&login['tree-login'].surveyor&&login['tree-login'].surveyor.stats)||{};
      var list=[].concat(stats['tree-name']?(stats['tree-name'].approved||[]):[]).concat(stats['tree-name']?(stats['tree-name'].submitted||[]):[]);
      var entry=null; for(var i=0;i<list.length;i++) if((list[i].scientificName||list[i].sn)===sci){ entry=list[i]; break; }
      if(!entry) return;
      var sci_el=document.getElementById('app-scientific-name'); if(sci_el) sci_el.value=entry.scientificName||sci;
      if(entry.names){
        document.querySelectorAll('.app-name-group').forEach(function(g){
          var code=g.getAttribute('data-lang');
          var vals=entry.names[code]||[];
          if(!vals.length) return;
          var rows=g.querySelectorAll('.app-name-row');
          for(var k=0;k<vals.length;k++){
            if(rows[k] && rows[k].querySelector('.app-name-inp')) rows[k].querySelector('.app-name-inp').value=vals[k];
            else { var ph=g.querySelector('.app-name-inp').getAttribute('placeholder'); g.insertAdjacentHTML('beforeend','<div class="app-name-row"><input class="field-input app-name-inp" type="text" placeholder="'+ph+'" value="'+vals[k].replace(/"/g,'&quot;')+'"/><button type="button" class="app-name-row-del" onclick="removeAppNameBox(this)"><i class="ti ti-minus"></i></button></div>'); }
          }
          syncDelButtons(g);
        });
      }
      window._editOriginal={ sci:entry.scientificName||sci, names:JSON.parse(JSON.stringify(entry.names||{})) };
      var btn=document.querySelector('.flow-footer .green-btn');
      if(btn){ btn.disabled=true; btn.style.opacity='0.5'; btn.style.cursor='not-allowed'; }
      function checkDirty(){
        var curSci=(document.getElementById('app-scientific-name')||{}).value||'';
        var curNames={}; document.querySelectorAll('.app-name-group').forEach(function(g){ var vals=[]; g.querySelectorAll('.app-name-inp').forEach(function(i){ if(i.value.trim()) vals.push(i.value.trim()); }); curNames[g.getAttribute('data-lang')]=vals; });
        var dirty=false;
        try{ dirty=(curSci!==window._editOriginal.sci)||(JSON.stringify(curNames)!==JSON.stringify(window._editOriginal.names)); }catch(e){ dirty=true; }
        if(btn){ btn.disabled=!dirty; btn.style.opacity=dirty?'1':'0.5'; btn.style.cursor=dirty?'pointer':'not-allowed'; }
      }
      document.addEventListener('input', checkDirty);
      document.addEventListener('click', function(e){ if(e.target.closest('.app-name-add')||e.target.closest('.app-name-row-del')) setTimeout(checkDirty,50); });
    }catch(e){}
  },400);
})();

// --- standalone append-a-tree-species-name.html support (merged from append-a-tree-name-page.js) ---
(function(){
  if (location.pathname.indexOf('append-a-tree-species-name.html') === -1) return;
  var parentUrl = new URLSearchParams(location.search).get('parent') || 'test-bed-3.html';
  window.roleDash = function(){ return parentUrl; };
  window.appendTreeGoTo = function(page){
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
  window.goTo = window.appendTreeGoTo;
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
  window.render = { init: function () { buildAppendNameFields(); } };
  window.goTo('append-tree-name');
})();