// survey-a-tree.js — shared Survey A Tree flow, injected into any role page on load.

var surveyFlowCSS = "\n\
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
  .camera-box { width: 100%; aspect-ratio: 4/3; border-radius: 12px; background: #111; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }\n\
  .scan-frame { width: 70%; height: 50%; border: 2px solid rgba(255,255,255,0.5); border-radius: 8px; position: relative; }\n\
  .sc { position: absolute; width: 13px; height: 13px; border-color: #4ade80; border-style: solid; }\n\
  .tl{top:-2px;left:-2px;border-width:2px 0 0 2px;} .tr{top:-2px;right:-2px;border-width:2px 2px 0 0;} .bl{bottom:-2px;left:-2px;border-width:0 0 2px 2px;} .br{bottom:-2px;right:-2px;border-width:0 2px 2px 0;}\n\
  @keyframes scanline{0%{top:10%}100%{top:90%}}\n\
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}\n\
  .scan-line{position:absolute;left:5%;width:90%;height:2px;background:rgba(74,222,128,0.6);animation:scanline 1.8s ease-in-out infinite alternate;}\n\
  .scan-hint{color:rgba(74,222,128,0.9);font-size:0.7333rem;position:absolute;bottom:26px;animation:pulse 1.5s infinite;}\n\
  .capture-btn{width:48px;height:48px;border-radius:50%;background:#fff;border:3px solid rgba(255,255,255,0.4);cursor:pointer;display:flex;align-items:center;justify-content:center;position:absolute;bottom:12px;}\n\
  .capture-inner{width:34px;height:34px;border-radius:50%;background:#fff;border:2px solid #ddd;}\n\
  .field-wrap { position: relative; margin-bottom: 12px; }\n\
  .field-input { width: 100%; padding: 10px 36px 10px 12px; border-radius: var(--border-radius-md); border: 1.5px solid var(--color-theme); font-size: 0.9333rem; font-family: monospace; font-weight: 500; letter-spacing: 1.5px; background: var(--color-background-primary); color: var(--color-text-primary); outline: none; }\n\
  .field-input.normal { border-color: var(--color-border-secondary); font-family: var(--font-sans); letter-spacing: normal; font-weight: 400; font-size: 0.8667rem; }\n\
  .field-icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 1rem; color: var(--color-text-secondary); }\n\
  .field-label { font-size: 0.8rem; color: var(--color-text-secondary); margin-bottom: 5px; display: flex; align-items: center; gap: 5px; }\n\
  .field-unit { position: absolute; right: 11px; top: 50%; transform: translateY(-50%); font-size: 0.8rem; color: var(--color-text-secondary); }\n\
  .photo-preview{width:100%;aspect-ratio:16/7;border-radius:10px;background:#1a1a0a;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;margin-bottom:12px;}\n\
  .nameplate-mock{background:#f5f0e0;border-radius:5px;padding:8px 16px;border:1.5px solid #c8b870;text-align:center;}\n\
  .plate-title{font-size:0.6rem;color:#6b5e2a;letter-spacing:1px;text-transform:uppercase;margin-bottom:3px;}\n\
  .plate-id{font-size:1.2rem;font-weight:500;color:#2a1f05;letter-spacing:2px;font-family:monospace;}\n\
  .plate-sub{font-size:0.5333rem;color:#8a7540;margin-top:2px;}\n\
  .ocr-badge{position:absolute;top:7px;right:7px;background:rgba(59,109,17,0.85);color:#fff;font-size:0.6667rem;padding:3px 8px;border-radius:20px;display:flex;align-items:center;gap:3px;}\n\
  .ocr-note{font-size:0.7333rem;color:var(--color-theme);background:var(--color-theme-light);border-radius:6px;padding:7px 10px;margin-bottom:12px;display:flex;align-items:flex-start;gap:5px;line-height:1.5;}\n\
  .id-badge{background:var(--color-background-secondary);border-radius:var(--border-radius-md);padding:7px 12px;margin-bottom:12px;display:flex;align-items:center;gap:8px;}\n\
  .photo-strip{display:flex;gap:7px;margin-bottom:12px;}\n\
  .photo-thumb{width:50px;height:50px;border-radius:7px;border:0.5px solid var(--color-border-tertiary);display:flex;align-items:center;justify-content:center;font-size:1.3333rem;background:var(--color-background-secondary);}\n\
  .photo-add{width:50px;height:50px;border-radius:7px;border:1.5px dashed var(--color-border-secondary);display:flex;align-items:center;justify-content:center;cursor:pointer;color:var(--color-text-secondary);font-size:1.2rem;}\n\
  textarea{width:100%;padding:9px 11px;border-radius:var(--border-radius-md);border:0.5px solid var(--color-border-secondary);font-size:0.8rem;color:var(--color-text-primary);background:var(--color-background-primary);resize:none;font-family:var(--font-sans);line-height:1.5;height:64px;outline:none;}\n\
  .success-top{background:var(--color-theme-light);padding:24px 20px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;flex-shrink:0;}\n\
  .check-ring{width:58px;height:58px;border-radius:50%;background:var(--color-theme);display:flex;align-items:center;justify-content:center;}\n\
  @keyframes popIn{0%{transform:scale(0.4);opacity:0}70%{transform:scale(1.1)}100%{transform:scale(1);opacity:1}}\n\
  .check-ring{animation:popIn 0.5s ease forwards;}\n";

var surveyFlowPages = "\n\
<div class=\"page\" id=\"page-scan\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Scan nameplate</span><span class=\"topbar-step\">Step 1 of 3</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot active\">1</div><div class=\"step-line\"></div><div class=\"step-dot pending\">2</div><div class=\"step-line\"></div><div class=\"step-dot pending\">3</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl active\">Scan</span><span class=\"step-lbl\">Verify ID</span><span class=\"step-lbl\">Log details</span></div>\n\
  <div class=\"scrollable\" style=\"padding:12px 13px;display:flex;flex-direction:column;gap:10px;\">\n\
    <p style=\"font-size:0.8rem;color:var(--color-text-secondary);text-align:center;\">Point camera at the tree nameplate to scan the ID</p>\n\
    <div class=\"camera-box\">\n\
      <div style=\"position:absolute;inset:0;background:linear-gradient(160deg,#1a2a1a,#0d1a0d);\"></div>\n\
      <div style=\"position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:0;\">\n\
        <div class=\"scan-frame\"><div class=\"sc tl\"></div><div class=\"sc tr\"></div><div class=\"sc bl\"></div><div class=\"sc br\"></div><div class=\"scan-line\"></div></div>\n\
      </div>\n\
      <div class=\"scan-hint\" id=\"scan-hint\">Scanning for text...</div>\n\
      <button class=\"capture-btn\" onclick=\"doCapture()\"><div class=\"capture-inner\"></div></button>\n\
    </div>\n\
    <p style=\"font-size:0.7333rem;color:var(--color-text-secondary);text-align:center;\">Or <span style=\"color:#3B6D11;cursor:pointer;font-weight:500\" onclick=\"goTo('verify')\">enter ID manually</span></p>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-verify\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo('scan')\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Verify tree ID</span><span class=\"topbar-step\">Step 2 of 3</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot done\"><i class=\"ti ti-check\" style=\"font-size:0.7333rem\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot active\">2</div><div class=\"step-line\"></div><div class=\"step-dot pending\">3</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl\">Scan</span><span class=\"step-lbl active\">Verify ID</span><span class=\"step-lbl\">Log details</span></div>\n\
  <div class=\"scrollable\" style=\"padding:12px 13px;\">\n\
    <div class=\"photo-preview\"><div style=\"position:absolute;inset:0;background:linear-gradient(135deg,#1a1a0a,#2a2a1a);\"></div><div class=\"nameplate-mock\"><div class=\"plate-title\">Urban Tree Registry</div><div class=\"plate-id\">625008-01-0001</div><div class=\"plate-sub\">Chennai Municipal Corp.</div></div><div class=\"ocr-badge\"><i class=\"ti ti-scan\" style=\"font-size:0.6667rem\"></i> OCR read</div></div>\n\
    <div class=\"ocr-note\"><i class=\"ti ti-info-circle\" style=\"font-size:0.8667rem;flex-shrink:0;margin-top:1px\"></i>ID read from nameplate. Verify before continuing.</div>\n\
    <div class=\"field-label\"><i class=\"ti ti-tag\" style=\"font-size:0.8667rem\"></i> Tree ID</div>\n\
    <div class=\"field-wrap\"><input class=\"field-input\" id=\"verify-id\" type=\"text\" value=\"625008-01-0001\" /><i class=\"ti ti-pencil field-icon\"></i></div>\n\
    <div class=\"field-label\" style=\"margin-top:4px\"><i class=\"ti ti-map-pin\" style=\"font-size:0.8667rem\"></i> Location (auto-detected)</div>\n\
    <div class=\"field-wrap\" style=\"margin-bottom:14px\"><input class=\"field-input normal\" type=\"text\" value=\"Anna Nagar, Chennai\" readonly /><i class=\"ti ti-gps field-icon\"></i></div>\n\
    <button class=\"green-btn\" onclick=\"goTo('logdetails')\"><i class=\"ti ti-check\"></i> Confirm & continue</button>\n\
    <button class=\"ghost-btn\" style=\"margin-top:8px\" onclick=\"goTo('scan')\"><i class=\"ti ti-camera\"></i> Retake photo</button>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-logdetails\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo('verify')\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Log growth</span><span class=\"topbar-step\">Step 3 of 3</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot done\"><i class=\"ti ti-check\" style=\"font-size:0.7333rem\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot done\"><i class=\"ti ti-check\" style=\"font-size:0.7333rem\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot active\">3</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl\">Scan</span><span class=\"step-lbl\">Verify ID</span><span class=\"step-lbl active\">Log details</span></div>\n\
  <div class=\"scrollable\" style=\"padding:12px 13px;display:flex;flex-direction:column;gap:10px;\">\n\
    <div class=\"id-badge\"><i class=\"ti ti-tag\" style=\"font-size:0.8667rem;color:#3B6D11\"></i><span style=\"font-size:0.8rem;color:var(--color-text-secondary)\">Tree</span><span style=\"font-size:0.8667rem;font-weight:500;color:var(--color-text-primary);font-family:monospace\">625008-01-0001</span></div>\n\
    <div><div class=\"field-label\"><i class=\"ti ti-ruler\" style=\"font-size:0.8667rem\"></i> Height</div><div class=\"field-wrap\" style=\"margin-bottom:0\"><input class=\"field-input normal\" type=\"number\" placeholder=\"e.g. 8.4\" /><span class=\"field-unit\">m</span></div></div>\n\
    <div><div class=\"field-label\"><i class=\"ti ti-circle\" style=\"font-size:0.8667rem\"></i> Trunk diameter</div><div class=\"field-wrap\" style=\"margin-bottom:0\"><input class=\"field-input normal\" type=\"number\" placeholder=\"e.g. 22\" /><span class=\"field-unit\">cm</span></div></div>\n\
    <div><div class=\"field-label\" style=\"margin-bottom:5px\"><i class=\"ti ti-camera\" style=\"font-size:0.8667rem\"></i> Photos</div><div class=\"photo-strip\"><div class=\"photo-thumb\">🌿</div><div class=\"photo-thumb\">🌳</div><div class=\"photo-add\"><i class=\"ti ti-plus\"></i></div></div></div>\n\
    <div><div class=\"field-label\" style=\"margin-bottom:5px\"><i class=\"ti ti-notes\" style=\"font-size:0.8667rem\"></i> Field notes (optional)</div><textarea placeholder=\"e.g. New shoots visible, no signs of disease...\"></textarea></div>\n\
    <button class=\"green-btn\" onclick=\"goTo('success')\"><i class=\"ti ti-device-floppy\"></i> Save log entry</button>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-success\">\n\
  <div class=\"success-top\">\n\
    <div style=\"display:flex;justify-content:center;gap:5px;margin-bottom:4px;\"><div style=\"width:6px;height:6px;border-radius:50%;background:#97C459\"></div><div style=\"width:6px;height:6px;border-radius:50%;background:#EF9F27\"></div><div style=\"width:6px;height:6px;border-radius:50%;background:#5DCAA5\"></div><div style=\"width:6px;height:6px;border-radius:50%;background:#97C459\"></div><div style=\"width:6px;height:6px;border-radius:50%;background:#EF9F27\"></div></div>\n\
    <div class=\"check-ring\"><i class=\"ti ti-check\" style=\"font-size:1.8667rem;color:var(--color-theme-light)\"></i></div>\n\
    <div style=\"font-size:1.1333rem;font-weight:500;color:#27500A;\">Log saved!</div>\n\
    <div style=\"font-size:0.8rem;color:#3B6D11;text-align:center;line-height:1.5;\">Growth entry recorded for<br>Neem Tree #0042</div>\n\
  </div>\n\
  <div class=\"scrollable\" style=\"padding:13px;display:flex;flex-direction:column;gap:11px;\">\n\
    <div class=\"info-card\">\n\
      <div class=\"info-row\"><span class=\"info-key\"><i class=\"ti ti-tag\" style=\"font-size:0.8667rem\"></i>Tree ID</span><span class=\"info-val\" style=\"font-family:monospace;font-size:0.8rem\">625008-01-0001</span></div>\n\
      <div class=\"info-row\"><span class=\"info-key\"><i class=\"ti ti-map-pin\" style=\"font-size:0.8667rem\"></i>Location</span><span class=\"info-val\">Anna Nagar</span></div>\n\
      <div class=\"info-row\"><span class=\"info-key\"><i class=\"ti ti-calendar\" style=\"font-size:0.8667rem\"></i>Date</span><span class=\"info-val\">24 Jun 2026</span></div>\n\
      <div class=\"info-row\"><span class=\"info-key\"><i class=\"ti ti-camera\" style=\"font-size:0.8667rem\"></i>Photos</span><span class=\"info-val\">2 attached</span></div>\n\
    </div>\n\
    <div style=\"display:grid;grid-template-columns:1fr 1fr;gap:8px;\">\n\
      <div style=\"background:var(--color-theme-light);border-radius:var(--border-radius-md);padding:10px 11px;\"><div style=\"font-size:0.6667rem;color:var(--color-theme);margin-bottom:3px;\">Height logged</div><div style=\"font-size:1.1333rem;font-weight:500;color:#27500A;\">8.4 m</div><div style=\"font-size:0.6667rem;color:var(--color-theme);margin-top:1px;\"><i class=\"ti ti-trending-up\" style=\"font-size:0.6667rem\"></i> +0.3 m</div></div>\n\
      <div style=\"background:var(--color-theme-light);border-radius:var(--border-radius-md);padding:10px 11px;\"><div style=\"font-size:0.6667rem;color:var(--color-theme);margin-bottom:3px;\">Diameter logged</div><div style=\"font-size:1.1333rem;font-weight:500;color:#27500A;\">22 cm</div><div style=\"font-size:0.6667rem;color:var(--color-theme);margin-top:1px;\"><i class=\"ti ti-trending-up\" style=\"font-size:0.6667rem\"></i> +1 cm</div></div>\n\
    </div>\n\
    <button class=\"green-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-layout-dashboard\"></i> Back to dashboard</button>\n\
    <button class=\"ghost-btn\" onclick=\"openProfile()\"><i class=\"ti ti-tree\"></i> View tree profile</button>\n\
  </div>\n\
</div>\n";

function injectSurveyFlow() {
  var existing = document.getElementById('page-scan');
  if (!existing) {
    var styleEl = document.createElement('style');
    styleEl.id = 'survey-flow-style';
    styleEl.textContent = surveyFlowCSS;
    document.head.appendChild(styleEl);
    var screen = document.querySelector('.screen');
    if (screen) screen.insertAdjacentHTML('beforeend', surveyFlowPages);
  }
}

function doCapture() {
  document.getElementById('scan-hint').textContent = 'Reading text...';
  setTimeout(function(){ goTo('verify'); }, 900);
}

injectSurveyFlow();