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
  .selfie-cam { background: #000; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; flex: 0 0 auto; height: 380px; min-height: 0; margin-bottom: 12px; }\n\
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
  .photo-fill { font-size: 1.4rem; }\n\
  .snap-del { position: absolute; top: 5px; right: 5px; width: 22px; height: 22px; border-radius: 50%; background: rgba(0,0,0,0.65); color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.8rem; z-index: 2; }\n\
  .snapshot-tile-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }\n\
  .snapshot-tile { aspect-ratio: 1; border-radius: 10px; background: var(--color-background-secondary); border: 1.5px solid var(--color-border-secondary); display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; cursor: pointer; color: var(--color-text-secondary); position: relative; overflow: hidden; }\n\
  .snapshot-tile-name { font-size: 0.625rem; text-transform: capitalize; line-height: 1.2; text-align: center; }\n\
  .snapshot-tile.is-filled { border-color: var(--color-theme); background: var(--color-theme-light); }\n\
  .snapshot-tile .photo-fill { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: 600; color: #fff; background: var(--color-theme); }\n\
  .snapshot-tile.is-filled .snapshot-tile-name { position: absolute; bottom: 3px; left: 0; right: 0; z-index: 1; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }\n\
  .snapshot-tile.is-active { box-shadow: 0 0 0 2px var(--color-theme); }\n\
  .snapshot-tile-del { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; background: rgba(0,0,0,0.55); color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.6rem; z-index: 2; }\n\
  .snapshot-tile-add { aspect-ratio: 1; border-radius: 10px; border: 1.5px dashed var(--color-border-secondary); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--color-text-secondary); font-size: 1.2rem; background: var(--color-background-primary); }\n\
  .cam-btn.is-hidden { display: none; }\n\
  .capture-controls { display: flex; align-items: center; justify-content: center; gap: 12px; padding-bottom: 12px; flex-shrink: 0; }\n\
  .capture-controls .cam-btn { margin: 12px auto 0; }\n\
  .btn-danger { background: #c0392b; border-color: #c0392b; color: #fff; transition: transform 0.15s ease, background-color 0.15s ease; }\n\
  .btn-danger:hover { transform: scale(1.1); background-color: #a93226; }\n\
  .capture-controls .green-btn { transition: transform 0.15s ease, background-color 0.15s ease; }\n\
  .capture-controls .green-btn:hover { transform: scale(1.1); background-color: #2f5710; }\n\
  .review-snap-scroll { display: flex; gap: 10px; overflow-x: auto; -webkit-overflow-scrolling: touch; padding-bottom: 4px; }\n\
  .photo { position: relative; width: 100%; height: 380px; border-radius: 12px; overflow: hidden; background: var(--color-background-secondary); }\n\
  .photo img { width: 100%; height: 100%; object-fit: cover; display: block; }\n\
  .photo-tile { flex: 0 0 100%; }\n\
  .photo .photo-fill { position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; font-size: 1.6rem; font-weight: 600; color: #fff; background: var(--color-theme); }\n\
  .photo .snapshot-tile-name { position: absolute; bottom: 8px; left: 0; right: 0; z-index: 1; color: #fff; font-size: 0.75rem; text-align: center; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }\n\
  .camera-slot-tag { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.6); color: #fff; padding: 4px 12px; border-radius: 999px; font-size: 0.75rem; text-transform: capitalize; z-index: 2; }\n\
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
  .review-text { font-size: 0.8rem; color: var(--color-text-primary); line-height: 1.5; background: var(--color-background-secondary); border-radius: var(--border-radius-md); padding: 10px 12px; }\n\
  .review-empty { font-size: 0.8rem; color: var(--color-text-secondary); font-style: italic; }\n\
  .flow-nav { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; flex: 0 0 auto; margin-top: auto; }\n\
  .register-details { display: none; flex-direction: column; gap: 10px; }\n\
  .register-details.is-shown { display: flex; }\n\
  .flow-nav.is-hidden { display: none; }\n\
  .sci-suggest-list { position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px; background: var(--color-background-primary); border: 1px solid var(--color-border-secondary); border-radius: var(--border-radius-md); max-height: 180px; overflow-y: auto; z-index: 10; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }\n\
  .sci-suggest-item { padding: 8px 12px; font-size: 0.8667rem; color: var(--color-text-primary); cursor: pointer; }\n\
  .sci-suggest-item:hover { background: var(--color-theme-light); }\n\
  .addr-box { width: 100%; padding: 9px 11px; border-radius: var(--border-radius-md); border: 0.5px solid var(--color-border-secondary); font-size: 0.8rem; color: var(--color-text-primary); background: var(--color-background-primary); resize: none; font-family: var(--font-sans); line-height: 1.5; height: 58px; outline: none; }\n\
  .gis-coord-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }\n\
  .gis-fields { display: flex; flex-direction: column; gap: 8px; }\n\
  .register-split { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: 12px 13px; gap: 10px; overflow-y: auto; -webkit-overflow-scrolling: touch; }\n\
  .details-scroll { flex: 0 0 auto; }\n\
  .sci-suggest-list:empty { display: none; }\n\
  .sci-clear-btn { display: none; }\n\
  .sci-clear-btn.is-shown { display: flex; }\n\
  .gis-overlay { position: absolute; left: 0; right: 0; bottom: 0; background: linear-gradient(180deg, rgba(0,0,0,0), rgba(0,0,0,0.78)); padding: 22px 10px 8px; color: #fff; }\n\
  .gis-overlay-body { display: flex; gap: 8px; align-items: stretch; }\n\
  .gis-overlay-map { flex: 1; height: 48px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.35); background: linear-gradient(135deg, #d9e8c9, #a9c48f); position: relative; overflow: hidden; }\n\
  .gis-overlay-map::before { content: ''; position: absolute; top: 50%; left: 0; right: 0; height: 1px; background: rgba(255,255,255,0.5); }\n\
  .gis-overlay-map::after { content: ''; position: absolute; left: 50%; top: 0; bottom: 0; width: 1px; background: rgba(255,255,255,0.5); }\n\
  .gis-overlay-right { flex: 2; display: flex; flex-direction: column; gap: 4px; min-width: 0; }\n\
  .gis-overlay-address { font-size: 0.7rem; line-height: 1.3; display: flex; align-items: flex-start; gap: 4px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }\n\
  .gis-overlay-row { font-size: 0.7rem; display: flex; align-items: center; gap: 5px; text-shadow: 0 1px 2px rgba(0,0,0,0.5); }\n\
  .gis-overlay-pin { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -100%); color: #d64541; font-size: 1.2rem; }\n\
  .gis-map { position: relative; width: 100%; height: 200px; border-radius: 12px; border: 1px solid var(--color-border-secondary); margin-bottom: 10px; overflow: hidden; z-index: 0; }\n\
  .success-top { background: var(--color-theme-light); padding: 24px 20px 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; flex-shrink: 0; }\n\
  .check-ring { width: 58px; height: 58px; border-radius: 50%; background: var(--color-theme); display: flex; align-items: center; justify-content: center; }\n\
  @keyframes popIn { 0% { transform: scale(0.4); opacity: 0; } 70% { transform: scale(1.1); } 100% { transform: scale(1); opacity: 1; } }\n\
  .check-ring { animation: popIn 0.5s ease forwards; }\n";

var registerFlowPages = "\n\
<div class=\"page\" id=\"page-selfie\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Selfie with Tree</span><span class=\"topbar-step\">Step 1 of 4</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot active\">1</div><div class=\"step-line\"></div><div class=\"step-dot pending\">2</div><div class=\"step-line\"></div><div class=\"step-dot pending\">3</div><div class=\"step-line\"></div><div class=\"step-dot pending\">4</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl active\">Selfie</span><span class=\"step-lbl\">Snapshots</span><span class=\"step-lbl\">Notes</span><span class=\"step-lbl\">Review</span></div>\n\
  <div class=\"register-split\">\n\
    <div class=\"selfie-cam\">\n\
      <div class=\"selfie-full\" id=\"selfie-panel\"></div>\n\
      <button class=\"cam-btn\" onclick=\"captureRegisterSelfie()\"><i class=\"ti ti-camera\"></i></button>\n\
    </div>\n\
    <div class=\"details-scroll\">\n\
    <div class=\"register-details\" id=\"register-details\">\n\
      <div class=\"gis-fields\">\n\
        <div class=\"field-label\"><i class=\"ti ti-gps\"></i> GIS location</div>\n\
        <div class=\"gis-panel\" id=\"register-gis-map\"></div>\n\
        <div class=\"gis-coord-row\">\n\
          <input id=\"register-gis-lat\" class=\"field-input normal\" type=\"text\" value=\"\" placeholder=\"Latitude\" oninput=\"moveGisMarkerFromInputs()\" />\n\
          <input id=\"register-gis-lng\" class=\"field-input normal\" type=\"text\" value=\"\" placeholder=\"Longitude\" oninput=\"moveGisMarkerFromInputs()\" />\n\
        </div>\n\
        <textarea id=\"register-address\" class=\"addr-box\" rows=\"2\" placeholder=\"Address\" oninput=\"renderRegisterSelfie()\"></textarea>\n\
      </div>\n\
      <div>\n\
        <div class=\"field-label\"><i class=\"ti ti-hash\"></i> Tree ID</div>\n\
        <input id=\"register-tree-id\" class=\"field-input normal\" type=\"text\" value=\"\" placeholder=\"e.g. 625501-06-0001\" />\n\
      </div>\n\
      <div>\n\
        <div class=\"field-label\"><i class=\"ti ti-leaf\"></i> Scientific name</div>\n\
        <div class=\"field-wrap\">\n\
          <input id=\"register-scientific-name\" class=\"field-input normal\" type=\"text\" value=\"\" placeholder=\"e.g. Samanea saman\" oninput=\"suggestRegisterScientificName()\" />\n\
          <button type=\"button\" class=\"field-icon sci-clear-btn\" id=\"register-sci-clear\" onclick=\"clearRegisterScientificName()\"><i class=\"ti ti-x\"></i></button>\n\
          <div class=\"sci-suggest-list\" id=\"register-sci-suggest\"></div>\n\
        </div>\n\
      </div>\n\
      <div>\n\
        <div class=\"field-label\"><i class=\"ti ti-languages\"></i> Local name</div>\n\
        <input id=\"register-local-name\" class=\"field-input normal\" type=\"text\" value=\"\" placeholder=\"Local name\" />\n\
      </div>\n\
    </div>\n\
    </div>\n\
    <div class=\"flow-nav is-hidden\" id=\"register-flow-nav\"><button class=\"ghost-btn\" onclick=\"goTo(roleDash())\"><i class=\"ti ti-arrow-left\"></i> Back</button><button class=\"green-btn\" onclick=\"goTo('snapshots')\"><i class=\"ti ti-arrow-right\"></i> Next</button></div>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-snapshots\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"goTo('selfie')\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Snapshots of Tree</span><span class=\"topbar-step\">Step 2 of 4</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot done\"><i class=\"ti ti-check\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot active\">2</div><div class=\"step-line\"></div><div class=\"step-dot pending\">3</div><div class=\"step-line\"></div><div class=\"step-dot pending\">4</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl\">Selfie</span><span class=\"step-lbl active\">Snapshots</span><span class=\"step-lbl\">Notes</span><span class=\"step-lbl\">Review</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div class=\"snapshot-tile-grid\" id=\"register-snap-grid\"></div>\n\
    <div class=\"flow-nav\"><button class=\"ghost-btn\" onclick=\"goTo('selfie')\"><i class=\"ti ti-arrow-left\"></i> Back</button><button class=\"green-btn\" onclick=\"goTo('notes')\"><i class=\"ti ti-arrow-right\"></i> Next</button></div>\n\
  </div>\n\
</div>\n\
<div class=\"page\" id=\"page-capture\">\n\
  <div class=\"topbar\"><button class=\"back-btn\" onclick=\"closeRegisterSlotCamera()\"><i class=\"ti ti-arrow-left\"></i></button><span class=\"topbar-title\">Capture Snapshot</span><span class=\"topbar-step\">Step 2 of 4</span></div>\n\
  <div class=\"steps\"><div class=\"step-dot done\"><i class=\"ti ti-check\"></i></div><div class=\"step-line done\"></div><div class=\"step-dot active\">2</div><div class=\"step-line\"></div><div class=\"step-dot pending\">3</div><div class=\"step-line\"></div><div class=\"step-dot pending\">4</div></div>\n\
  <div class=\"step-labels\"><span class=\"step-lbl\">Selfie</span><span class=\"step-lbl active\">Snapshots</span><span class=\"step-lbl\">Notes</span><span class=\"step-lbl\">Review</span></div>\n\
  <div class=\"scrollable flow-scroll\">\n\
    <div class=\"selfie-cam\">\n\
      <div class=\"selfie-full\" id=\"register-capture-view\"></div>\n\
      <div class=\"capture-controls\" id=\"register-capture-controls\"></div>\n\
    </div>\n\
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
      <div class=\"photo\" id=\"review-selfie\"></div>\n\
    </div>\n\
    <div class=\"review-section\">\n\
      <div class=\"review-head\"><span class=\"review-title\"><i class=\"ti ti-camera\"></i> Snapshots</span><button class=\"review-edit\" onclick=\"goTo('snapshots')\"><i class=\"ti ti-pencil\"></i> Edit</button></div>\n\
      <div class=\"review-snap-scroll\" id=\"review-grid\"></div>\n\
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
var REGISTER_SNAPSHOT_BASE_SLOTS = ['east', 'west', 'north', 'south', 'leaf', 'flower', 'fruit', 'seed', 'add1', 'add2'];
var registerSnapshotSlots = REGISTER_SNAPSHOT_BASE_SLOTS.slice();
var registerSnapshotPhotos = {};
var registerActiveSlot = '';
var registerCameraOpenFor = '';
var registerPendingShot = null;
var registerObservations = '';
var registerRecommendations = '';
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

function showRegisterDetails() {
  var detailsEl = document.getElementById('register-details');
  var navEl = document.getElementById('register-flow-nav');
  if (detailsEl) { detailsEl.classList.add('is-shown'); }
  if (navEl) { navEl.classList.remove('is-hidden'); }
  initGisMap(gisRegisterConfig);
}

function lookupRegisterLocalName() {
  var sciEl = document.getElementById('register-scientific-name');
  var localEl = document.getElementById('register-local-name');
  if (!sciEl || !localEl) { return ''; }
  var local_name = window.storage ? storage.treeNameIn({ scientificName: sciEl.value.trim() }, 'ta') : '';
  localEl.value = local_name;
  return local_name;
}

function toggleRegisterSciClearButton() {
  var sci_el = document.getElementById('register-scientific-name');
  var clear_btn = document.getElementById('register-sci-clear');
  if (!sci_el || !clear_btn) { return false; }
  var show_rule = sci_el.value.trim().length > 0;
  clear_btn.classList[show_rule ? 'add' : 'remove']('is-shown');
  return show_rule;
}

function clearRegisterScientificName() {
  var sci_el = document.getElementById('register-scientific-name');
  var local_el = document.getElementById('register-local-name');
  var list_el = document.getElementById('register-sci-suggest');
  if (sci_el) { sci_el.value = ''; }
  if (local_el) { local_el.value = ''; }
  if (list_el) { list_el.innerHTML = ''; }
  toggleRegisterSciClearButton();
  return true;
}

function registerScientificNamePool() {
  var tree_names_db = window.storage ? (storage.get('treeNames') || []) : [];
  var species_pool = [];
  for (var db_i = 0; db_i < tree_names_db.length; db_i++) {
    var entry_keys = Object.keys(tree_names_db[db_i]);
    for (var key_i = 0; key_i < entry_keys.length; key_i++) {
      if (entry_keys[key_i] !== 'variety') { species_pool.push(entry_keys[key_i]); }
    }
  }
  return species_pool;
}

function renderRegisterSuggestions(species_matches) {
  var list_el = document.getElementById('register-sci-suggest');
  if (!list_el) { return ''; }
  var items_html = '';
  for (var match_i = 0; match_i < species_matches.length; match_i++) {
    items_html += '<div class="sci-suggest-item" onclick="pickRegisterSuggestion(\'' + species_matches[match_i] + '\')">' + species_matches[match_i] + '</div>';
  }
  list_el.innerHTML = items_html;
  return items_html;
}

function suggestRegisterScientificName() {
  toggleRegisterSciClearButton();
  lookupRegisterLocalName();
  var sci_el = document.getElementById('register-scientific-name');
  var list_el = document.getElementById('register-sci-suggest');
  if (!sci_el || !list_el) { return ''; }
  var query_text = sci_el.value.trim().toLowerCase();
  if (!query_text) { list_el.innerHTML = ''; return ''; }
  var species_pool = registerScientificNamePool();
  var species_matches = [];
  for (var pool_i = 0; pool_i < species_pool.length && species_matches.length < 8; pool_i++) {
    if (species_pool[pool_i].toLowerCase().indexOf(query_text) > -1) { species_matches.push(species_pool[pool_i]); }
  }
  renderRegisterSuggestions(species_matches);
  return species_matches;
}

function pickRegisterSuggestion(species_name) {
  var sci_el = document.getElementById('register-scientific-name');
  var list_el = document.getElementById('register-sci-suggest');
  if (sci_el) { sci_el.value = species_name; }
  if (list_el) { list_el.innerHTML = ''; }
  lookupRegisterLocalName();
  toggleRegisterSciClearButton();
  return species_name;
}

function captureRegisterSelfie() {
  registerSelfie = 'selfie.jpg';
  var addressEl = document.getElementById('register-address');
  if (addressEl && !addressEl.value) addressEl.value = 'Mettupatti Sugar Mill School, 625501, Tamil Nadu';
  captureRegisterGis();
  renderRegisterSelfie();
  showRegisterDetails();
}

function captureRegisterGis() {
  captureGisPosition(gisRegisterConfig);
  renderRegisterSelfie();
}

function renderRegisterGis() {
  var latEl = document.getElementById('register-gis-lat');
  if (latEl) latEl.value = registerGisLat || '';
  var lngEl = document.getElementById('register-gis-lng');
  if (lngEl) lngEl.value = registerGisLng || '';
  var lat = parseFloat(registerGisLat);
  var lng = parseFloat(registerGisLng);
  if (!isNaN(lat) && !isNaN(lng)) { moveGisMarker(lat, lng); }
}

function registerPinPosition() {
  var latEl = document.getElementById('register-gis-lat');
  var lngEl = document.getElementById('register-gis-lng');
  var lat = parseFloat(latEl && latEl.value ? latEl.value : registerGisLat);
  var lng = parseFloat(lngEl && lngEl.value ? lngEl.value : registerGisLng);
  var top = 50;
  var left = 50;
  if (!isNaN(lat)) top = 92 - ((lat - 8) / 8) * 84;
  if (!isNaN(lng)) left = ((lng - 74) / 8) * 84;
  top = Math.max(4, Math.min(92, top));
  left = Math.max(4, Math.min(92, left));
  return { top: top, left: left };
}

var gisRegisterConfig = {
  mapId: 'register-gis-map',
  latInputId: 'register-gis-lat',
  lngInputId: 'register-gis-lng',
  useRealCapture: false,
  onPositionChange: renderRegisterSelfie
};

function moveGisMarkerFromInputs() {
  var latEl = document.getElementById('register-gis-lat');
  var lngEl = document.getElementById('register-gis-lng');
  var lat = parseFloat(latEl && latEl.value ? latEl.value : registerGisLat);
  var lng = parseFloat(lngEl && lngEl.value ? lngEl.value : registerGisLng);
  if (isNaN(lat) || isNaN(lng)) { return; }
  moveGisMarker(lat, lng);
  renderRegisterSelfie();
}

function buildRegisterSelfiePreview() {
  var addressEl = document.getElementById('register-address');
  var address = addressEl && addressEl.value ? addressEl.value : 'Anna Nagar, Chennai';
  var latEl = document.getElementById('register-gis-lat');
  var lngEl = document.getElementById('register-gis-lng');
  var lat = latEl && latEl.value ? latEl.value : (registerGisLat || '—');
  var lng = lngEl && lngEl.value ? lngEl.value : (registerGisLng || '—');
  var pin = registerPinPosition();
  return '<div class="photo-fill">📸</div>' +
    '<div class="gis-overlay">' +
    '<div class="gis-overlay-body">' +
    '<div class="gis-overlay-map"><i class="ti ti-map-pin gis-overlay-pin" style="top:' + pin.top + '%;left:' + pin.left + '%;transform:translate(-50%,-100%);"></i></div>' +
    '<div class="gis-overlay-right">' +
    '<div class="gis-overlay-address"><i class="ti ti-map-pin"></i> ' + address + '</div>' +
    '<div class="gis-overlay-row"><i class="ti ti-gps"></i> ' + lat + ', ' + lng + '</div>' +
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
  registerGisLat = '';
  registerGisLng = '';
  resetRegisterDetails();
  hideRegisterDetails();
  renderRegisterSelfie();
}

function resetRegisterDetails() {
  var field_ids = ['register-address', 'register-gis-lat', 'register-gis-lng', 'register-tree-id', 'register-scientific-name', 'register-local-name'];
  for (var field_i = 0; field_i < field_ids.length; field_i++) {
    var field_el = document.getElementById(field_ids[field_i]);
    if (field_el) { field_el.value = ''; }
  }
  var list_el = document.getElementById('register-sci-suggest');
  if (list_el) { list_el.innerHTML = ''; }
  toggleRegisterSciClearButton();
}

function hideRegisterDetails() {
  var details_el = document.getElementById('register-details');
  var nav_el = document.getElementById('register-flow-nav');
  if (details_el) { details_el.classList.remove('is-shown'); }
  if (nav_el) { nav_el.classList.add('is-hidden'); }
}

function getRegisterNextAdditionalSlot() {
  var extra_index = 3;
  while (registerSnapshotSlots.indexOf('add' + extra_index) > -1) { extra_index++; }
  return 'add' + extra_index;
}

function appendRegisterAdditionalSlot() {
  var next_slot = getRegisterNextAdditionalSlot();
  registerSnapshotSlots.push(next_slot);
  openRegisterSlotCamera(next_slot);
  return next_slot;
}

function selectRegisterSlot(slot_name) {
  openRegisterSlotCamera(slot_name);
}

function openRegisterSlotCamera(slot_name) {
  registerActiveSlot = slot_name;
  registerCameraOpenFor = slot_name;
  registerPendingShot = null;
  goTo('capture');
}

function closeRegisterSlotCamera() {
  registerCameraOpenFor = '';
  registerPendingShot = null;
  goTo('snapshots');
}

function captureRegisterActiveSlot() {
  if (!registerCameraOpenFor) { return ''; }
  var existing_shot = registerSnapshotPhotos[registerCameraOpenFor];
  registerPendingShot = existing_shot ? existing_shot.num : getRegisterShotCount() + 1;
  renderRegisterCapturePage();
  return registerCameraOpenFor + '.jpg';
}

function acceptRegisterCapture() {
  if (!registerCameraOpenFor || !registerPendingShot) { return false; }
  registerSnapshotPhotos[registerCameraOpenFor] = { file: registerCameraOpenFor + '.jpg', num: registerPendingShot };
  registerActiveSlot = registerCameraOpenFor;
  registerCameraOpenFor = '';
  registerPendingShot = null;
  goTo('snapshots');
  return true;
}

function discardRegisterCapture() {
  closeRegisterSlotCamera();
  return true;
}

function deleteRegisterSlotShot(slot_name) {
  if (!registerSnapshotPhotos[slot_name]) { return false; }
  delete registerSnapshotPhotos[slot_name];
  if (REGISTER_SNAPSHOT_BASE_SLOTS.indexOf(slot_name) === -1) {
    var slot_pos = registerSnapshotSlots.indexOf(slot_name);
    if (slot_pos > -1) { registerSnapshotSlots.splice(slot_pos, 1); }
  }
  if (registerActiveSlot === slot_name) { registerActiveSlot = ''; }
  if (registerCameraOpenFor === slot_name) { registerCameraOpenFor = ''; }
  registerPendingShot = null;
  renderRegisterSnapGrid();
  return true;
}

function getRegisterShotCount() {
  return Object.keys(registerSnapshotPhotos).length;
}

function renderRegisterSnapGrid() {
  var grid_el = document.getElementById('register-snap-grid');
  if (!grid_el) { return ''; }
  var tiles_html = '';
  for (var tile_i = 0; tile_i < registerSnapshotSlots.length; tile_i++) {
    var slot_name = registerSnapshotSlots[tile_i];
    var shot = registerSnapshotPhotos[slot_name];
    var state_class = 'snapshot-tile';
    if (shot) { state_class += ' is-filled'; }
    if (slot_name === registerActiveSlot) { state_class += ' is-active'; }
    tiles_html += '<div class="' + state_class + '" onclick="selectRegisterSlot(\'' + slot_name + '\')">';
    if (shot) {
      tiles_html += '<button class="snapshot-tile-del" onclick="event.stopPropagation();deleteRegisterSlotShot(\'' + slot_name + '\')"><i class="ti ti-x"></i></button>';
      tiles_html += '<div class="photo-fill">' + shot.num + '</div>';
    } else {
      tiles_html += '<i class="ti ti-camera"></i>';
    }
    tiles_html += '<span class="snapshot-tile-name">' + slot_name + '</span></div>';
  }
  tiles_html += '<div class="snapshot-tile-add" onclick="appendRegisterAdditionalSlot()"><i class="ti ti-plus"></i></div>';
  grid_el.innerHTML = tiles_html;
  return tiles_html;
}

function renderRegisterCapturePage() {
  var view_el = document.getElementById('register-capture-view');
  var controls_el = document.getElementById('register-capture-controls');
  if (!view_el || !controls_el) { return ''; }
  if (!registerCameraOpenFor) {
    view_el.innerHTML = '';
    controls_el.innerHTML = '';
    return '';
  }
  view_el.innerHTML = '<div class="photo-fill">' + (registerPendingShot ? registerPendingShot : '<i class="ti ti-camera"></i>') + '</div>' +
    '<div class="camera-slot-tag">' + registerCameraOpenFor + '</div>';
  controls_el.innerHTML = registerPendingShot
    ? '<button class="ghost-btn btn-danger" onclick="discardRegisterCapture()"><i class="ti ti-x"></i> Discard</button><button class="green-btn" onclick="acceptRegisterCapture()"><i class="ti ti-check"></i> Accept</button>'
    : '<button class="cam-btn" onclick="captureRegisterActiveSlot()"><i class="ti ti-camera"></i></button>';
  return registerPendingShot ? registerCameraOpenFor + '.jpg' : '';
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
    var review_tiles = [];
    for (var review_i = 0; review_i < registerSnapshotSlots.length; review_i++) {
      var review_slot = registerSnapshotSlots[review_i];
      if (registerSnapshotPhotos[review_slot]) {
        review_tiles.push('<div class="photo photo-tile"><div class="photo-fill">' + registerSnapshotPhotos[review_slot].num + '</div><span class="snapshot-tile-name">' + review_slot + '</span></div>');
      }
    }
    gridEl.innerHTML = review_tiles.length
      ? review_tiles.join('')
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

function buildRegisterTreeName() {
  var sci_el = document.getElementById('register-scientific-name');
  var local_el = document.getElementById('register-local-name');
  var tree_name = { sn: sci_el && sci_el.value ? sci_el.value.trim() : '' };
  var local_value = local_el && local_el.value ? local_el.value.trim() : '';
  if (local_value) {
    var lang_code = window.storage ? storage.detectLanguage(local_value) : '';
    tree_name[lang_code] = local_value;
  }
  return tree_name;
}

function getRegisterSavedSnapshotFiles() {
  var saved_files = [];
  for (var slot_i = 0; slot_i < registerSnapshotSlots.length; slot_i++) {
    var slot_name = registerSnapshotSlots[slot_i];
    if (registerSnapshotPhotos[slot_name]) { saved_files.push(registerSnapshotPhotos[slot_name].file); }
  }
  return saved_files;
}

function saveRegisterTree() {
  var registerRecord = {
    treeId: document.getElementById('register-tree-id').value,
    treeName: buildRegisterTreeName(),
    gis: {
      latitude: document.getElementById('register-gis-lat').value,
      longitude: document.getElementById('register-gis-lng').value
    },
    photos: { selfie: registerSelfie, snapshots: getRegisterSavedSnapshotFiles() },
    fieldObservation: { notes: registerObservations, recommendations: registerRecommendations },
    address: document.getElementById('register-address').value,
    userId: window._registerUserId || '',
    timestamp: new Date().toISOString(),
    purpose: 'register'
  };
  window._registerTree = registerRecord;
  try { sessionStorage.setItem('registerTree', JSON.stringify(registerRecord)); } catch (e) {}
  console.log('REGISTER OBJECT', JSON.stringify(registerRecord, null, 2));
  registerSelfie = '';
  registerSnapshotSlots = REGISTER_SNAPSHOT_BASE_SLOTS.slice();
  registerSnapshotPhotos = {};
  registerActiveSlot = '';
  registerCameraOpenFor = '';
  registerPendingShot = null;
  registerObservations = '';
  registerRecommendations = '';
  goTo(roleDash());
}

injectRegisterFlow();