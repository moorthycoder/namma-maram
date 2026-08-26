
var profileTreeId = new URLSearchParams(location.search).get("treeId") ;

// tree-profile.js — reordered for vetting: core fns top, helpers bottom
function findTree(id) {
  for (var i = 0; i < albumData.length; i++)
    if (albumData[i].treeId === id) return albumData[i];
  return null;
}

function renderProfile() {
  var id =  profileTreeId;
  document.getElementById('profile-id-label').textContent = id;
  var tree = findTree(id);
  if (!tree) return;
  var localAddr = cardAddressText(tree, filterLang);
  var last = tree.cards[tree.cards.length - 1] || {};
  var first = tree.cards[0] || {};
  document.getElementById('profile-hero-title').textContent = storage.treeNameIn(tree, filterLang);
  document.getElementById('profile-hero-addr').innerHTML = '<i class="ti ti-map-pin" style="font-size:0.6667rem"></i> ' + (localAddr || '') + ' <button class="map-pin-btn" type="button" onclick="openTreeMap()"><i class="ti ti-map-pin" style="font-size:0.8667rem"></i></button>';
  document.getElementById('profile-health-badge').textContent = tree.health ? tree.health.charAt(0).toUpperCase() + tree.health.slice(1) : '—';
  document.getElementById('profile-stat-height').textContent = parseFloat(last.height) || '—';
  document.getElementById('profile-stat-diam').textContent = parseInt(last.diam, 10) || '—';
  document.getElementById('profile-stat-logs').textContent = tree.logs;
  document.getElementById('profile-health-score').textContent = (typeof last.score === 'number' ? last.score : '—') + ' / 100';
  document.querySelector('.health-fill').style.width = (typeof last.score === 'number' ? last.score : 0) + '%';
  document.getElementById('profile-species').textContent = (tree.speciesName && tree.speciesName.sn) || '—';
  document.getElementById('profile-added-by').textContent = first.registeredBy || tree['care-giver'] || '—';
  document.getElementById('profile-first-logged').textContent = formatDate(first.date);
  document.getElementById('profile-total-logs').textContent = tree.logs + ' entries';
  renderLogs(tree);
  syncAddButtonStates();
}
function goBack(url) {
  var parent = url || new URLSearchParams(location.search).get('parent');
  if (parent) { window.location.href = parent; return; }
  if (window.history.length > 1) window.history.back(); else window.location.href = 'filter.html';
}
function updateLang(lang) {
  var l = lang || filterLang || 'en';
  try { setFilterLang(l); } catch (e) {}
  try { localStorage.setItem('nm-app-lang', l); } catch (e) {}
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
function syncAddButtonStates() {
  updateSponsorButtonState();
  updateCareButtonState();
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
      showActionModal('Added to Sponsor waiting list', 'Tree ' + (profileTreeId || '') + ' has been added to your Sponsor waiting list.', true);
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
      showActionModal('Added to Care waiting list', 'Tree ' + (profileTreeId || '') + ' has been added to your Care waiting list.', true);
    }
    sessionStorage.setItem('caregiverWaiting', JSON.stringify(caregiver_arr));
  } catch (e) {}
  updateCareButtonState();
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
function formatDate(iso) { var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||''); var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; return m? parseInt(m[3],10)+' '+months[parseInt(m[2],10)-1]+' '+m[1] : (iso||'—'); }
function renderLogs(tree) {
  var wrap=document.getElementById('profile-logs'); wrap.innerHTML=''; var dots=['#3B6D11','#9FE1CB','#C0DD97'];
  for(var i=tree.cards.length-1;i>=0;i--){ var c=tree.cards[i]; var prev=tree.cards[i-1]; var delta=(prev&&parseFloat(c.height)&&parseFloat(prev.height))? '+'+(parseFloat(c.height)-parseFloat(prev.height)).toFixed(1)+' m':''; var entry=document.createElement('div'); entry.className='log-entry'; entry.onclick=(function(idx){return function(){openAlbum(idx);};})(i); entry.innerHTML='<div class="log-dot" style="background:'+dots[i%3]+'"></div><div class="log-body"><div class="log-date">'+formatDate(c.date)+'</div><div class="log-text">'+c.height+' · '+c.diam+' diameter</div><div class="log-notes"><i class="ti ti-notes" style="font-size:0.7rem;flex-shrink:0"></i><span><b>Notes</b> '+(c.note||'—')+'</span></div><div class="log-recommendations"><i class="ti ti-clipboard-check" style="font-size:0.7rem;flex-shrink:0"></i><span><b>Recommendations</b> '+(c.recommendations||'—')+'</span></div><div class="log-chips">'+(delta?'<span class="chip">'+delta+'</span>':'')+(c.photos?'<span class="chip-blue"><i class="ti ti-photo" style="font-size:0.6667rem"></i>'+c.photos+' photo'+(c.photos>1?'s':'')+'</span>':'<span style="font-size:0.6667rem;color:var(--color-text-secondary);font-style:italic;">No photos</span>')+'</div></div><div class="log-thumb" style="background:'+(tree.bg||'#2d4a2d')+';">'+(c.emoji||tree.emoji||'🌳')+'</div>'; wrap.appendChild(entry); }
}
function cardNameText(card, lang_key) { var names=(card&&card.speciesName)||{}; return names[lang_key]||names.en||names.ta||''; }
function cardAddressText(card, lang_key) { var addr=(card&&card.address)||{}; return addr[lang_key]||addr.en||addr.ta||''; }
function openTreeMap() { var tree=findTree(profileTreeId); if(hasTreeGis(tree)) showInMap([tree.treeId]); else alert('Location not available for this tree.'); }
function closeMapModal() { document.getElementById('map-modal').classList.remove('open'); document.getElementById('map-frame').src=''; }
function openAlbum(i) { var tree=findTree(profileTreeId); var log=tree&&tree.cards[i]; if(!log||!log.photos) return; document.getElementById('album-title').textContent='Log · '+formatDate(log.date); document.getElementById('album-date').textContent=formatDate(log.date); document.getElementById('album-h').textContent=log.height; document.getElementById('album-d').textContent=log.diam; document.getElementById('album-c').textContent=log.photos+' photo'+(log.photos===1?'':'s'); document.getElementById('album-note').textContent=log.note; var grid=document.getElementById('album-grid-page'); grid.innerHTML=''; var bgs=['linear-gradient(135deg,#2d5a1b,#4a7c2f)','linear-gradient(135deg,#1a3a0a,#2d5a1b)','linear-gradient(135deg,#3B6D11,#639922)','linear-gradient(135deg,#1e3d0f,#2d5a1b)','linear-gradient(135deg,#27500A,#3B6D11)']; for(var p=0;p<log.photos;p++){ var div=document.createElement('div'); div.className='album-photo'+(p===0?' album-photo-main':''); div.style.background=bgs[(i+p)%bgs.length]; div.innerHTML='<div style="font-size:'+(p===0?'38px':'26px')+'">'+(log.emoji||tree.emoji||'🌳')+'</div><div class="photo-label">Photo '+(p+1)+'</div>'; grid.appendChild(div); } goTo('album'); }
function normalizeAlbum(t) { var out={}; for(var k in t) if(Object.prototype.hasOwnProperty.call(t,k)) out[k]=t[k]; var enc=t['encounters-list']||{}; var keys=Object.keys(enc); var last=enc[keys[keys.length-1]]||{}; var st=last['health-status']||{}; var c=t.card||{}; out.id=t.treeId; out.name=cardNameText(t,'en')||c.addr||''; out.emoji=t.emoji||c.emoji||'🌳'; out.bg=t.bg||c.bg||''; out.pincode=t.pincode||''; out.height=st.height||c.height||'—'; out.diameter=st.diameter||c.diameter||'—'; out.health=st.health||''; out.logs=t.encounters||keys.length||c.logs||0; out.cards=keys.map(function(key){ var e=enc[key]; var hs=e['health-status']||{}; return {encounter:key, date:e.registeredDate||e.updatedDate||'—', registeredBy:e.registeredBy||e.updatedBy||'—', height:hs.height||'—', diam:hs.diameter||'—', health:hs.health||'', score:hs['health-score'], emoji:e.thumb||t.emoji||'🌳', note:(e.fieldObservation&&e.fieldObservation.notes)||'', recommendations:(e.fieldObservation&&e.fieldObservation.recommendations)||'', photos:((e.photos&&e.photos.snapshots)||[]).length}; }); return out; }
function getCurrentRoleType() { var urlRole=new URLSearchParams(location.search).get('role'); if(urlRole){ var r=String(urlRole).toLowerCase(); return r.indexOf('sponsor')===0||r.indexOf('spn')===0?'sponsor':r.indexOf('care')===0||r.indexOf('car')===0?'caregiver':r; } var userid_q=new URLSearchParams(location.search).get('userid'); if(userid_q){ try{ var l=storage.get('login')||window._login||{}; var tl=l['tree-login']||{}; for(var k in tl) if(tl[k]&&tl[k].userId===userid_q){ var t=tl[k].type||k; return t==='sponsor'||k==='sponsor'?'sponsor':'caregiver'; } var s=sessionStorage.getItem('loginCredentialsV1'); if(s){ var c=JSON.parse(s); var tl2=c['tree-login']||{}; for(var k2 in tl2) if(tl2[k2]&&tl2[k2].userId===userid_q){ var t2=tl2[k2].type||k2; return t2==='sponsor'||k2==='sponsor'?'sponsor':'caregiver'; } } }catch(e){} } return null; }
function applyRoleVisibility() { var role=getCurrentRoleType(); var showCare=true; var showSponsor=true; if(role==='sponsor'){ showCare=false; showSponsor=true; } else if(role==='caregiver'){ showCare=true; showSponsor=false; } var careBtns=document.querySelectorAll('.add-care-btn, .care-cta'); var sponsorBtns=document.querySelectorAll('.add-sponsor-btn, .sponsor-cta'); careBtns.forEach(function(el){ el.style.display=showCare?'':'none'; }); sponsorBtns.forEach(function(el){ el.style.display=showSponsor?'':'none'; }); }
window.render={ init:function(){ storage.syncTreeCards(); albumData=(window.__TREE_DATA||[]).map(normalizeAlbum); renderProfile(); try{ applyRoleVisibility(); }catch(e){} } };
