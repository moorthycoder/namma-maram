// storage.js — single master of all app data. Loaded by index.html and every page.
// index (top window) pulls all datasets from the JSON files (or a fetch API) into
// RAM globals and mirrors them as a `tree` object in sessionStorage. Every other page
// reads straight from index's RAM — no page ever reads the JSON again.

var TREE_KEY = 'tree';

var STORE = {
  places:      { url: 'json/places_name.json',      ram: '__PLACES' },
  treeCards:   { url: 'json/tree_profile_cards.json', ram: '__TREE_DATA' },
  projects:    { url: 'json/projects_name.json',       ram: '__PROJECTS' },
  treeNames:   { url: 'json/tree_species_name.json', ram: 'TREE_NAMES_DB' },
  treeSpeciesNameException: { url: 'json/tree_species_name_exception.json', ram: 'TREE_SPECIES_NAME_EXCEPTION' },
  treeColours: { url: 'json/tree-colours-in-map-pins.json', ram: 'TREE_COLOURS' },
  languages:   { url: 'json/languages.json',        ram: '__LANGS' },
  login:       { url: 'json/login-credentials.json', ram: '_login', session: 'loginCredentialsV1' },
  placeholderTexts: { url: 'json/placeholder_text.json', ram: '__PLACEHOLDERS' },
  measurement: { url: null, ram: '__MEASUREMENT' }
};
function getBackingStore() {
  return sessionStorage;
}

function parentRam(name) {
  try {
    if (window.parent && window.parent !== window && window.parent[STORE[name].ram] != null) {
      return window.parent[STORE[name].ram];
    }
  } catch (e) {}
  return null;
}

var storage = {
  tree: (function () { try { return JSON.parse(getBackingStore().getItem(TREE_KEY) || 'null') || {}; } catch (e) { return {}; } })(),

  get: function (name) {
    if (name === 'measurement' && !storage.tree.measurement) { storage.tree.measurement = { height: 'feet', diameter: 'feet' }; window.__MEASUREMENT = storage.tree.measurement; }
    var item = STORE[name];
    if (!item) { return null; }
    if (window[item.ram] != null) { return window[item.ram]; }
    var fromParent = parentRam(name);
    if (fromParent != null) { return fromParent; }
    if (storage.tree[name] != null) { return storage.tree[name]; }
    try {
      var cached = JSON.parse(getBackingStore().getItem(TREE_KEY) || 'null');
      if (cached && cached[name] != null) {
        storage.tree[name] = cached[name];
        window[item.ram] = cached[name];
        return cached[name];
      }
    } catch (e) {}
    return null;
  },

  set: function (name, data) {
    storage.tree[name] = data;
    window[STORE[name].ram] = data;
    try {
      if (window.parent && window.parent !== window) { window.parent[STORE[name].ram] = data; }
    } catch (e) {}
    if (STORE[name].session) {
      try { sessionStorage.setItem(STORE[name].session, JSON.stringify(data)); } catch (e) {}
    }
    storage.save();
  },

  commit: function (name, data) {
    storage.set(name, data);
    storage.renderAll();
  },

  pullTreeDetail: function (treeId) {
    var treeCards = storage.get('treeCards') || [];
    for (var i = 0; i < treeCards.length; i++) {
      if (treeCards[i].treeId === treeId) { return treeCards[i]; }
    }
    return null;
  },

  syncTreeCards: function () {
    var cards = storage.get('treeCards');
    if (cards != null) { window.__TREE_DATA = cards; }
    return cards;
  },

  detectLanguage: function (text) {
    var t = String(text || '');
    if (!t) { return 'en'; }
    var scripts = [
      { re: /[\u0B80-\u0BFF]/, lang: 'ta' },
      { re: /[\u0C00-\u0C7F]/, lang: 'te' },
      { re: /[\u0C80-\u0CFF]/, lang: 'kn' },
      { re: /[\u0D00-\u0D7F]/, lang: 'ml' },
      { re: /[\u0900-\u097F]/, lang: 'hi' },
      { re: /[\u0D80-\u0DFF]/, lang: 'si' },
      { re: /[\u0E00-\u0E7F]/, lang: 'th' }
    ];
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].re.test(t)) { return scripts[i].lang; }
    }
    return 'en';
  },

  treeNameIn: function (t, lang) {
    function nn(a) { return (Array.isArray(a) && a.length) ? a : null; }
    var EMPTY = [];
    if (!t) { return EMPTY; }
    lang = lang || 'en';
    var sci = String(t.scientificName || '');
    var db = storage.get('treeNames') || [];
    for (var i = 0; i < db.length; i++) {
      var entry = db[i][sci] || {};
      var names = entry[lang] || entry.en || [];
      if (Array.isArray(names) && names.length) { return names; }
    }
    return EMPTY;
  },

  projectNameIn: function (project, lang) {
    var EMPTY = '';
    if (!project) { return EMPTY; }
    lang = lang || 'en';
    var id = String(project.projectId || '');
    var names_obj = project.names || project.projectName || {};
    var direct = names_obj[lang];
    if (Array.isArray(direct) && direct.length) { return direct[0]; }
    if (typeof direct === 'string' && direct) { return direct; }
    var db = storage.get('projects') || [];
    for (var i = 0; i < db.length; i++) {
      if (db[i].projectId === id) {
        var pn = db[i].projectName || {};
        var fallback = pn[lang] || pn.en || '';
        return typeof fallback === 'string' ? fallback : (Array.isArray(fallback) && fallback.length ? fallback[0] : EMPTY);
      }
    }
    return EMPTY;
  },

  save: function () {
    try {
      getBackingStore().removeItem(TREE_KEY);
      getBackingStore().setItem(TREE_KEY, JSON.stringify(storage.tree));
    } catch (e) {}
  },

  loadData: function () {
    var pending = 0;
    var done = function () {
      pending--;
      if (pending === 0) {
        storage.save();
        storage.renderAll();
      }
    };
    Object.keys(STORE).forEach(function (name) {
      if (!STORE[name].url) { return; }
      pending++;
      fetch(STORE[name].url).then(function (r) { return r.json(); })
        .then(function (data) { storage.set(name, data); done(); })
        .catch(function () { done(); });
    });
    if (pending === 0) { storage.save(); storage.renderAll(); }
  },

  destroy: function () {
    storage.tree = {};
    try { getBackingStore().removeItem(TREE_KEY); } catch (e) {}
  },

  freshUp: function () {
    storage.destroy();
    storage.loadData();
  },

  renderAll: function () {
    setTimeout(function () {
      if (window.render && typeof window.render.init === 'function') { window.render.init(); }
    }, 0);
  }
};

// populate window globals from the hydrated sessionStorage mirror
try {
  Object.keys(STORE).forEach(function (n) {
    if (storage.tree[n] != null) { window[STORE[n].ram] = storage.tree[n]; }
  });
} catch (e) {}
if (!storage.tree.measurement) { storage.tree.measurement = { height: 'feet', diameter: 'feet' }; window.__MEASUREMENT = storage.tree.measurement; try { storage.save(); } catch (e) {} }
if (!window.__MEASUREMENT) { window.__MEASUREMENT = storage.tree.measurement; }

if (window.top === window.self) {
  var _cachedCards = storage.get('treeCards');
  if (_cachedCards == null || !_cachedCards.length || !_cachedCards[0]['date-of-planting']) {
    storage.loadData();
  } else {
    // data already in RAM (from sessionStorage) — just render
    storage.renderAll();
  }
} else {
  var attemptCount = 0;
  var waitTimer = setInterval(function () {
    attemptCount++;
    if (storage.get('treeCards') != null || attemptCount > 100) {
      clearInterval(waitTimer);
      storage.renderAll();
    }
  }, 50);
}