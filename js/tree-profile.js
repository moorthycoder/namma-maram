
var profileTreeId = new URLSearchParams(location.search).get("treeId") ;

// tree-profile.js — reordered for vetting: core fns top, helpers bottom
function findTree(id) {
  var raw = window.__TREE_DATA || storage.get('treeCards') || [];
  for (var i = 0; i < raw.length; i++) if (raw[i].treeId===id) return raw[i];
  for (var i = 0; i < albumData.length; i++) if (albumData[i].treeId === id) return albumData[i];
  return null;
}

function renderProfile() {
  var tree = (window.__TREE_DATA || storage.get('treeCards') || []).find(function(t){ return t.treeId===profileTreeId; });
  console.log('RAM card', tree);
  if (!tree) return;
  document.getElementById('profile-id-label').textContent = '';
  var enc_keys = Object.keys(tree['encounters-list'] || {});
  var first_key = enc_keys[0];
  var last_key = enc_keys[enc_keys.length-1];
  var first_enc = tree['encounters-list'][first_key] || {};
  var last_enc = tree['encounters-list'][last_key] || {};
  var last_status = last_enc['health-status'] || {};
  var title_names = cardNameText(tree, appLang);
  if (!title_names || !title_names.length) { title_names = [tree.scientificName]; }
  var title_text = title_names.map(function (nm) { return String(nm); }).join('<br>');
  document.getElementById('profile-hero-title').innerHTML = title_text + '<br><span style="font-size:0.8rem;opacity:0.8">' + tree.treeId + '</span>';
  document.getElementById('profile-hero-addr').innerHTML = '<button class="gis-pin" type="button" onclick="showInMap([profileTreeId])"><i class="ti ti-map-pin"></i></button><span class="addr-text">' + tree.pincode + '</span>';
  document.getElementById('profile-stat-health').textContent = last_status.health;
  document.getElementById('profile-stat-height').textContent = (typeof formatLength === 'function' ? convertLength(last_status.height, getUnits('height')) : last_status.height);
  document.getElementById('profile-stat-diam').textContent = (typeof formatLength === 'function' ? convertLength(last_status.diameter, getUnits('diameter')) : last_status.diameter);
  document.querySelectorAll('.unit-label').forEach(function(el){ var t=el.getAttribute('data-unit-type'); if(t) el.textContent = getUnits(t); });
  document.querySelector('.health-fill').style.width = (last_status['health-score'] || 0) + '%';
  document.getElementById('profile-health-score').textContent = (last_status['health-score'] || 0) + ' / 100';
  document.getElementById('profile-species').textContent = tree.scientificName;
  document.getElementById('profile-registered-by').textContent = first_enc.registeredBy;
  document.getElementById('profile-user-id').textContent = first_enc.registererId;
  document.getElementById('profile-registered-date').textContent = formatDate(first_enc.registeredDate);
  document.getElementById('profile-planted-date').textContent = formatDate(tree['date-of-planting']);
  document.getElementById('profile-age').textContent = (function(d){ var dt=new Date(d); var now=new Date(); var y=now.getFullYear()-dt.getFullYear(); var m=now.getMonth()-dt.getMonth(); var total=y*12+m; var yy=Math.floor(total/12); var mm=total%12; return (yy? yy+' year'+(yy>1?'s':'')+' ':'')+(mm? mm+' month'+(mm>1?'s':''):''); })(tree['date-of-planting']);
  document.getElementById('profile-total-logs').textContent = enc_keys.length;
  (function(){
    var name_el = document.getElementById('profile-project');
    if (!name_el) return;
    var names = Array.isArray(tree.projectName) ? tree.projectName : (tree.projectName ? [tree.projectName] : []);
    var filtered = [];
    for (var np_i = 0; np_i < names.length; np_i++) {
      var nm = String(names[np_i]).trim();
      if (nm) filtered.push(nm);
    }
    if (!filtered.length) { name_el.textContent = '—'; return; }
    name_el.textContent = filtered[0];
    var row_el = name_el.parentNode;
    for (var nm_i = 1; nm_i < filtered.length; nm_i++) {
      var line_el = document.createElement('span');
      line_el.className = 'project-info-more';
      line_el.textContent = filtered[nm_i];
      row_el.appendChild(line_el);
    }
  })();
  renderLogs(tree);
  syncAddButtonStates();
}
function appendToGobackExclude(treeId) {
  try {
    var url = sessionStorage.getItem('gobackFromTreeProfile') || '';
    if (!url) return;
    var qs = url.split('?')[1] || '';
    var params = new URLSearchParams(qs);
    var existing = params.get('exclude') || '';
    var ids = existing ? existing.split(',') : [];
    if (ids.indexOf(treeId) === -1) ids.push(treeId);
    params.set('exclude', ids.join(','));
    sessionStorage.setItem('gobackFromTreeProfile', url.split('?')[0] + '?' + params.toString());
  } catch (e) {}
}
function goBack(url) {
  var goback = sessionStorage.getItem('gobackFromTreeProfile');
  console.log('[tree-profile] goBack ->', goback);
  if (goback) { window.location.href = goback; return; }
  var parent = url || new URLSearchParams(location.search).get('parent');
  if (parent) { window.location.href = parent; return; }
  if (window.history.length > 1) window.history.back(); else window.location.href = 'filter.html';
}
function updateLang(lang) {
  var l = lang || filterLang || 'en';
  try { setFilterLang(l); } catch (e) {}
  try { sessionStorage.setItem('nm-app-lang', l); } catch (e) {}
  renderProfile();
}
function isTreeInSponsorWaiting() {
  try {
    var sponsor_list_str = sessionStorage.getItem('sponsorWaiting') || '[]';
    var sponsor_arr = JSON.parse(sponsor_list_str);
    return (sponsor_arr.indexOf(profileTreeId) !== -1) ? true : false;
  } catch (e) {
    return false;
  }
}
function isTreeInCaregiverWaiting() {
  try {
    var caregiver_list_str = sessionStorage.getItem('caregiverWaiting') || '[]';
    var caregiver_arr = JSON.parse(caregiver_list_str);
    return (caregiver_arr.indexOf(profileTreeId) !== -1) ? true : false;
  } catch (e) {
    return false;
  }
}
function isTreeInSurveyorWaiting() {
  try {
    var surveyor_list_str = sessionStorage.getItem('surveyorSurveyWaiting') || '[]';
    var surveyor_arr = JSON.parse(surveyor_list_str);
    return (surveyor_arr.indexOf(profileTreeId) !== -1) ? true : false;
  } catch (e) {
    return false;
  }
}
function showActionModal(title_text, message_text, is_add) {
  var title_el = document.getElementById('action-modal-title');
  var text_el = document.getElementById('action-modal-text');
  var icon_el = document.getElementById('action-modal-icon');
  var modal_el = document.getElementById('action-modal');
  if (title_el) title_el.textContent = title_text;
  if (text_el) text_el.textContent = message_text;
  if (icon_el) {
    icon_el.className = is_add ? 'report-success-icon' : 'report-info-icon';
    icon_el.innerHTML = is_add ? '<i class="ti ti-check"></i>' : '<i class="ti ti-info-circle"></i>';
  }
  if (modal_el) modal_el.classList.add('open');
}
function closeActionModal() {
  var modal_el = document.getElementById('action-modal');
  if (modal_el) modal_el.classList.remove('open');
}
function updateSponsorButtonState() {
  var is_added = isTreeInSponsorWaiting();
  var topbar_btns = document.querySelectorAll('.add-sponsor-btn');
  var cta_btns = document.querySelectorAll('.sponsor-cta');
  topbar_btns.forEach(function(btn_el) {
    btn_el.disabled = false;
    if (is_added) {
      btn_el.innerHTML = '<i class="ti ti-check"></i>';
      btn_el.title = 'Added to Sponsor waiting list';
      btn_el.classList.add('btn-added');
    } else {
      btn_el.innerHTML = '<i class="ti ti-currency-rupee"></i>';
      btn_el.title = 'Sponsor this tree';
      btn_el.classList.remove('btn-added');
    }
  });
  cta_btns.forEach(function(btn_el) {
    btn_el.disabled = false;
    if (is_added) {
      btn_el.innerHTML = '<i class="ti ti-check"></i> Added to Sponsor waiting list';
      btn_el.classList.add('btn-added');
    } else {
      btn_el.innerHTML = '<i class="ti ti-currency-rupee"></i> Sponsor this tree';
      btn_el.classList.remove('btn-added');
    }
  });
}
function updateCareButtonState() {
  var is_added = isTreeInCaregiverWaiting();
  var topbar_btns = document.querySelectorAll('.add-care-btn');
  var cta_btns = document.querySelectorAll('.care-cta');
  topbar_btns.forEach(function(btn_el) {
    btn_el.disabled = false;
    if (is_added) {
      btn_el.innerHTML = '<i class="ti ti-check"></i>';
      btn_el.title = 'Added to Care waiting list';
      btn_el.classList.add('btn-added');
    } else {
      btn_el.innerHTML = '<i class="ti ti-heart-handshake"></i>';
      btn_el.title = 'Care for this tree';
      btn_el.classList.remove('btn-added');
    }
  });
  cta_btns.forEach(function(btn_el) {
    btn_el.disabled = false;
    if (is_added) {
      btn_el.innerHTML = '<i class="ti ti-check"></i> Added to Care waiting list';
      btn_el.classList.add('btn-added');
    } else {
      btn_el.innerHTML = '<i class="ti ti-heart-handshake"></i> Care for this tree';
      btn_el.classList.remove('btn-added');
    }
  });
}
function updateSurveyorButtonState() {
  var is_added = isTreeInSurveyorWaiting();
  var topbar_btns = document.querySelectorAll('.add-survey-btn');
  var cta_btns = document.querySelectorAll('.survey-cta');
  topbar_btns.forEach(function(btn_el) {
    btn_el.disabled = false;
    if (is_added) {
      btn_el.innerHTML = '<i class="ti ti-check"></i>';
      btn_el.title = 'Added to Survey request list';
      btn_el.classList.add('btn-added');
    } else {
      btn_el.innerHTML = '<i class="ti ti-clipboard-list"></i>';
      btn_el.title = 'Request survey for this tree';
      btn_el.classList.remove('btn-added');
    }
  });
  cta_btns.forEach(function(btn_el) {
    btn_el.disabled = false;
    if (is_added) {
      btn_el.innerHTML = '<i class="ti ti-check"></i> Added to Survey request list';
      btn_el.classList.add('btn-added');
    } else {
      btn_el.innerHTML = '<i class="ti ti-clipboard-list"></i> Request survey for this tree';
      btn_el.classList.remove('btn-added');
    }
  });
}
function syncAddButtonStates() {
  updateSponsorButtonState();
  updateCareButtonState();
  updateSurveyorButtonState();
}
function addToSponsor() {
  try {
    var sponsor_list_str = sessionStorage.getItem('sponsorWaiting') || '[]';
    var sponsor_arr = JSON.parse(sponsor_list_str);
    var item_index = sponsor_arr.indexOf(profileTreeId);
    var is_present = (item_index !== -1) ? true : false;
    if (is_present) {
      sponsor_arr.splice(item_index, 1);
      showActionModal('Removed from Sponsor waiting list', 'Tree ' + (profileTreeId || '') + ' has been removed from your Sponsor waiting list.', false);
    } else {
      sponsor_arr.push(profileTreeId);
      showActionModal('Added to Sponsor seeing list', 'Tree ' + (profileTreeId || '') + ' has been added to your Sponsor seeing list.', true);
      appendToGobackExclude(profileTreeId);
    }
    sessionStorage.setItem('sponsorWaiting', JSON.stringify(sponsor_arr));
  } catch (e) {}
  updateSponsorButtonState();
}
function addToCare() {
  try {
    var caregiver_list_str = sessionStorage.getItem('caregiverWaiting') || '[]';
    var caregiver_arr = JSON.parse(caregiver_list_str);
    var item_index = caregiver_arr.indexOf(profileTreeId);
    var is_present = (item_index !== -1) ? true : false;
    if (is_present) {
      caregiver_arr.splice(item_index, 1);
      showActionModal('Removed from Care waiting list', 'Tree ' + (profileTreeId || '') + ' has been removed from your Care waiting list.', false);
    } else {
      caregiver_arr.push(profileTreeId);
      showActionModal('Added to Care seeing list', 'Tree ' + (profileTreeId || '') + ' has been added to your Care seeing list.', true);
      appendToGobackExclude(profileTreeId);
    }
    sessionStorage.setItem('caregiverWaiting', JSON.stringify(caregiver_arr));
  } catch (e) {}
  updateCareButtonState();
}
function addToSurveyRequest() {
  try {
    var surveyor_list_str = sessionStorage.getItem('surveyorSurveyWaiting') || '[]';
    var surveyor_arr = JSON.parse(surveyor_list_str);
    var item_index = surveyor_arr.indexOf(profileTreeId);
    var is_present = (item_index !== -1) ? true : false;
    if (is_present) {
      surveyor_arr.splice(item_index, 1);
      showActionModal('Removed from Survey request list', 'Tree ' + (profileTreeId || '') + ' has been removed from your Survey request list.', false);
    } else {
      surveyor_arr.push(profileTreeId);
      showActionModal('Added to Survey request list', 'Tree ' + (profileTreeId || '') + ' has been added to your Survey request list.', true);
      appendToGobackExclude(profileTreeId);
    }
    sessionStorage.setItem('surveyorSurveyWaiting', JSON.stringify(surveyor_arr));
  } catch (e) {}
  updateSurveyorButtonState();
}

function addToComplaint() { 
  var userid_q = new URLSearchParams(location.search).get("userid") || "";
  var url =
    "complaint.html?treeId=" +
    encodeURIComponent(profileTreeId) +
    "&parent=" +
    encodeURIComponent("tree-profile.html" + location.search);
  if (userid_q) url += "&userid=" + encodeURIComponent(userid_q);
  window.location.href = url;
}


// --- everything else below for vetting ---
var albumData = [];
var urlFLang = new URLSearchParams(location.search).get('flang');
if (urlFLang) setFilterLang(urlFLang);
function goTo(page) {
  document.querySelectorAll('.page').forEach(function(p){ p.classList.remove('active'); });
  document.getElementById('page-'+page).classList.add('active');
  document.getElementById('sbar').className = 'status-bar blue';
}
function formatDate(iso) { var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso); var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return m? parseInt(m[3],10)+' '+months[parseInt(m[2],10)-1]+' '+m[1] : iso; }
function renderLogs(tree) {
  var wrap=document.getElementById('profile-logs'); wrap.innerHTML='';
  var enc_keys = Object.keys(tree['encounters-list'] || {});
  for(var idx=enc_keys.length-1; idx>=0; idx--){ var key=enc_keys[idx]; var e=tree['encounters-list'][key]; var hs=e['health-status']||{}; var c={encounter:key, date:e.registeredDate||e.updatedDate, registeredBy:e.registeredBy, updatedBy:e.updatedBy, registererId:e.registererId, updaterId:e.updaterId, height:formatLength(hs.height,'height'), diam:formatLength(hs.diameter,'diameter'), health:hs.health, note:(e.fieldObservation&&e.fieldObservation.notes), recommendations:(e.fieldObservation&&e.fieldObservation.recommendations), photos:((e.photos&&e.photos.snapshots)||[]).length, emoji:e.thumb||tree.emoji}; var who_name = String(c.encounter)==='1' ? c.registeredBy : c.updatedBy; var who_id = String(c.encounter)==='1' ? c.registererId : c.updaterId; var entry=document.createElement('div'); entry.className='log-entry'; var thumbs_html=''; for(var p=0;p<c.photos;p++){ var bg_arr=['linear-gradient(135deg,#2d5a1b,#4a7c2f)','linear-gradient(135deg,#1a3a0a,#2d5a1b)','linear-gradient(135deg,#3B6D11,#639922)']; var bg=bg_arr[p%bg_arr.length]; var emoji_arr=['🌳','🌴','🌲','🍃','🌱','🌿','🍀','🌵']; var emoji=emoji_arr[p%emoji_arr.length]; thumbs_html+='<div class="log-thumb" style="background:'+bg+'" onclick="event.stopPropagation(); openPhotoModal(\''+emoji+'\', \''+bg+'\')">'+emoji+'<button class="zoom-btn" type="button" onclick="event.stopPropagation(); openPhotoModal(\''+emoji+'\', \''+bg+'\')"><i class="ti ti-zoom-in zoom-btn-icon"></i></button></div>'; } entry.innerHTML='<div class="log-header"><span>#'+c.encounter+'</span><span>'+formatDate(c.date)+'</span></div><div class="log-who-line">'+who_name+' · '+who_id+'</div><div class="health-stats-row"><div class="health-inline health-'+c.health+'">'+c.health+'</div><div class="tree-stats"><span>📏 '+c.height+'</span><span>⭕ '+c.diam+'</span></div></div><div class="photo-scroll-wrap"><button class="photo-scroll-arrow left" type="button" onclick="event.stopPropagation(); this.nextElementSibling.scrollBy({left:-88,behavior:\'smooth\'})"><i class="ti ti-chevron-left"></i></button><div class="photo-scroll">'+thumbs_html+'</div><button class="photo-scroll-arrow right" type="button" onclick="event.stopPropagation(); this.previousElementSibling.scrollBy({left:88,behavior:\'smooth\'})"><i class="ti ti-chevron-right"></i></button></div>'; wrap.appendChild(entry); }
}
function cardNameText(card, lang_key) { function nn(a){ return (Array.isArray(a)&&a.length) ? a : null; } if(!card) return []; var sci=String(card.scientificName||''); var db=(window.TREE_NAMES_DB||[]); for(var i=0;i<db.length;i++){ var names=db[i][sci]||{}; var n=names[lang_key]||names.en||[]; if(Array.isArray(n)&&n.length) return n; } return nn(card.scientificName)||[]; }
function cardAddressText(card, lang_key) { return (card&&card.pincode)||''; }
function closeMapModal() { document.getElementById('map-modal').classList.remove('open'); document.getElementById('map-frame').src=''; }
function openPhotoModal(emoji, bg) { var m=document.getElementById('photo-modal'); var e=document.getElementById('photo-modal-emoji'); if(e) e.textContent=emoji||'🌳'; if(m){ m.style.background=bg||'rgba(0,0,0,0.9)'; m.classList.add('open'); } }
function closePhotoModal() { var m=document.getElementById('photo-modal'); if(m) m.classList.remove('open'); }
function openAlbum(key) { var tree=(window.__TREE_DATA||[]).find(function(t){return t.treeId===profileTreeId})||findTree(profileTreeId); var enc=tree&&tree['encounters-list']&&tree['encounters-list'][key]; if(!enc||!enc.photos||!enc.photos.snapshots||!enc.photos.snapshots.length) return; var hs=enc['health-status']||{}; var log={date:enc.registeredDate||enc.updatedDate, height:hs.height, diam:hs.diameter, photos:enc.photos.snapshots.length, note:(enc.fieldObservation&&enc.fieldObservation.notes), emoji:enc.thumb||tree.emoji}; document.getElementById('album-title').textContent='Log · '+formatDate(log.date); document.getElementById('album-date').textContent=formatDate(log.date); document.getElementById('album-h').textContent=log.height; document.getElementById('album-d').textContent=log.diam; document.getElementById('album-c').textContent=log.photos+' photo'+(log.photos===1?'':'s'); document.getElementById('album-note').textContent=log.note; var grid=document.getElementById('album-grid-page'); grid.innerHTML=''; var bgs=['linear-gradient(135deg,#2d5a1b,#4a7c2f)','linear-gradient(135deg,#1a3a0a,#2d5a1b)','linear-gradient(135deg,#3B6D11,#639922)','linear-gradient(135deg,#1e3d0f,#2d5a1b)','linear-gradient(135deg,#27500A,#3B6D11)']; for(var p=0;p<log.photos;p++){ var div=document.createElement('div'); div.className='album-photo'+(p===0?' album-photo-main':''); div.style.background=bgs[(parseInt(key)+p)%bgs.length]; div.innerHTML='<div style="font-size:'+(p===0?'38px':'26px')+'">'+(log.emoji||tree.emoji||'🌳')+'</div><div class="photo-label">Photo '+(p+1)+'</div>'; grid.appendChild(div); } goTo('album'); }
function normalizeAlbum(t) { var out={}; for(var k in t) if(Object.prototype.hasOwnProperty.call(t,k)) out[k]=t[k]; var enc=t['encounters-list']||{}; var keys=Object.keys(enc); var last=enc[keys[keys.length-1]]||{}; var st=last['health-status']||{}; var c=t.card||{}; out.id=t.treeId; out.name=(Array.isArray(cardNameText(t,'en')) ? (cardNameText(t,'en')[0]||'') : (cardNameText(t,'en')||'')) || c.addr || ''; out.emoji=t.emoji||c.emoji||'🌳'; out.bg=t.bg||c.bg||''; out.pincode=t.pincode||''; out.height=st.height||c.height||'—'; out.diameter=st.diameter||c.diameter||'—'; out.health=st.health||''; out.logs=t.encounters||keys.length||c.logs||0; out.cards=keys.map(function(key){ var e=enc[key]; var hs=e['health-status']||{}; return {encounter:key, date:e.registeredDate||e.updatedDate||'—', registeredBy:e.registeredBy||e.updatedBy||'—', height:hs.height||'—', diam:hs.diameter||'—', health:hs.health||'', score:hs['health-score'], emoji:e.thumb||t.emoji||'🌳', note:(e.fieldObservation&&e.fieldObservation.notes)||'', recommendations:(e.fieldObservation&&e.fieldObservation.recommendations)||'', photos:((e.photos&&e.photos.snapshots)||[]).length}; }); return out; }
function getCurrentRoleType() { var urlRole=new URLSearchParams(location.search).get('role'); var userid_q=new URLSearchParams(location.search).get('userid'); var parent_q=new URLSearchParams(location.search).get('parent')||''; if(urlRole){ var r=String(urlRole).toLowerCase(); if(r.indexOf('sponsor')===0||r.indexOf('spn')===0) return 'sponsor'; if(r.indexOf('care')===0||r.indexOf('car')===0) return 'caregiver'; if(r.indexOf('surveyor')===0||r.indexOf('svy')===0) return 'surveyor'; if(r.indexOf('ranger')===0||r.indexOf('ran')===0) return 'ranger'; return r; } if(parent_q && parent_q.toLowerCase().indexOf('surveyor')!==-1) return 'surveyor'; if(parent_q && parent_q.toLowerCase().indexOf('care-giver')!==-1) return 'caregiver'; if(parent_q && parent_q.toLowerCase().indexOf('sponsor')!==-1) return 'sponsor'; if(userid_q){ try{ var l=storage.get('login')||window._login||{}; var tl=l['tree-login']||{}; for(var k in tl) if(tl[k]&&tl[k].userId===userid_q){ var t=tl[k].type||k; if(t==='surveyor'||k==='surveyor'||String(userid_q).indexOf('SVY')===0) return 'surveyor'; return t==='sponsor'||k==='sponsor'?'sponsor':t==='surveyor'||k==='surveyor'?'surveyor':'caregiver'; } var s=sessionStorage.getItem('loginCredentialsV1'); if(s){ var c=JSON.parse(s); var tl2=c['tree-login']||{}; for(var k2 in tl2) if(tl2[k2]&&tl2[k2].userId===userid_q){ var t2=tl2[k2].type||k2; if(t2==='surveyor'||k2==='surveyor'||String(userid_q).indexOf('SVY')===0) return 'surveyor'; return t2==='sponsor'||k2==='sponsor'?'sponsor':'caregiver'; } } }catch(e){} if(String(userid_q).indexOf('SVY')===0) return 'surveyor'; if(String(userid_q).indexOf('CAR')===0) return 'caregiver'; if(String(userid_q).indexOf('SPN')===0) return 'sponsor'; } return null; }
function isOpenedFromDashboardList(role){ var sponsorArr=['sponsor-waiting-submitted','sponsor-current','sponsor-past','sponsor-next-due','sponsor-seeing','pay-logs-total','pay-logs-this_month','pay-logs','tree-logs','sponsor-pay-total','sponsor-pay-month','sponsor-pay-trees','sponsor-pay-tree']; var caregiverArr=['caregiver-waiting','caregiver-current','caregiver-past','caregiver-seeing','caregiver-checks-due','caregiver-checks-finished','caregiver-logs-approved','caregiver-logs-submitted','tree-logs']; var surveyorArr=['surveyor-my-current','surveyor-my-past','surveyor-tree-name-approved','surveyor-tree-name-submitted','surveyor-place-name-approved','surveyor-place-name-submitted','surveyor-register-log-approved','surveyor-register-log-submitted','surveyor-logs-approved','surveyor-logs-submitted','this-month-covered','this-month-waiting','this-month-log-approved','this-month-log-submitted','surveyor-survey-requests-approved','surveyor-survey-requests-submitted','trees']; var surveyorDashArr=['surveyor-dash']; var dashboardArr=['sponsor-dash','caregiver-dash']; var excludeArr=role==='caregiver' ? [caregiverArr] : role==='sponsor' ? [sponsorArr] : role==='surveyor' ? [surveyorArr] : [sponsorArr,caregiverArr,surveyorArr]; var parent=new URLSearchParams(location.search).get('parent')||''; try{ var goback=sessionStorage.getItem('gobackFromTreeProfile')||''; if(goback) parent+='|'+goback; }catch(e){} for(var i=0;i<excludeArr.length;i++) for(var j=0;j<excludeArr[i].length;j++) if(parent.indexOf(excludeArr[i][j])!==-1) return true; return false; }
function isOpenedFromSurveyorDashOnly(role){ if(role!=='surveyor') return false; var parent=new URLSearchParams(location.search).get('parent')||''; try{ var goback=sessionStorage.getItem('gobackFromTreeProfile')||''; if(goback) parent+='|'+goback; }catch(e){} var has_dash = parent.indexOf('surveyor-dash')!==-1; var has_list = parent.indexOf('surveyor-my-')!==-1 || parent.indexOf('surveyor-tree-')!==-1 || parent.indexOf('surveyor-place-')!==-1 || parent.indexOf('surveyor-register-')!==-1 || parent.indexOf('surveyor-logs-')!==-1; return has_dash && !has_list; }
function applyRoleVisibility() { var role=getCurrentRoleType(); var showCare=true; var showSponsor=true; var showSurvey=true; if(role==='sponsor'){ showCare=false; showSponsor=true; showSurvey=false; } else if(role==='caregiver'){ showCare=true; showSponsor=false; showSurvey=false; } else if(role==='surveyor'){ showCare=false; showSponsor=false; showSurvey=true; } else if(role==='ranger'){ showCare=false; showSponsor=false; showSurvey=false; } var careBtns=document.querySelectorAll('.add-care-btn, .care-cta'); var sponsorBtns=document.querySelectorAll('.add-sponsor-btn, .sponsor-cta'); var surveyBtns=document.querySelectorAll('.add-survey-btn, .survey-cta'); console.log('[tree-profile] role ->', role); careBtns.forEach(function(el){ el.style.display=showCare?'':'none'; }); sponsorBtns.forEach(function(el){ el.style.display=showSponsor?'':'none'; }); surveyBtns.forEach(function(el){ el.style.display=showSurvey?'':'none'; }); if(isOpenedFromDashboardList(role)){ if(role==='caregiver'){ careBtns.forEach(function(el){ el.style.display='none'; }); } else if(role==='sponsor'){ sponsorBtns.forEach(function(el){ el.style.display='none'; }); } else if(role==='surveyor'){ var is_dash_only = typeof isOpenedFromSurveyorDashOnly==='function' ? isOpenedFromSurveyorDashOnly(role) : false; var is_via_filter = (function(){ var p=new URLSearchParams(location.search).get('parent')||''; try{ var g=sessionStorage.getItem('gobackFromTreeProfile')||''; if(g) p+='|'+g; }catch(e){} return p.indexOf('filter.html')!==-1; })(); if(!is_dash_only && !is_via_filter) { surveyBtns.forEach(function(el){ el.style.display='none'; }); } } else if(role==='ranger'){ careBtns.forEach(function(el){ el.style.display='none'; }); sponsorBtns.forEach(function(el){ el.style.display='none'; }); surveyBtns.forEach(function(el){ el.style.display='none'; }); } else { sponsorBtns.forEach(function(el){ el.style.display='none'; }); careBtns.forEach(function(el){ el.style.display='none'; }); surveyBtns.forEach(function(el){ el.style.display='none'; }); } } }
window.render={ init:function(){ storage.syncTreeCards(); console.log('RAM __TREE_DATA', (window.__TREE_DATA||[]).length, (window.__TREE_DATA||[])[0]); albumData=(window.__TREE_DATA||[]).map(normalizeAlbum); console.log('RAM albumData', albumData.length, albumData[0]); renderProfile(); try{ applyRoleVisibility(); }catch(e){} } };
