// tree-in-wikipedia.js — open the tree species on Wikipedia from a tree profile.

function getWikipediaUrlForSnEn(sn) {
  var exceptions = window.__TREE_SPECIES_NAME_EXCEPTION || storage.get('treeSpeciesNameException') || [];
  var map = {};
  exceptions.forEach(function (e) { if (e && e.sn) { map[e.sn] = e.wikipedia; } });
  var title = map[sn] || String(sn || '').trim().replace(/\s+/g, '_');
  return 'https://en.wikipedia.org/wiki/' + title;
}

function getWikipediaUrlForOtherLang(sn, lang) {
  if (!sn || !lang) return '';
  var tree_species_name_db = window.__TREE_SPECIES_NAME || storage.get('treeSpeciesName') || [];
  var first_name = '';
  for (var i = 0; i < tree_species_name_db.length; i++) {
    var entry = tree_species_name_db[i] || {};
    var species_data = entry[sn];
    if (species_data && species_data[lang]) {
      var lang_names = species_data[lang];
      first_name = (Array.isArray(lang_names) && lang_names.length) ? lang_names[0] : '';
      break;
    }
  }
  if (!first_name) return '';
  return 'https://' + lang + '.wikipedia.org/wiki/' + first_name;
}

function getWikipediaUrl(sn) {
  var app_lang = (typeof appLang !== 'undefined' && appLang) ? appLang : 'en';
  return (app_lang === 'en' || app_lang === 'sn')
    ? getWikipediaUrlForSnEn(sn)
    : getWikipediaUrlForOtherLang(sn, app_lang);
}

function openSpeciesInWikipedia(sn) {
  if (!sn) return;
  var url = getWikipediaUrl(sn);
  if (url) {
    window.open(url, '_blank');
  }
}