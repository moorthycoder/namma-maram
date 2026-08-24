// storage.js — single master of all app data. Loaded by index.html and every page.
// index (top window) pulls all datasets from the JSON files (or a fetch API) into
// RAM globals and mirrors them as a `tree` object in localStorage. Every other page
// reads straight from index's RAM — no page ever reads the JSON again.

var TREE_KEY = 'tree';

var STORE = {
  places:      { url: 'json/places_name.json',      ram: '__PLACES' },
  treeCards:   { url: 'json/tree_cards.json',       ram: '__TREE_DATA' },
  treeNames:   { url: 'json/trees_name.json',       ram: 'TREE_NAMES_DB' },
  treeColours: { url: 'json/tree-colours-in-map-drops.json', ram: 'TREE_COLOURS' },
  languages:   { url: 'json/languages.json',        ram: '__LANGS' },
  login:       { url: 'json/login-credentials.json', ram: '_login', session: 'loginCredentialsV1' }
};

function parentRam(name) {
  try {
    if (window.parent && window.parent !== window && window.parent[STORE[name].ram] != null) {
      return window.parent[STORE[name].ram];
    }
  } catch (e) {}
  return null;
}

var storage = {
  tree: {},

  get: function (name) {
    var item = STORE[name];
    if (window[item.ram] != null) { return window[item.ram]; }
    var fromParent = parentRam(name);
    if (fromParent != null) { return fromParent; }
    if (storage.tree[name] != null) { return storage.tree[name]; }
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
    if (!t || !t.speciesName) { return ''; }
    lang = lang || 'en';
    if (lang === 'en') { return t.speciesName.en || t.speciesName.ta || ''; }
    var db = storage.get('treeNames') || [];
    var sci = t.speciesName.sn || '';
    for (var i = 0; i < db.length; i++) {
      if (db[i][sci]) {
        var names = db[i][sci][lang];
        if (Array.isArray(names)) { return names.join(', '); }
      }
    }
    if (lang === 'ta') { return t.speciesName.ta || t.speciesName.en || ''; }
    return t.speciesName.en || t.speciesName.ta || '';
  },

  save: function () {
    try {
      localStorage.removeItem(TREE_KEY);
      localStorage.setItem(TREE_KEY, JSON.stringify(storage.tree));
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
      pending++;
      fetch(STORE[name].url).then(function (r) { return r.json(); })
        .then(function (data) { storage.set(name, data); done(); })
        .catch(function () { done(); });
    });
  },

  destroy: function () {
    storage.tree = {};
    try { localStorage.removeItem(TREE_KEY); } catch (e) {}
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

if (window.top === window.self) {
  storage.loadData();
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