// register-a-tree-flow.js — shared Register A Tree flow, injected into any role page on load.

var registerFlowCSS = "\n\
  .steps { display: flex; align-items: center; justify-content: center; padding: 10px 20px 0; flex-shrink: 0; }\n\
  .step-dot { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7333rem; font-weight: 500; }\n\
  .step-dot.active { background: var(--color-theme); color: #fff; box-shadow: 0 0 0 3px rgba(59,109,17,0.2); }\n\
  .step-dot.done { background: var(--color-theme); color: #fff; }\n\
  .step-dot.pending { background: var(--color-background-secondary); color: var(--color-text-secondary); }\n\
  .step-line { flex: 1; height: 1.5px; background: var(--color-border-tertiary); margin: 0 4px; }\n\
  .step-line.done { background: var(--color-theme); }\n\
  .step-labels { display: flex; justify-content: space-between; padding: 3px 8px 0; flex-shrink: 0; }\n\
  .step-lbl { font-size: 0.6667rem; color: var(--color-text-secondary); text-align: center; width: 60px; }\n\
  .step-lbl.active { color: var(--color-theme); font-weight: 500; }\n\
  .flow-scroll { padding: 12px 13px; display: flex; flex-direction: column; gap: 10px; min-height: 100%; }\n\
  .flow-note { font-size: 0.8rem; color: var(--color-text-secondary); text-align: center; }\n\
  .camera-box { width: 100%; aspect-ratio: 4/3; border-radius: 12px; background: #111; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }\n\
  .capture-btn { width: 48px; height: 48px; border-radius: 50%; background: #fff; border: 3px solid rgba(255,255,255,0.4); cursor: pointer; display: flex; align-items: center; justify-content: center; position: absolute; bottom: 12px; }\n\
  .capture-inner { width: 34px; height: 34px; border-radius: 50%; background: #fff; border: 2px solid #ddd; }\n\
  .selfie-cam { background: #000; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; flex: 1; min-height: 0; margin-bottom: 12px; }\n\
  .cam-btn { width: 60px; height: 60px; border-radius: 50%; background: #fff; border: 4px solid rgba(255,255,255,0.35); cursor: pointer; display: flex; align-items: center; justify-content: center; color: #111; font-size: 1.4rem; margin: 12px auto; flex-shrink: 0; }\n\
  .photo-panel { width: 100%; aspect-ratio: 4/3; border-radius: 10px; background: var(--color-background-secondary); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; margin-bottom: 12px; }\n\
  .photo-panel img { width: 100%; height: 100%; object-fit: cover; display: block; }\n\
  .photo-empty { font-size: 0.8667rem; color: var(--color-text-secondary); }\n\
  .photo-fill { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-size: 2.2rem; background: linear-gradient(160deg, #1a2a1a, #0d1a0d); }\n\
  .selfie-full { width: 100%; flex: 1; min-height: 0; background: #111; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }\n\
  .data-panel { background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 10px 12px; margin-bottom: 12px; }\n\
  .data-panel-title { font-size: 0.6667rem; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.4px; margin-bottom: 6px; display: flex; align-items: center; gap: 5px; }\n\
  .data-row { display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 4px; }\n\
  .data-row:last-child { margin-bottom: 0; }\n\
  .data-key { color: var(--color-text-secondary); }\n\
  .data-val { color: var(--color-text-primary); font-weight: 500; }\n\
  .snap-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }\n\
  .snap-tile { aspect-ratio: 1; border-radius: 10px; overflow: hidden; position: relative; background: var(--color-background-secondary); }\n\
  .snap-tile .photo-fill, .review-grid-item .photo-fill { font-size: 1.4rem; }\n\
  .snap-del { position: absolute; top: 5px; right: 5px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.65); color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; z-index: 2; }\n\
  .snap-add { aspect-ratio: 1; border-radius: 10px; border: 1.5px dashed var(--color-border-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); font-size: 1.6rem; background: var(--color-background-primary); }\n\
  .snap-strip { display: flex; gap: 8px; overflow-x: auto; -webkit-overflow-scrolling: touch; }\n\
  .snap-thumb { width: 64px; height: 64px; border-radius: 8px; overflow: hidden; position: relative; flex-shrink: 0; background: var(--color-background-secondary); border: 2px solid transparent; cursor: pointer; }\n\
  .snap-thumb.sel { border-color: var(--color-theme); }\n\
  .snap-thumb .photo-fill { font-size: 1.4rem; color: #fff; }\n\
  #snapshot-preview .photo-fill { color: #fff; }\n\
  .snap-thumb-add { width: 64px; height: 64px; border-radius: 8px; border: 1.5px dashed var(--color-border-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); font-size: 1.4rem; background: var(--color-background-primary); flex-shrink: 0; }\n\
  .snap-thumb-del { position: absolute; top: 3px; right: 3px; width: 20px; height: 20px; border-radius: 50%; background: rgba(0,0,0,0.65); color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.7rem; z-index: 2; }\n\
  .field-wrap { position: relative; margin-bottom: 12px; }\n\
  .field-input { width: 100%; padding: 10px 36px 10px 12px; border-radius: var(--border-radius-md); border: 1.5px solid var(--color-theme); font-size: 0.9333rem; background: var(--color-background-primary); color: var(--color-text-primary); outline: none; }\n\
  .field-input.normal { border-color: var(--color-border-secondary); font-family: var(--font-sans); letter-spacing: normal; font-weight: 400; font-size: 0.8667rem; }\n\
  .field-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: var(--color-text-secondary); background: none; border: none; cursor: pointer; padding: 0; }\n\
  .field-label { font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }\n\
  .notes-box { width: 100%; padding: 9px 11px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); font-size: 0.8rem; color: var(--color-text-primary); background: var(--color-background-primary); resize: none; font-family: var(--font-sans); line-height: 1.5; height: 96px; outline: none; }\n\
  .review-section { margin-bottom: 16px; }\n\
  .review-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }\n\
  .review-title { font-size: 0.9333rem; font-weight: 600; color: var(--color-text-primary); display: flex; align-items: center; gap: 6px; }\n\
  .review-edit { background: none; border: none; color: var(--color-theme); cursor: pointer; font-size: 0.8rem; display: flex; align-items: center; gap: 4px; font-weight: 500; }\n\
  .review-selfie { width: 100%; aspect-ratio: 4/3; border-radius: 10px; overflow: hidden; background: var(--color-background-secondary); position: relative; }\n\
  .review-selfie img { width: 100%; height: 100%; object-fit: cover; display: block; }\n\
  .review-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }\n\
  .review-grid-item { aspect-ratio: 1; border-radius: 8px; overflow: hidden; position: relative; background: var(--color-background-secondary); }\n\
  .review-text { font-size: 0.8rem; color: var(--color-text-primary); line-height: 1.5; background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 10px 12px; }\n\
  .review-empty { font-size: 0.8rem; color: var(--color-text-secondary); font-style: italic; }\n\
  .flow-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n\
  .gis-overlay { position: absolute; left: 0; right: 0; bottom: 0; background: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.78)); padding: 22px 10px 8px; color: #fff; }\n\
  .gis-overlay-body { display: flex; gap: 8px; align-items: stretch; }\n\
  .gis-overlay-map { flex: 1; height: 48px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.35); background: linear-gradient(135deg, #d9e8c9, #a9c48f); position: relative; overflow: hidden; }\n\
  .gis-overlay-map::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.5); }\n\
  .gis-overlay-map::after { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.5); }\n\
  .gis-overlay-right { flex: 2; display: flex; flex-direction: column; gap: 4px; min-width: 0; }\n\
  .gis-overlay-address { font-size: 0.7rem; line-height: 1.3; display: flex; align-items: flex-start; gap: 4px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }\n\
  .gis-overlay-row { font-size: 0.7rem; display: flex; align-items: center; gap: 5px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }\n\
  .gis-overlay-pin { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); color: #d64541; font-size: 1.2rem; }\n\
  .success-top { background: var(--color-theme-light); padding: 24px 20px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; flex-shrink: 0; }\n\
  .check-ring { width: 58px; height: 58px; border-radius: 50%; background: var(--color-theme); display: flex; align-items: center; justify-content: center; }\n\
  @keyframes popIn { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }\n\
  .check-ring { animation: popIn 0.5s ease forwards; }\n";

var registerFlowPages = "\n\
<div class=\"page\" id=\"page-selfie\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Selfie with Tree</span><span class=\"topbar-step\">Step 1 of 4</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot active\">1</div><div class=\"step-line\"></div><div class=\"step-dot pending\">2</div><div class=\"step-line\"></div><div class=\"step-dot pending\">3</div><div class=\"step-line\"></div><div class=\"step-dot pending\">4</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl active\">Selfie</span><span class=\"step-lbl\">Snapshots</span><span class=\"step-lbl\">Notes</span><span class=\"step-lbl\">Review</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div class=\"selfie-cam\">\n\
      <div class=\"selfie-full\" id=\"selfie-panel\"></div>\n\
      <button class=\"cam-btn\" onclick=\"captureRegisterSelfie()\"><i class=\"ti ti-camera\"></i></button>\n\
    </div>\n\
    <input id=\"register-address\" type=\"text\" value=\"\" hidden />\n\
    <div>\n\
      <div class=\"field-label\"><i class=\"ti ti-hash\"></i> Tree ID</div>\n\
      <input id=\"register-tree-id\" class=\"field-input normal\" type=\"text\" value=\"\" placeholder=\"e.g. 625501-06-0001\" />\n\
    </div>\n\
    <div>\n\
      <div class=\"field-label\"><i class=\"ti ti-leaf\"></i> Scientific name</div>\n\
      <input id=\"register-scientific-name\" class=\"field-input normal\" type=\"text\" value=\"\" placeholder=\"e.g. Samanea saman\" />\n\
    </div>\n\
    <div class=\"flow-nav\"><button class=\"ghost-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i> Back</button><button class=\"green-btn\" onclick=\"goTo('snapshots')\"><i class=\"ti ti-arrow-right\"></i> Next</button></div>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-snapshots\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo('selfie')\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Snapshots of Tree</span><span class=\"topbar-step\">Step 2 of 4</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot done\"><i class=\"ti ti-check\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot active\">2</div><div class=\"step-line\"></div><div class=\"step-dot pending\">3</div><div class=\"step-line\"></div><div class=\"step-dot pending\">4</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl\">Selfie</span><span class=\"step-lbl active\">Snapshots</span><span class=\"step-lbl\">Notes</span><span class=\"step-lbl\">Review</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div class=\"selfie-cam\">\n\
      <div class=\"selfie-full\" id=\"snapshot-panel\">\n\
        <div id=\"snapshot-preview\"></div>\n\
        <div class=\"gis-overlay\">\n\
          <div class=\"snap-strip\" id=\"snap-strip\"></div>\n\
        </div>\n\
      </div>\n\
      <button class=\"cam-btn\" onclick=\"addRegisterSnapshot()\"><i class=\"ti ti-camera\"></i></button>\n\
    </div>\n\
    <div class=\"flow-nav\"><button class=\"ghost-btn\" onclick=\"goTo('selfie')\"><i class=\"ti ti-arrow-left\"></i> Back</button><button class=\"green-btn\" onclick=\"goTo('notes')\"><i class=\"ti ti-arrow-right\"></i> Next</button></div>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-notes\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo('snapshots')\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Field Notes</span><span class=\"topbar-step\">Step 3 of 4</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot done\"><i class=\"ti ti-check\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot done\"><i class=\"ti ti-check\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot active\">3</div><div class=\"step-line\"></div><div class=\"step-dot pending\">4</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl\">Selfie</span><span class=\"step-lbl\">Snapshots</span><span class=\"step-lbl active\">Notes</span><span class=\"step-lbl\">Review</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div><div class=\"field-label\"><i class=\"ti ti-notes\"></i> Observation</div><textarea class=\"notes-box\" id=\"register-observations\" placeholder=\"e.g. New shoots visible, no signs of disease...\"></textarea></div>\n\
    <div><div class=\"field-label\"><i class=\"ti ti-clipboard-check\"></i> Recommendation</div><textarea class=\"notes-box\" id=\"register-recommendations\" placeholder=\"e.g. Fertilize before monsoon...\"></textarea></div>\n\
    <div class=\"flow-nav\"><button class=\"ghost-btn\" onclick=\"goTo('snapshots')\"><i class=\"ti ti-arrow-left\"></i> Back</button><button class=\"green-btn\" onclick=\"openRegisterReview()\"><i class=\"ti ti-arrow-right\"></i> Next</button></div>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-review\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo('notes')\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Review Register</span><span class=\"topbar-step\">Step 4 of 4</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot done\"><i class=\"ti ti-check\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot done\"><i class=\"ti ti-check\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot done\"><i class=\"ti ti-check\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot active\">4</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl\">Selfie</span><span class=\"step-lbl\">Snapshots</span><span class=\"step-lbl\">Notes</span><span class=\"step-lbl active\">Review</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div class=\"review-section\">\n\
      <div class=\"review-head\"><span class=\"review-title\"><i class=\"ti ti-user\"></i> Selfie with Tree</span><button class=\"review-edit\" onclick=\"goTo('selfie')\"><i class=\"ti ti-pencil\"></i> Edit</button></div>\n\
      <div class=\"review-selfie\" id=\"review-selfie\"></div>\n\
    </div>\n\
    <div class=\"review-section\">\n\
      <div class=\"review-head\"><span class=\"review-title\"><i class=\"ti ti-camera\"></i> Snapshots</span><button class=\"review-edit\" onclick=\"goTo('snapshots')\"><i class=\"ti ti-pencil\"></i> Edit</button></div>\n\
      <div class=\"review-grid\" id=\"review-grid\"></div>\n\
    </div>\n\
    <div class=\"review-section\">\n\
      <div class=\"review-head\"><span class=\"review-title\"><i class=\"ti ti-notes\"></i> Field Notes</span><button class=\"review-edit\" onclick=\"goTo('notes')\"><i class=\"ti ti-pencil\"></i> Edit</button></div>\n\
      <div class=\"review-text\" id=\"review-observations\"></div>\n\
      <div class=\"review-text\" style=\"margin-top:8px\" id=\"review-recommendations\"></div>\n\
    </div>\n\
    <div class=\"flow-nav\"><button class=\"ghost-btn\" onclick=\"goTo('notes')\"><i class=\"ti ti-arrow-left\"></i> Back</button><button class=\"green-btn\" onclick=\"saveRegisterTree()\"><i class=\"ti ti-device-floppy\"></i> Save</button></div>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-success\">\n\
  <div class=\"success-top\">\n\
    <div class=\"check-ring\"><i class=\"ti ti-check\" style=\"font-size:1.8667rem;color:var(--color-theme-light)\"></i></div>\n\
    <div style=\"font-size:1.1333rem;font-weight:500;color:#27500A;\">Tree registered!</div>\n\
    <div style=\"font-size:0.8rem;color:#3B6D11;text-align:center;line-height:1.5;\">Tree registered successfully.</div>\n\
  </div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <button class=\"green-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-layout-dashboard\"></i> Back to dashboard</button>\n\
  </div>\n\
</div>\n";

var registerSelfie = '';
var registerSnapshots = [];
var registerObservations = '';
var registerRecommendations = '';
var registerSnapshotLimit = 10;
var registerSelectedSnapshot = -1;
var registerGisLat = '';
var registerGisLng = '';

function injectRegisterFlow() {
  var existing = document.getElementById('page-selfie');
  if (!existing) {
    var styleEl = document.createElement('style');
    styleEl.id = 'register-flow-style';
    styleEl.textContent = registerFlowCSS;
    document.head.appendChild(styleEl);
    var screen = document.querySelector('.screen');
    if (screen) screen.insertAdjacentHTML('beforeend', registerFlowPages);
  }
}

function captureRegisterSelfie() {
  var nowStamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  registerSelfie = 'selfie-' + nowStamp + '.jpg';
  registerGisLat = '10.052928';
  registerGisLng = '78.118502';
  var addressEl = document.getElementById('register-address');
  if (addressEl) addressEl.value = 'Mettupatti Sugar Mill School, 625501, Tamil Nadu';
  renderRegisterGis();
  renderRegisterSelfie();
}

function renderRegisterGis() {
  var latEl = document.getElementById('gis-lat');
  if (latEl) latEl.textContent = registerGisLat || '—';
  var lngEl = document.getElementById('gis-lng');
  if (lngEl) lngEl.textContent = registerGisLng || '—';
}

function buildRegisterSelfiePreview() {
  var addressEl = document.getElementById('register-address');
  var address = addressEl ? addressEl.value : 'Anna Nagar, Chennai';
  return '<div class="photo-fill">📸</div>' +
    '<div class="gis-overlay">' +
    '<div class="gis-overlay-body">' +
    '<div class="gis-overlay-map"><i class="ti ti-map-pin gis-overlay-pin"></i></div>' +
    '<div class="gis-overlay-right">' +
    '<div class="gis-overlay-address"><i class="ti ti-map-pin"></i> ' + address + '</div>' +
    '<div class="gis-overlay-row"><i class="ti ti-gps"></i> ' + registerGisLat + ', ' + registerGisLng + '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<button class="snap-del" onclick="clearRegisterSelfie()"><i class="ti ti-x"></i></button>';
}

function renderRegisterSelfie() {
  var panel = document.getElementById('selfie-panel');
  if (!panel) { return; }
  panel.innerHTML = registerSelfie
    ? buildRegisterSelfiePreview()
    : '<div class="photo-fill"><i class="ti ti-camera"></i></div>';
}

function clearRegisterSelfie() {
  registerSelfie = '';
  renderRegisterSelfie();
}

function addRegisterSnapshot() {
  if (registerSnapshots.length >= registerSnapshotLimit) { return; }
  var nowStamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  registerSnapshots.push({ file: 'snapshot-' + nowStamp + '-' + (registerSnapshots.length + 1) + '.jpg', num: parseInt(nowStamp.slice(12), 10) });
  registerSelectedSnapshot = registerSnapshots.length - 1;
  renderRegisterSnapStrip();
}

function removeRegisterSnapshot(index) {
  if (index < 0 || index >= registerSnapshots.length) { return; }
  registerSnapshots.splice(index, 1);
  if (registerSelectedSnapshot >= registerSnapshots.length) {
    registerSelectedSnapshot = registerSnapshots.length - 1;
  }
  renderRegisterSnapStrip();
}

function selectRegisterSnapshot(index) {
  if (index < 0 || index >= registerSnapshots.length) { return; }
  registerSelectedSnapshot = index;
  renderRegisterSnapStrip();
}

function renderRegisterSnapStrip() {
  var strip = document.getElementById('snap-strip');
  if (!strip) { return; }
  var thumbs = registerSnapshots.map(function (snap, index) {
    var selClass = index === registerSelectedSnapshot ? ' sel' : '';
    return '<div class="snap-thumb' + selClass + '" onclick="selectRegisterSnapshot(' + index + ')">' +
      '<button class="snap-thumb-del" onclick="event.stopPropagation();removeRegisterSnapshot(' + index + ')"><i class="ti ti-x"></i></button>' +
      '<div class="photo-fill">' + snap.num + '</div></div>';
  });
  if (registerSnapshots.length < registerSnapshotLimit) {
    thumbs.push('<div class="snap-thumb-add" onclick="addRegisterSnapshot()"><i class="ti ti-camera"></i></div>');
  }
  strip.innerHTML = thumbs.join('');
  renderRegisterSnapshotPanel();
}

function renderRegisterSnapshotPanel() {
  var preview = document.getElementById('snapshot-preview');
  if (!preview) { return; }
  if (registerSnapshots.length === 0) {
    preview.innerHTML = '<div class="photo-fill"><i class="ti ti-camera"></i></div>';
    return;
  }
  if (registerSelectedSnapshot < 0) { registerSelectedSnapshot = 0; }
  preview.innerHTML = '<button class="snap-del" onclick="removeRegisterSnapshot(' + registerSelectedSnapshot + ')"><i class="ti ti-x"></i></button>' +
    '<div class="photo-fill">' + registerSnapshots[registerSelectedSnapshot].num + '</div>';
}

function openRegisterReview() {
  var observationsEl = document.getElementById('register-observations');
  var recommendationsEl = document.getElementById('register-recommendations');
  if (observationsEl) registerObservations = observationsEl.value;
  if (recommendationsEl) registerRecommendations = recommendationsEl.value;
  renderRegisterReview();
  goTo('review');
}

function renderRegisterReview() {
  var selfieEl = document.getElementById('review-selfie');
  if (selfieEl) {
    selfieEl.innerHTML = registerSelfie
      ? buildRegisterSelfiePreview()
      : '<span class="review-empty">No selfie captured</span>';
  }
  var gridEl = document.getElementById('review-grid');
  if (gridEl) {
    gridEl.innerHTML = registerSnapshots.length
      ? registerSnapshots.map(function () { return '<div class="review-grid-item"><div class="photo-fill">🌳</div></div>'; }).join('')
      : '<span class="review-empty">No snapshots captured</span>';
  }
  var observationsEl = document.getElementById('review-observations');
  if (observationsEl) {
    observationsEl.innerHTML = registerObservations || '<span class="review-empty">No observation recorded</span>';
  }
  var recommendationsEl = document.getElementById('review-recommendations');
  if (recommendationsEl) {
    recommendationsEl.innerHTML = registerRecommendations || '<span class="review-empty">No recommendation recorded</span>';
  }
}

function saveRegisterTree() {
  var registerRecord = {
    treeId: document.getElementById('register-tree-id').value || window._registerTreeId || '',
    treeName: document.getElementById('register-scientific-name').value || '',
    photos: { selfie: registerSelfie, snapshots: registerSnapshots.map(function (s) { return s.file; }) },
    fieldObservation: { notes: registerObservations, recommendations: registerRecommendations },
    address: document.getElementById('register-address').value,
    surveyorId: window._registerUserId || '',
    savedDate: new Date().toISOString().slice(0, 10)
  };
  window._registerTree = registerRecord;
  try { localStorage.setItem('registerTree', JSON.stringify(registerRecord)); } catch (e) {}
  console.log('REGISTER OBJECT', registerRecord);
  registerSelfie = '';
  registerSnapshots = [];
  registerObservations = '';
  registerRecommendations = '';
  goTo(roleDash());
}

injectRegisterFlow();