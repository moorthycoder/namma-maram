
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

  function treeDetails(treeId, appLang) {
    var record = storage.pullTreeDetail(treeId);
    if (!record) {
      return { type: 'Tree', localName: '', treeId: treeId, address: '', caregiver: '', careGiverContact: '', emoji: '🌳', health: '', height: '', diameter: '' };
    }
    var lang = appLang || getAppLang();
    var name = record.speciesName[lang] || record.speciesName.en || record.speciesName.ta || '';
    var addr = record.address || {};
    return {
      type: record.englishName || 'Tree',
      name: name || record.englishName || 'Tree',
      localName: record.localName || '',
      treeId: record.treeId || '',
      address: addr[lang] || addr.en || addr.ta || '',
      caregiver: record['care-giver'] || '',
      careGiverContact: record['care-giver-contact-number'] || '',
      emoji: record.emoji || '🌳',
      health: record.health || '',
      height: record.height || '',
      diameter: record.diameter || ''
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
      document.getElementById('map').innerHTML = '<div style="padding:40px;font-size:15px;">No coordinates provided.</div>';
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
      document.getElementById('map').innerHTML = '<div style="padding:40px;font-size:15px;">No coordinates provided.</div>';
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
          (info.health ? '<span class="map-health health-' + String(info.health).toLowerCase().replace(/\s+/g, '-') + '">' + info.health + '</span>' : '') +
        '</div>' +
        '<div class="map-info">' +
          '<div class="map-name">' + (info.name || info.type) + '</div>' +
          (info.treeId ? '<div class="map-id">' + info.treeId + '</div>' : '') +
          '<div class="map-coords">' + lat.toFixed(4) + ', ' + lng.toFixed(4) + '</div>' +
          (info.address ? '<div class="map-addr">' + info.address + '</div>' : '') +
          (info.caregiver ? '<div class="map-cg">Caregiver: ' + info.caregiver + '</div>' : '') +
          (info.careGiverContact ? '<div class="map-cg">📞 ' + info.careGiverContact + '</div>' : '') +
          '<div class="map-cg">&nbsp;</div>' +
          '<div class="map-stats">📏 ' + (info.height || '—') + ' · 📐 ' + (info.diameter || '—') + '</div>' +
        '</div>' +
      '</div>';
  }

  initMap();
