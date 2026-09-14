var UNITS={meter:1,centimeter:100,feet:3.28084,inch:39.3701};
function getUnits(t){var m=storage.get('measurement')||{height:'feet',diameter:'feet'};return m[t]||'feet';}
function parseLength(v){var s=String(v||'').trim().toLowerCase();var n=parseFloat(s);if(isNaN(n))return {meters:NaN,raw:v};var unit='meter';if(s.indexOf('cm')>-1||s.indexOf('centimeter')>-1)unit='centimeter';else if(s.indexOf('feet')>-1||s.indexOf('ft')>-1)unit='feet';else if(s.indexOf('inch')>-1||s.indexOf('in')>-1)unit='inch';else if(s.indexOf('m')>-1)unit='meter';return {meters:n/(UNITS[unit]||1),raw:v};}
function convertLength(v,u){var p=parseLength(v);if(isNaN(p.meters))return v;return (p.meters*(UNITS[u]||1)).toFixed(2);}
function formatLength(v,t){var u=getUnits(t);return convertLength(v,u)+' '+u;}
