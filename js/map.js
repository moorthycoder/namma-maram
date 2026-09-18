
  function showInMap(treeIds) {
    var ids = Array.isArray(treeIds) ? treeIds.slice() : [treeIds];
    ids = ids.filter(function (id) { return id && String(id).trim(); })
             .map(function (id) { return String(id).trim(); });
    var seen = {};
    ids = ids.filter(function (id) { if (seen[id]) return false; seen[id] = 1; return true; });
    if (!ids.length) { alert('No tree locations found to show on the map.'); return; }
    var param = ids.join('|');
    var frame = document.getElementById('map-frame');
    var modal = document.getElementById('map-modal');
    if (frame && modal) {
      frame.src = 'map.html?ids=' + encodeURIComponent(param);
      modal.classList.add('open');
    } else {
      window.location.href = 'map.html?ids=' + encodeURIComponent(param);
    }
  }

  function decodeTreeIds(url) {
    var query = new URLSearchParams(url).get('ids') || '';
    var ids = query.split('|')
      .map(function (s) { return s.trim(); })
      .filter(function (s, i, all) { return s && all.indexOf(s) === i; });
    return ids;
  }

  function parentAppLang() {
    try {
      if (window.parent && window.parent !== window) {
        return window.parent.appLang || null;
      }
    } catch (e) {}
    return null;
  }

  function yearsSince(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '—';
    return ((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);
  }
  function ageLabel(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    var years = ((Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)).toFixed(1);
    return years + ' years old';
  }
  function plantedDateText(dateStr) {
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    var dd = String(d.getDate()).padStart(2, '0');
    var mm = String(d.getMonth() + 1).padStart(2, '0');
    var yyyy = d.getFullYear();
    return '(' + dd + '-' + mm + '-' + yyyy + ')';
  }

  function treeDetails(treeId, appLang) {
    var record = storage.pullTreeDetail(treeId);
    if (!record) {
      return { type: 'Tree', localName: '', treeId: treeId, address: '', caregiver: '', careGiverContact: '', emoji: '🌳', health: '', height: '', diameter: '', plantedDate: '' };
    }
    var enc = record['encounters-list'] || {};
    var maxNum = -1, lastEnc = null;
    Object.keys(enc).forEach(function (k) {
      var n = parseInt(k, 10);
      if (!isNaN(n) && n > maxNum) { maxNum = n; lastEnc = enc[k]; }
    });
    var st = lastEnc ? (lastEnc['health-status'] || {}) : {};
    var lang = appLang || getAppLang();
    function nameOf(nv) { return Array.isArray(nv) ? (nv[0] || '') : (nv || ''); }
    var sci = record.scientificName || '';
    var db = (window.TREE_NAMES_DB || []);
    var common_names = [];
    for (var di = 0; di < db.length; di++) {
      var entry = db[di][sci] || {};
      if (entry[lang] && Array.isArray(entry[lang]) && entry[lang].length) { common_names = entry[lang]; break; }
      if (entry.en && Array.isArray(entry.en) && entry.en.length) { common_names = entry.en; break; }
    }
    var name = nameOf(common_names) || sci;
    var pincode = record.pincode || '';
    return {
      type: sci || 'Tree',
      name: name || 'Tree',
      localName: record.localName || '',
      treeId: record.treeId || '',
      address: [record.placeName, pincode].filter(Boolean).join(', '),
      caregiver: record['care-giver'] || '',
      careGiverContact: record['care-giver-contact-number'] || '',
      emoji: record.emoji || '🌳',
      health: st.health || '',
      height: st.height || '',
      diameter: st.diameter || '',
      plantedDate: record['date-of-planting'] || ''
    };
  }

  function constructDetailCard(treeId) {
    var info = treeDetails(treeId, parentAppLang() || getAppLang());
    var record = storage.pullTreeDetail(treeId);
    var lat = record && record.GIS ? record.GIS.latitude : 0;
    var lng = record && record.GIS ? record.GIS.longitude : 0;
    return '<div class="giw">' + treeCardHtml(info, lat, lng) + '</div>';
  }

  function initMap() {
    var ids = decodeTreeIds(location.search);
    if (!ids.length) {
      document.getElementById('map').innerHTML = '<div class="map-empty">No coordinates provided.</div>';
      return;
    }

    var mapLang = parentAppLang() || getAppLang();
    var cards = {};
    var markers = [];
    ids.forEach(function (id) {
      var record = storage.pullTreeDetail(id);
      if (!record || !record.GIS || typeof record.GIS.latitude !== 'number' || typeof record.GIS.longitude !== 'number') { return; }
      cards[id] = record;
      markers.push({ lat: record.GIS.latitude, lng: record.GIS.longitude, id: id });
    });

    if (!markers.length) {
      document.getElementById('map').innerHTML = '<div class="map-empty">No coordinates provided.</div>';
      return;
    }

    drawMap(markers, cards, mapLang);
  }

  function drawMap(markers, cards, mapLang) {
    var typeColor = {};
    var colorOrder = [];
    markers.forEach(function(c) {
      var treeType = treeDetails(c.id, mapLang).type;
      if (typeColor[treeType] === undefined) {
        typeColor[treeType] = colorOrder.length;
        colorOrder.push(treeType);
      }
    });

    var palette = ['#DC2626'];
    var colours = storage.get('treeColours');
    if (colours && colours.length > 0) { palette = colours; }

    var map;
    if (markers.length === 1) {
      map = L.map('map').setView([markers[0].lat, markers[0].lng], 12);
    } else {
      map = L.map('map').fitBounds(markers.map(function(c){ return [c.lat, c.lng]; }));
    }

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    function buildTreeMarker(c) {
      var info = treeDetails(c.id, mapLang);
      var fill = typeColor[info.type] < palette.length ? palette[typeColor[info.type]] : '#DC2626';
      var icon = L.divIcon({
        className: 'tree-pin',
        html: '<svg width="26" height="34" viewBox="0 0 24 32" fill="none"><path d="M12 0C5.4 0 0 5.4 0 12c0 8.4 12 20 12 20s12-11.6 12-20C24 5.4 18.6 0 12 0z" fill="' + fill + '" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="12" r="4" fill="#fff"/></svg>',
        iconSize: [26, 34],
        iconAnchor: [13, 32],
        popupAnchor: [0, -30]
      });
      var marker = L.marker([c.lat, c.lng], { icon: icon });
      marker.bindPopup(function () {
        return constructDetailCard(c.id);
      });
      return marker;
    }

    var rendered = {};

    function updateVisibleMarkers() {
      var bounds = map.getBounds();
      var inBounds = {};
      markers.forEach(function(c, idx) {
        if (bounds.contains([c.lat, c.lng])) {
          inBounds[idx] = c;
        }
      });

      var keys = Object.keys(rendered);
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        if (!inBounds[k]) {
          map.removeLayer(rendered[k]);
          delete rendered[k];
        }
      }

      markers.forEach(function(c, idx) {
        if (inBounds[idx] && !rendered[idx]) {
          rendered[idx] = buildTreeMarker(c).addTo(map);
        }
      });
    }

    map.on('moveend zoomend', updateVisibleMarkers);
    updateVisibleMarkers();
  }

  function treeCardHtml(info, lat, lng) {
    return '' +
      '<div class="map-card">' +
        '<div class="map-photo"><span class="map-emoji">' + info.emoji + '</span>' +
          '<div class="map-row-wrap">' +
            (info.health ? '<div class="map-row"><span class="map-health health-' + String(info.health).toLowerCase().replace(/\s+/g, '-') + '">' + info.health + '</span></div>' : '') +
            (info.plantedDate ? '<div class="map-row"><span class="map-planted">' + ageLabel(info.plantedDate) + '</span></div>' : '') +
            (info.plantedDate ? '<div class="map-row"><span class="map-planted">' + plantedDateText(info.plantedDate) + '</span></div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="map-info">' +
          '<div class="map-name">' + (info.name || info.type) + '</div>' +
          (info.treeId ? '<div class="map-id">' + info.treeId + '</div>' : '') +
          '<div class="map-coords">' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '</div>' +
          (info.address ? '<div class="map-addr">' + info.address + '</div>' : '') +
          (info.caregiver ? '<div class="map-cg">Care-giver: ' + info.caregiver + '</div>' : '') +
          (info.careGiverContact ? '<div class="map-cg">📞 ' + info.careGiverContact + '</div>' : '') +
          '<div class="map-cg">&nbsp;</div>' +
          '<div class="map-stats">📏 ' + formatLength(info.height,'height') + ' · 📐 ' + formatLength(info.diameter,'diameter') + '</div>' +
        '</div>' +
      '</div>';
  }

  if (document.getElementById('map')) { initMap(); }
