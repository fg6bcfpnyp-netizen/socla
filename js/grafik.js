// SoCla – Grafik: Figuren und Möbel als eigene SVG-Zeichnungen (Version 3: Ansicht leicht von oben, weiche Farben).
"use strict";
const LINIE = "#4a3b66";
// Figuren: weiche, helle Umrisse statt dunkler Linien (Stil wie ein Bilderbuch)
const O = `stroke="rgba(74,59,102,.3)" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"`;
const O1 = `stroke="rgba(74,59,102,.26)" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"`;
let svgZaehler = 0;

function mische2(hex, ziel, f) {   // Farbe Richtung ziel (z. B. Weiß) verschieben
  const a = parseInt(hex.slice(1), 16), b = parseInt(ziel.slice(1), 16);
  const k = s => Math.round(((a >> s) & 255) * (1 - f) + ((b >> s) & 255) * f);
  return "#" + ((1 << 24) + (k(16) << 16) + (k(8) << 8) + k(0)).toString(16).slice(1);
}
const hell = (c, f) => mische2(c, "#ffffff", f == null ? .35 : f);
const dunkel = (c, f) => mische2(c, "#000000", f == null ? .22 : f);

// ================================================================ Figur
function figurSVG(fig, opt) {
  opt = opt || {};
  const f = Object.assign({}, FIGUR_STANDARD, fig);
  const id = "s" + (++svgZaehler);
  const h = HAUT[f.haut] || HAUT[0], hd = dunkel(h, .12);
  const hc = f.haarfarbe, oc = f.obenfarbe, uc = f.untenfarbe, sc = f.schuhfarbe;
  const sitzt = opt.pose === "sitzt";
  const kopfS = f.groesse === "baby" ? 1.22 : f.groesse === "kind" ? 1.1 : 1;
  let defs = "", hinten = "", koerper = "";

  // Muster für die Kleidung
  const musterInhalt = {
    streifen:`<rect width="8" height="3" fill="#fff" opacity=".45"/>`,
    punkte:`<circle cx="4" cy="4" r="1.6" fill="#fff" opacity=".6"/>`,
    sterne:`<text x="1" y="7" font-size="7" fill="#fff" opacity=".75">★</text>`,
    herzen:`<text x="1" y="7" font-size="7" fill="#ff4f9a" opacity=".8">♥</text>`
  }[f.muster];
  if (musterInhalt) defs += `<pattern id="${id}m" width="8" height="8" patternUnits="userSpaceOnUse">${musterInhalt}</pattern>`;
  const mitMuster = d => `<path d="${d}" fill="${oc}" ${O}/>` + (musterInhalt ? `<path d="${d}" fill="url(#${id}m)"/>` : "");

  // Umhang / Flügel hinter dem Körper
  if (f.extra === "umhang") hinten += `<path d="M32,70 L68,70 L80,150 Q50,158 20,150Z" fill="#e5484d" ${O}/>`;
  if (f.extra === "fluegel") hinten += `<path d="M44,80 Q10,50 8,82 Q10,108 44,96Z" fill="#cfefff" opacity=".85" ${O1}/><path d="M56,80 Q90,50 92,82 Q90,108 56,96Z" fill="#cfefff" opacity=".85" ${O1}/>`;
  if (f.oberteil === "hoodie") hinten += `<path d="M30,70 Q30,52 50,54 Q70,52 70,70Z" fill="${dunkel(oc, .1)}" ${O}/>`;

  // Beine, Unterteil, Schuhe
  const latz = f.oberteil === "latzhose", held = f.oberteil === "superheld";
  const beinFarbe = held ? oc : latz ? oc : ["hose","jeans","leggings"].includes(f.unterteil) ? uc : h;
  const langeBeine = held || latz || ["hose","jeans","leggings"].includes(f.unterteil);
  let beine = "";
  if (!sitzt) {
    beine += `<rect x="37" y="108" width="11" height="44" rx="4" fill="${beinFarbe}" ${O}/><rect x="52" y="108" width="11" height="44" rx="4" fill="${beinFarbe}" ${O}/>`;
    if (!langeBeine && f.oberteil !== "kleid") {
      if (f.unterteil === "shorts") beine += `<path d="M34,106 L66,106 L66,126 L51,126 L50,116 L49,126 L34,126Z" fill="${uc}" ${O}/>`;
      if (f.unterteil === "rock") beine += `<path d="M33,104 L67,104 L76,132 Q50,138 24,132Z" fill="${uc}" ${O}/>`;
      if (f.unterteil === "tutu") beine += `<path d="M30,106 Q18,122 26,126 Q34,132 42,126 Q50,134 58,126 Q66,132 74,126 Q82,122 70,106Z" fill="${hell(uc, .25)}" ${O}/>`;
    }
    if (langeBeine) beine += `<rect x="33" y="104" width="34" height="10" rx="3" fill="${beinFarbe}"/>`;
    if (f.unterteil === "jeans" && !held && !latz) beine += `<path d="M42,112 L42,148 M57,112 L57,148" stroke="${hell(uc, .4)}" stroke-width="1" stroke-dasharray="2 2"/>`;
  } else {
    // sitzend: Schoß nach vorne, Unterschenkel nach unten
    const schoss = f.oberteil === "kleid" ? oc : (langeBeine || f.unterteil === "shorts" || f.unterteil === "rock" || f.unterteil === "tutu") ? (held || latz ? oc : uc) : h;
    beine += `<rect x="35" y="116" width="11" height="26" rx="4" fill="${beinFarbe}" ${O}/><rect x="54" y="116" width="11" height="26" rx="4" fill="${beinFarbe}" ${O}/>`;
    beine += `<rect x="31" y="104" width="38" height="17" rx="8" fill="${schoss}" ${O}/><path d="M50,108 L50,120" stroke="${LINIE}" stroke-width="1.2" opacity=".5"/>`;
    if (f.unterteil === "tutu" && f.oberteil !== "kleid") beine += `<path d="M26,112 Q22,128 36,126 Q50,132 64,126 Q78,128 74,112Z" fill="${hell(uc, .25)}" ${O}/>`;
  }
  // Schuhe
  const fuss = (x) => {
    if (f.schuhe === "barfuss") return `<ellipse cx="${x}" cy="154" rx="6.5" ry="4" fill="${h}" ${O1}/>`;
    if (f.schuhe === "sandale") return `<ellipse cx="${x}" cy="154" rx="6.5" ry="4" fill="${h}" ${O1}/><path d="M${x - 5},152 L${x + 5},152 M${x - 4},155 L${x + 4},155" stroke="${sc}" stroke-width="2"/>`;
    if (f.schuhe === "stiefel") return `<rect x="${x - 6.5}" y="136" width="13" height="18" rx="3" fill="${sc}" ${O1}/><ellipse cx="${x + 1}" cy="155" rx="8" ry="4" fill="${sc}" ${O1}/>`;
    if (f.schuhe === "ballerina") return `<ellipse cx="${x}" cy="154.5" rx="7" ry="3.8" fill="${sc}" ${O1}/><circle cx="${x}" cy="152" r="1.6" fill="${hell(sc, .5)}"/>`;
    return `<ellipse cx="${x}" cy="154" rx="8.5" ry="4.8" fill="${sc}" ${O1}/><path d="M${x - 7},156.5 L${x + 7},156.5" stroke="#fff" stroke-width="1.6"/>`;
  };
  beine += sitzt ? `<g transform="translate(0 -12)">${fuss(40.5) + fuss(59.5)}</g>` : fuss(42.5) + fuss(57.5);

  // Arme
  const langarm = ["pulli","hoodie","jacke","kittel","superheld"].includes(f.oberteil);
  const armF = langarm ? oc : h;
  let arme = `<rect x="19" y="71" width="11" height="41" rx="5.5" fill="${armF}" ${O}/><rect x="70" y="71" width="11" height="41" rx="5.5" fill="${armF}" ${O}/>`;
  if (["shirt","kleid"].includes(f.oberteil)) arme += `<rect x="18.5" y="69" width="12" height="15" rx="5.5" fill="${oc}" ${O}/><rect x="69.5" y="69" width="12" height="15" rx="5.5" fill="${oc}" ${O}/>`;
  if (latz) arme += `<rect x="18.5" y="69" width="12" height="15" rx="5.5" fill="#fff" ${O}/><rect x="69.5" y="69" width="12" height="15" rx="5.5" fill="#fff" ${O}/>`;
  arme += `<circle cx="24.5" cy="113" r="5.2" fill="${h}" ${O1}/><circle cx="75.5" cy="113" r="5.2" fill="${h}" ${O1}/>`;

  // Oberkörper
  const rumpf = "M30,80 Q30,67 43,67 L57,67 Q70,67 70,80 L70,112 Q70,117 65,117 L35,117 Q30,117 30,112Z";
  if (f.oberteil === "kleid") koerper = mitMuster(sitzt ? "M33,68 Q50,63 67,68 L72,124 Q50,128 28,124Z" : "M33,68 Q50,63 67,68 L80,136 Q50,142 20,136Z") + `<rect x="33" y="95" width="34" height="4" fill="#fff" opacity=".6"/>`;
  else if (f.oberteil === "kittel") koerper = mitMuster(sitzt ? "M30,80 Q30,67 43,67 L57,67 Q70,67 70,80 L72,124 L28,124Z" : "M30,80 Q30,67 43,67 L57,67 Q70,67 70,80 L74,134 L26,134Z") + `<path d="M50,68 L50,${sitzt ? 124 : 134}" stroke="${LINIE}" stroke-width="1.2"/><rect x="56" y="84" width="9" height="8" rx="1.5" fill="none" ${O1}/><path d="M40,95 L44,95 M42,93 L42,97" stroke="#e5484d" stroke-width="1.6"/>`;
  else if (latz) koerper = `<path d="${rumpf}" fill="#fff" ${O}/><path d="M35,84 L65,84 L66,117 L34,117Z" fill="${oc}" ${O}/><path d="M36,84 L36,68 M64,84 L64,68" stroke="${oc}" stroke-width="3.5"/><circle cx="38" cy="87" r="1.6" fill="#ffd84d"/><circle cx="62" cy="87" r="1.6" fill="#ffd84d"/>`;
  else {
    koerper = mitMuster(rumpf);
    if (f.oberteil === "top") koerper += `<path d="M37,67 L37,60 M63,67 L63,60" stroke="${oc}" stroke-width="3"/>`;
    if (f.oberteil === "shirt" || f.oberteil === "pulli") koerper += `<path d="M43,67 Q50,74 57,67" stroke="${LINIE}" stroke-width="1.4" fill="${h}"/>`;
    if (f.oberteil === "pulli") koerper += `<rect x="30" y="108" width="40" height="5" fill="#fff" opacity=".35"/>`;
    if (f.oberteil === "hoodie") koerper += `<path d="M38,98 L62,98 L60,110 L40,110Z" fill="${dunkel(oc, .1)}" ${O1}/><path d="M46,68 L45,82 M54,68 L55,82" stroke="#fff" stroke-width="1.4"/>`;
    if (f.oberteil === "jacke") koerper += `<path d="M44,67 L50,80 L56,67Z" fill="#fff" ${O1}/><path d="M50,80 L50,117" stroke="${LINIE}" stroke-width="1.5"/><rect x="48.6" y="84" width="2.8" height="6" fill="#ddd"/>`;
    if (held) koerper += `<rect x="30" y="102" width="40" height="5" fill="#ffd23f" ${O1}/><path d="M50,77 L53,84 L60,84 L54.5,88.5 L57,96 L50,91.5 L43,96 L45.5,88.5 L40,84 L47,84Z" fill="#ffd23f" ${O1}/>`;
  }
  if (f.extra === "kette") koerper += `<path d="M42,68 Q50,80 58,68" stroke="#ffd23f" stroke-width="2" fill="none" stroke-dasharray="1 2.6"/><circle cx="50" cy="77" r="2.4" fill="#ff5fa2" ${O1}/>`;
  if (opt.pflaster === "arm") koerper += `<rect x="70" y="92" width="11" height="5" rx="2" fill="#ffd9a8" ${O1} transform="rotate(-15 75 94)"/>`;

  // Kopf: Haare hinten, Gesicht, Haare vorne, Brille, Hut
  const pony = `<path d="M24,40 Q22,11 50,10 Q78,11 76,40 Q70,23 50,22 Q30,23 24,40Z" fill="${hc}" ${O}/>`;
  let haarH = "", haarV = pony;
  switch (f.frisur) {
    case "bob": haarH = `<path d="M21,64 L21,38 Q21,8 50,8 Q79,8 79,38 L79,64 Q72,66 69,58 L69,40 L31,40 L31,58 Q28,66 21,64Z" fill="${hc}" ${O}/>`; break;
    case "lang": haarH = `<path d="M19,40 Q19,7 50,7 Q81,7 81,40 L84,100 Q67,106 50,100 Q33,106 16,100Z" fill="${hc}" ${O}/>`; break;
    case "pferd": haarH = `<path d="M68,24 Q99,26 91,72 Q88,86 80,80 Q89,52 64,36Z" fill="${hc}" ${O}/><circle cx="72" cy="29" r="4.5" fill="#ff5fa2" ${O1}/>`; break;
    case "dutt": haarH = `<circle cx="50" cy="10" r="12" fill="${hc}" ${O}/>`; break;
    case "zweidutt": haarH = `<circle cx="28" cy="16" r="11" fill="${hc}" ${O}/><circle cx="72" cy="16" r="11" fill="${hc}" ${O}/>`; break;
    case "zoepfe":
      for (let i = 0; i < 5; i++) haarH += `<circle cx="19" cy="${52 + i * 9}" r="6.5" fill="${hc}" ${O1}/><circle cx="81" cy="${52 + i * 9}" r="6.5" fill="${hc}" ${O1}/>`;
      haarH += `<circle cx="19" cy="98" r="4" fill="#ff5fa2" ${O1}/><circle cx="81" cy="98" r="4" fill="#ff5fa2" ${O1}/>`; break;
    case "locken":
      for (let a = -200; a <= 20; a += 22) { const r = a * Math.PI / 180; haarH += `<circle cx="${(50 + 27 * Math.cos(r)).toFixed(1)}" cy="${(40 + 27 * Math.sin(r)).toFixed(1)}" r="10" fill="${hc}" ${O1}/>`; }
      haarH += [[21,62],[79,62],[22,74],[78,74]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="${hc}" ${O1}/>`).join("");
      haarV = pony + [[34,21],[50,16],[66,21]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="8.5" fill="${hc}"/>`).join(""); break;
    case "afro":
      for (let a = 0; a < 360; a += 30) { const r = a * Math.PI / 180; haarH += `<circle cx="${(50 + 30 * Math.cos(r)).toFixed(1)}" cy="${(34 + 28 * Math.sin(r)).toFixed(1)}" r="13" fill="${hc}" ${O1}/>`; }
      haarH += `<circle cx="50" cy="34" r="32" fill="${hc}"/>`;
      haarV = `<path d="M26,36 Q30,18 50,18 Q70,18 74,36 Q66,26 50,26 Q34,26 26,36Z" fill="${hc}"/>`; break;
    case "stachel": haarV = `<path d="M24,38 L21,22 L32,25 L33,7 L44,19 L50,2 L57,18 L67,6 L68,24 L79,21 L76,38 Q70,24 50,23 Q30,24 24,38Z" fill="${hc}" ${O}/>`; break;
    case "seite": haarV = `<path d="M24,42 Q20,10 52,9 Q80,10 77,40 Q72,22 44,24 Q30,30 24,42Z" fill="${hc}" ${O}/>`; break;
    case "glatze": haarV = `<path d="M25,48 Q23,38 27,32 L30,46Z M75,48 Q77,38 73,32 L70,46Z" fill="${hc}"/>`; break;
  }
  // Augen
  const auge = (x) => {
    const y = 44, ac = f.augenfarbe;
    if (opt.zu) return `<path d="M${x - 4.5},${y} Q${x},${y + 3.5} ${x + 4.5},${y}" stroke="${LINIE}" stroke-width="2.2" fill="none"/>`;
    switch (f.augen) {
      case "gross": return `<ellipse cx="${x}" cy="${y}" rx="5.4" ry="6.4" fill="#fff" ${O1}/><circle cx="${x}" cy="${y + .8}" r="3.8" fill="${ac}"/><circle cx="${x}" cy="${y + .8}" r="1.8" fill="#221b33"/><circle cx="${x + 1.4}" cy="${y - 1}" r="1.2" fill="#fff"/>`;
      case "muede": return `<path d="M${x - 4},${y} A4,4 0 0 0 ${x + 4},${y}Z" fill="#2d2440"/><path d="M${x - 5},${y} L${x + 5},${y}" stroke="${LINIE}" stroke-width="2"/>`;
      case "wimpern": return `<circle cx="${x}" cy="${y}" r="3.8" fill="${dunkel(ac, .35)}"/><circle cx="${x + 1.3}" cy="${y - 1.3}" r="1.2" fill="#fff"/><path d="M${x + (x < 50 ? -3 : 3)},${y - 3} l${x < 50 ? -2.5 : 2.5},-2.5 M${x},${y - 3.8} l0,-3" stroke="${LINIE}" stroke-width="1.4"/>`;
      case "sterne": return `<path d="M${x},${y - 5} L${x + 1.6},${y - 1.5} L${x + 5},${y - 1.2} L${x + 2.4},${y + 1.2} L${x + 3.2},${y + 4.8} L${x},${y + 2.8} L${x - 3.2},${y + 4.8} L${x - 2.4},${y + 1.2} L${x - 5},${y - 1.2} L${x - 1.6},${y - 1.5}Z" fill="${ac}" ${O1}/>`;
      case "herz": return `<path d="M${x},${y + 4} L${x - 4.5},${y - .5} A2.4,2.4 0 0 1 ${x},${y - 3.2} A2.4,2.4 0 0 1 ${x + 4.5},${y - .5}Z" fill="#ff4f9a" ${O1}/>`;
      default: return `<circle cx="${x}" cy="${y}" r="3.7" fill="#2d2440"/><circle cx="${x + 1.3}" cy="${y - 1.3}" r="1.25" fill="#fff"/>`;
    }
  };
  let gesicht = `<g class="augen" style="animation-delay:${(Math.random() * 4).toFixed(1)}s">${auge(41)}${auge(59)}</g>`;
  if (f.brauen !== "keine") { const bw = f.brauen === "dick" ? 3.2 : 1.8; gesicht += `<path d="M36,36.5 Q41,33.5 46,36.5 M54,36.5 Q59,33.5 64,36.5" stroke="${dunkel(hc === "#ffffff" ? "#b9b9c4" : hc, .25)}" stroke-width="${bw}" fill="none" stroke-linecap="round"/>`; }
  gesicht += `<ellipse cx="50" cy="49.5" rx="2" ry="1.4" fill="${hd}"/>`;
  if (+f.wangen) gesicht += `<ellipse cx="34" cy="52" rx="4.5" ry="3" fill="#ff8fa8" opacity=".55"/><ellipse cx="66" cy="52" rx="4.5" ry="3" fill="#ff8fa8" opacity=".55"/>`;
  if (+f.sommersprossen) gesicht += [[32,48],[35,50],[30,51],[68,48],[65,50],[70,51]].map(p => `<circle cx="${p[0]}" cy="${p[1]}" r=".9" fill="#a5643a"/>`).join("");
  if (f.bart === "voll") gesicht += `<path d="M26,46 Q28,74 50,74 Q72,74 74,46 Q70,62 58,60 Q50,58 42,60 Q30,62 26,46Z" fill="${hc}" ${O1}/>`;
  const mund = opt.lacht ? "lachen" : f.mund;
  if (mund === "lachen") gesicht += `<path d="M42,53 Q50,66 58,53Z" fill="#7a3348" ${O1}/><ellipse cx="50" cy="59.5" rx="3.5" ry="2" fill="#ff8fa8"/>`;
  else if (mund === "zunge") gesicht += `<path d="M43,54 Q50,61 57,54" stroke="#7a3348" stroke-width="2.4" fill="none" stroke-linecap="round"/><ellipse cx="52.5" cy="59" rx="2.6" ry="2.6" fill="#ff8fa8" ${O1}/>`;
  else if (mund === "oh") gesicht += `<ellipse cx="50" cy="56" rx="2.8" ry="3.6" fill="#7a3348"/>`;
  else if (mund === "grinsen") gesicht += `<path d="M40,53 Q50,64 60,53Z" fill="#fff" ${O1}/>`;
  else gesicht += `<path d="M43,54 Q50,61 57,54" stroke="#7a3348" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if (f.bart === "schnurr" || f.bart === "voll") gesicht += `<path d="M41,52.5 Q45.5,48.5 50,51 Q54.5,48.5 59,52.5 Q54.5,54.5 50,52.6 Q45.5,54.5 41,52.5Z" fill="${hc}" ${O1}/>`;
  if (opt.pflaster === "gesicht") gesicht += `<rect x="60" y="49" width="11" height="5" rx="2" fill="#ffd9a8" ${O1} transform="rotate(-25 65 51)"/><path d="M64,50 L66,52" stroke="#d9a873" stroke-width=".8"/>`;

  let brille = "";
  if (f.brille === "brille") brille = `<circle cx="41" cy="44" r="7" stroke="#333" stroke-width="2" fill="#fff" fill-opacity=".2"/><circle cx="59" cy="44" r="7" stroke="#333" stroke-width="2" fill="#fff" fill-opacity=".2"/><path d="M48,44 L52,44" stroke="#333" stroke-width="2"/>`;
  if (f.brille === "sonne") brille = `<rect x="32" y="39" width="16" height="10" rx="4" fill="#222"/><rect x="52" y="39" width="16" height="10" rx="4" fill="#222"/><path d="M48,43 L52,43" stroke="#222" stroke-width="2"/><path d="M35,41 L39,41" stroke="#fff" stroke-width="1" opacity=".6"/>`;
  if (f.brille === "herz") brille = `<path d="M41,51 L33,43 A4,4 0 0 1 41,38 A4,4 0 0 1 49,43Z" fill="#ff4f9a" ${O1}/><path d="M59,51 L51,43 A4,4 0 0 1 59,38 A4,4 0 0 1 67,43Z" fill="#ff4f9a" ${O1}/><path d="M48,43 L52,43" stroke="#ff4f9a" stroke-width="2"/>`;
  if (f.brille === "stern") { const st = x => `<path d="M${x},36 L${x + 2.3},41 L${x + 7.5},41.5 L${x + 3.5},45 L${x + 4.8},50.5 L${x},47.5 L${x - 4.8},50.5 L${x - 3.5},45 L${x - 7.5},41.5 L${x - 2.3},41Z" fill="#ffd23f" ${O1}/>`; brille = st(41) + st(59) + `<path d="M48,44 L52,44" stroke="#e0a800" stroke-width="2"/>`; }
  let hut = "";
  switch (f.hut) {
    case "kappe": hut = `<path d="M24,30 Q25,6 50,6 Q75,6 76,30Z" fill="#4aa8ff" ${O}/><path d="M50,30 L93,30 Q93,37 72,37 L50,34Z" fill="#2f7fd0" ${O}/><circle cx="50" cy="7" r="3" fill="#2f7fd0"/>`; break;
    case "sonnenhut": hut = `<ellipse cx="50" cy="24" rx="42" ry="8" fill="#f4d27a" ${O}/><path d="M28,24 Q30,0 50,0 Q70,0 72,24Z" fill="#f7dc8f" ${O}/><rect x="29" y="17" width="42" height="5" fill="#ff7fb0"/>`; break;
    case "krone": hut = `<path d="M30,22 L33,2 L42,13 L50,-2 L58,13 L67,2 L70,22Z" fill="#ffd23f" ${O}/><circle cx="50" cy="15" r="2.5" fill="#ff4f6d"/>`; break;
    case "schleife": hut = `<path d="M70,16 L57,8 L58,26Z M70,16 L83,8 L82,26Z" fill="#ff4f9a" ${O1}/><circle cx="70" cy="17" r="3.5" fill="#d93a82" ${O1}/>`; break;
    case "muetze": hut = `<path d="M23,32 Q23,4 50,4 Q77,4 77,32Z" fill="#ff5f7e" ${O}/><rect x="22" y="27" width="56" height="8" rx="4" fill="#fff" ${O1}/><circle cx="50" cy="3" r="6" fill="#fff" ${O1}/>`; break;
    case "koch": hut = `<rect x="32" y="16" width="36" height="14" fill="#fff" ${O}/><circle cx="38" cy="10" r="9" fill="#fff" ${O}/><circle cx="50" cy="5" r="10" fill="#fff" ${O}/><circle cx="62" cy="10" r="9" fill="#fff" ${O}/><rect x="33" y="14" width="34" height="8" fill="#fff"/>`; break;
    case "katzenohren": hut = `<path d="M27,26 L28,4 L44,16Z M73,26 L72,4 L56,16Z" fill="${hc}" ${O}/><path d="M30,20 L31,10 L39,16Z M70,20 L69,10 L61,16Z" fill="#ffb3cf"/>`; break;
    case "blumen": hut = [[28,22,"🌸"],[38,14,"🌼"],[50,11,"🌸"],[62,14,"🌼"],[72,22,"🌸"]].map(p => `<text x="${p[0]}" y="${p[1]}" font-size="11" text-anchor="middle">${p[2]}</text>`).join(""); break;
  }
  if (f.extra === "schal") koerper += `<path d="M36,64 Q50,72 64,64 L64,71 Q50,79 36,71Z" fill="#ff5f7e" ${O1}/><rect x="55" y="70" width="7" height="18" rx="2" fill="#ff5f7e" ${O1}/>`;

  const kopf = `<g transform="translate(50 68) scale(${kopfS}) translate(-50 -68)">${haarH}
    <rect x="45" y="58" width="10" height="12" fill="${h}" ${O1}/>
    <circle cx="25" cy="45" r="5" fill="${h}" ${O1}/><circle cx="75" cy="45" r="5" fill="${h}" ${O1}/>
    <circle cx="50" cy="42" r="25" fill="${h}" ${O}/>${gesicht}${haarV}${brille}${hut}</g>`;
  return `<svg viewBox="0 -8 100 174" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs><g class="atmen">${hinten}${beine}${arme}${koerper}${kopf}</g></svg>`;
}

// ================================================================ Möbel und Geräte
// Stil: leicht von oben gesehen, weiche Farben, keine dunklen Umrisse. Deckflächen heller, Vorderseiten satter.
// Jede Zeichnung: vb = [Breite, Höhe] der Zeichenfläche, z(d, k) = Inhalt, vorne(d, k) = Teil vor einer Figur.
const svgVon = (vb, inhalt, extra) => `<svg viewBox="0 0 ${vb[0]} ${vb[1]}" xmlns="http://www.w3.org/2000/svg" ${extra || ""}>${inhalt}</svg>`;
const emojiText = (x, y, e, gr) => `<text x="${x}" y="${y}" font-size="${gr || 12}" text-anchor="middle">${e}</text>`;
const R = (x, y, w, h, c, rx, z) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx == null ? 2 : rx}" fill="${c}" ${z || ""}/>`;
const E = (cx, cy, rx, ry, c, z) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${c}" ${z || ""}/>`;
const C = (cx, cy, r, c, z) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" ${z || ""}/>`;
const P = (d, c, z) => `<path d="${d}" fill="${c}" ${z || ""}/>`;
const L = (d, c, w, z) => `<path d="${d}" stroke="${c}" stroke-width="${w || 2}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${z || ""}/>`;
const HOLZ = "#e8b98c", HOLZ_D = "#cf9a68", HOLZ_H = "#f6d6b2", WEISS = "#fdfaf5", METALL = "#d3dae5", METALL_D = "#aab4c4", DUNKEL = "#5a5368";
const schattenSVG = vb => E(vb[0] / 2, vb[1] - 1.5, vb[0] * .47, Math.max(2, vb[1] * .045), "rgba(70,40,90,.13)");
// Kasten von leicht oben: Deckfläche (heller) und Vorderseite
const kasten = (x, y, w, h, t, c, rx) => R(x, y, w, t + 6, hell(c, .3), rx == null ? 4 : rx) + R(x, y + t, w, h, c, rx == null ? 4 : rx) + R(x, y + t, w, 1.6, dunkel(c, .06), 0);

function motivSVG(m) {   // Bildmotiv in der Fläche 5..55 × 5..43
  switch (m) {
    case "blume": return R(5, 5, 50, 38, "#fff4cc", 0) + L("M30,43 L30,26", "#5cbf7a", 2) + [0, 72, 144, 216, 288].map(a => C(30 + 6 * Math.cos(a * Math.PI / 180), 20 + 6 * Math.sin(a * Math.PI / 180), 4.2, "#ff9fc7")).join("") + C(30, 20, 3.4, "#ffd84d");
    case "meer": return R(5, 5, 50, 38, "#cdeeff", 0) + P("M5,30 Q11,27 17,30 T29,30 T41,30 T55,30 L55,43 L5,43Z", "#5ab4e6") + P("M26,28 L36,28 L34,31 L28,31Z", "#d9a774") + P("M31,28 L31,16 L37,26Z", "#ffffff");
    case "regenbogen": return R(5, 5, 50, 38, "#eef9ff", 0) + ["#ff8f8f","#ffbf7a","#ffe27a","#8fdc9a","#8fc8ff","#c3a8ff"].map((c, i) => L(`M${10 + i * 3},43 A${20 - i * 3},${20 - i * 3} 0 0 1 ${50 - i * 3},43`, c, 3)).join("") + C(14, 40, 4, "#fff") + C(46, 40, 4, "#fff");
    case "katze": return R(5, 5, 50, 38, "#ffe8f2", 0) + C(30, 27, 10, "#ffbf7a") + P("M21,21 L22,13 L28,18Z M39,21 L38,13 L32,18Z", "#ffbf7a") + C(26, 26, 1.4, "#4a3b66") + C(34, 26, 1.4, "#4a3b66") + L("M28,30 Q30,32 32,30", "#4a3b66", 1.2);
    case "sterne": return R(5, 5, 50, 38, "#4a5794", 0) + [[14, 14, 6], [36, 12, 4], [46, 26, 5], [22, 32, 4], [32, 24, 3]].map(([x, y, s]) => `<text x="${x}" y="${y + s / 2}" font-size="${s * 2}" text-anchor="middle" fill="#ffe680">★</text>`).join("") + C(44, 12, 4, "#fff6c4");
    case "eis": return R(5, 5, 50, 38, "#e8fbf3", 0) + P("M24,24 L36,24 L30,42Z", "#e8b06c") + C(26, 21, 6, "#ff9fc7") + C(34, 21, 6, "#fff2c0") + C(30, 14, 6, "#8fdcb0");
    case "herz": return R(5, 5, 50, 38, "#fff0f5", 0) + P("M30,38 L16,24 A7,7 0 0 1 30,14 A7,7 0 0 1 44,24Z", "#ff7fa8");
    default: return R(5, 5, 50, 38, "#cdeeff", 0) + C(43, 14, 4, "#ffe27a") + P("M5,43 L20,20 L30,32 L38,24 L55,43Z", "#79c98a") + P("M20,20 L16,26 L24,26Z", "#ffffff");
  }
}
const nestedMotiv = (m, x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="5 5 50 38" preserveAspectRatio="xMidYMid slice">${motivSVG(m)}</svg>`;

const GRAFIK = {
  kuehlschrank:{vb:[56,120], z:d => R(2, 0, 52, 118, "#eef3f8", 7) + R(2, 0, 52, 7, "#fbfdff", 6) + (d.offen
    ? R(6, 6, 44, 106, "#d9effa", 4) + [35, 69, 102].map(y => R(6, y, 44, 2.6, "#ffffff", 1)).join("") + C(28, 10, 2.6, "#fffbd0")
    : R(2, 40, 52, 2, "#d6dee8", 0) + R(44, 14, 3, 16, METALL_D, 1.5) + R(44, 48, 3, 26, METALL_D, 1.5) + C(14, 56, 3, "#ff9fc7") + C(22, 62, 2.6, "#ffd84d")
      + R(10, 70, 11, 13, "#ffffff", 1, 'transform="rotate(-6 15 76)"') + L("M12,74 L19,73 M12,77 L18,76", "#c9d4e2", 1)) + R(4, 112, 48, 6, "#d6dee8", 3)},
  herd:{vb:[64,92], z:d => {
    const an = d.an, topf = (d.topf || []).map(t => K[t].e).join("");
    return R(2, 24, 60, 14, "#ece6de", 5) + R(2, 32, 60, 58, "#fbf7f2", 6)
      + E(16, 29, 8, 2.6, an ? "#ff7a4a" : DUNKEL) + E(48, 29, 8, 2.6, an ? "#ff7a4a" : DUNKEL)
      + (an ? E(32, 27, 15, 3, "#ff9a5c", 'class="flamme"') : "")
      + R(18, 10, 28, 18, "#a9bccf", 6) + E(32, 10, 14, 3.6, "#c9d6e3") + R(11, 13, 8, 3, "#8fa3b8", 1.5) + R(45, 13, 8, 3, "#8fa3b8", 1.5)
      + (topf ? emojiText(32, 9, topf, 8) : "")
      + (an && topf ? L("M26,6 Q22,0 26,-6 M34,4 Q30,-2 34,-8 M42,6 Q38,0 42,-6", "#dde5ee", 2.5, 'class="dampf"') : "")
      + [12, 20, 44, 52].map((x, i) => C(x, 41, 2.2, i === 0 && an ? "#ff6a4a" : "#d2c8bc")).join("")
      + R(8, 46, 48, 38, DUNKEL, 5) + R(14, 52, 36, 18, an ? "#ffb36b" : "#7a7290", 3) + R(16, 48, 32, 2.5, METALL, 1.2); }},
  spuele:{vb:[80,62], z:d => R(0, 8, 80, 16, "#e4e8ef", 4) + R(0, 20, 80, 38, WEISS, 4) + R(0, 20, 80, 2, "#dfe3ea", 0) + R(39.4, 24, 1.2, 30, "#e6e0d6", 0)
      + C(35, 38, 1.6, METALL_D) + C(45, 38, 1.6, METALL_D) + E(58, 15, 15, 4.6, "#c3cddb") + E(58, 15.6, 12, 3.4, "#a9b6c8")
      + L("M58,11 L58,3 Q58,0 62,0 L66,0", METALL_D, 3) + (d.an ? R(64.5, 1, 2.6, 13, "#8fd8ff", 1, 'class="wasser"') : "") + R(2, 56, 76, 5, "#e2dcd2", 2)},
  toaster:{vb:[44,34], z:d => (d.toast ? R(11, 0, 9, 10, "#e2a96c", 3) + R(24, 0, 9, 10, "#e2a96c", 3) : "")
      + R(2, 8, 40, 24, "#ffa577", 8) + R(2, 8, 40, 7, "#ffc39e", 6) + R(9, 9.5, 10, 3, "#6a5a6a", 1.5) + R(24, 9.5, 10, 3, "#6a5a6a", 1.5)
      + R(40, 15, 3, 7, "#e88a5c", 1.5) + (d.toast ? C(22, 24, 2.5, "#ff6a3c") : "")},
  muelleimer:{vb:[36,50], z:() => P("M5,12 L31,12 L28,49 L8,49Z", "#9adbb0") + E(18, 12, 13, 4, "#b9ecc9") + R(14, 4, 8, 6, "#86c99c", 2)
      + L("M14,22 L15,42 M18,22 L18,42 M22,22 L21,42", "#bdeccc", 1.6) + R(14, 46, 8, 3, "#6fb487", 1.5)},
  tisch:{vb:[100,60], z:d => { const c = d.farbe || "#e8b98c"; return R(14, 22, 4, 22, dunkel(c, .28), 2) + R(82, 22, 4, 22, dunkel(c, .28), 2)
      + R(0, 0, 100, 24, hell(c, .22), 7) + L("M12,8 L56,8 M30,15 L84,15", hell(c, .4), 1.2) + R(0, 19, 100, 7, c, 4)
      + R(6, 24, 6, 34, dunkel(c, .12), 2.5) + R(88, 24, 6, 34, dunkel(c, .12), 2.5); }},
  couchtisch:{vb:[70,34], z:d => { const c = d.farbe || "#f3d7b0"; return R(10, 14, 4, 18, dunkel(c, .22), 2) + R(56, 14, 4, 18, dunkel(c, .22), 2) + R(33, 16, 4, 17, dunkel(c, .15), 2)
      + E(35, 13, 34, 9, dunkel(c, .08)) + E(35, 10.5, 34, 9, hell(c, .2)); }},
  stuhl:{vb:[40,70], z:d => { const c = d.farbe || "#f2b880"; return R(9, 40, 3, 18, dunkel(c, .3), 1.5) + R(28, 40, 3, 18, dunkel(c, .3), 1.5)
      + R(6, 0, 28, 34, c, 8) + R(10, 4, 20, 10, hell(c, .25), 4) + R(3, 28, 34, 13, hell(c, .28), 5) + R(3, 37, 34, 6, dunkel(c, .05), 3)
      + R(5, 42, 4, 27, dunkel(c, .15), 2) + R(31, 42, 4, 27, dunkel(c, .15), 2); }},
  sofa:{vb:[140,72], z:d => { const c = d.farbe || "#ff9fc4"; return R(10, 0, 120, 36, c, 16) + R(16, 6, 52, 26, hell(c, .12), 11) + R(72, 6, 52, 26, hell(c, .12), 11)
      + R(8, 30, 124, 18, hell(c, .3), 8) + R(8, 44, 124, 16, dunkel(c, .04), 7) + L("M70,33 L70,56", dunkel(c, .08), 1.5)
      + R(0, 16, 22, 46, c, 11) + R(0, 16, 22, 9, hell(c, .25), 8) + R(118, 16, 22, 46, c, 11) + R(118, 16, 22, 9, hell(c, .25), 8)
      + R(24, 16, 16, 15, hell(c, .6), 5, 'transform="rotate(-10 32 23)"') + R(100, 16, 16, 15, "#ffffff", 5, 'transform="rotate(9 108 23)"') + C(108, 23, 2.5, hell(c, .2))
      + R(16, 60, 5, 10, "#a08070", 2) + R(119, 60, 5, 10, "#a08070", 2); }},
  sessel:{vb:[70,70], z:d => { const c = d.farbe || "#b79cff"; return R(12, 0, 46, 36, c, 14) + R(17, 5, 36, 26, hell(c, .12), 10)
      + R(10, 30, 50, 18, hell(c, .3), 7) + R(10, 44, 50, 15, dunkel(c, .04), 6)
      + R(0, 16, 18, 46, c, 9) + R(0, 16, 18, 8, hell(c, .25), 7) + R(52, 16, 18, 46, c, 9) + R(52, 16, 18, 8, hell(c, .25), 7)
      + R(12, 58, 5, 11, "#a08070", 2) + R(53, 58, 5, 11, "#a08070", 2); }},
  sitzsack:{vb:[50,40], z:d => { const c = d.farbe || "#ffd86b"; return P("M6,36 Q1,16 17,9 Q30,2 40,10 Q51,18 46,36 Q26,42 6,36Z", c) + E(26, 13, 12, 5, hell(c, .35)) + E(26, 22, 15, 6, dunkel(c, .06)); }},
  fernseher:{vb:[90,74], z:d => R(2, 46, 86, 9, HOLZ_H, 3) + R(2, 50, 86, 22, HOLZ, 4) + R(44.4, 54, 1.2, 16, HOLZ_D, 0) + C(38, 62, 1.6, HOLZ_D) + C(52, 62, 1.6, HOLZ_D)
      + R(40, 40, 10, 8, "#403a52", 1) + R(8, 0, 74, 44, "#403a52", 6)
      + (d.an ? `<g class="tvbild">${R(12, 4, 66, 35, "#8fd8ff", 3) + C(30, 20, 8, "#ffe27a") + P("M12,39 L34,24 L50,39Z", "#79c98a") + P("M40,39 L60,20 L78,39Z", "#5ab87a") + C(64, 12, 4, "#fff")}</g>`
             : R(12, 4, 66, 35, "#2a2638", 3) + L("M18,9 L32,9", "#ffffff", 2, 'opacity=".18"'))
      + C(77, 41, 1.3, d.an ? "#5fd38a" : "#ff7f7f")},
  stehlampe:{vb:[30,110], z:d => (d.an ? C(15, 22, 34, "#fff3b0", 'class="leuchten" opacity=".5"') : "") + E(15, 106, 11, 3.5, "#9a8aa8") + R(13.8, 28, 2.4, 78, "#d7cbbb", 1)
      + P("M5,30 L9,4 L21,4 L25,30Z", d.an ? "#fff1c4" : "#ffd2a1") + E(15, 30, 10, 2.5, d.an ? "#ffe9a8" : "#efbd8a") + E(15, 4, 6, 1.6, d.an ? "#fffbe8" : "#ffe2c2")},
  tischlampe:{vb:[30,40], z:d => (d.an ? C(15, 12, 20, "#fff3b0", 'class="leuchten" opacity=".5"') : "") + E(15, 37, 9, 2.5, "#c3a8ff") + R(13.8, 18, 2.4, 19, "#ff9fc7", 1)
      + P("M5,20 L9,4 L21,4 L25,20Z", d.an ? "#fff1c4" : "#ffc4dc") + E(15, 20, 10, 2, d.an ? "#ffe9a8" : "#f6a8c8")},
  teppich:{vb:[160,40], z:d => { const c = d.farbe || "#9fc8ff"; return E(80, 20, 79, 19, c) + E(80, 20, 66, 14, "none", `stroke="${hell(c, .45)}" stroke-width="3" stroke-dasharray="7 5"`) + E(80, 20, 32, 6, hell(c, .25)); }},
  bild:{vb:[60,48], z:d => R(0, 0, 60, 48, "#ffffff", 4) + motivSVG(d.motiv || "berge") + R(0, 44, 60, 4, "rgba(70,40,90,.08)", 2)},
  poster:{vb:[44,58], z:d => R(0, 0, 44, 58, "#fffaf2", 2) + nestedMotiv(d.motiv || "regenbogen", 4, 5, 36, 46) + R(14, -3, 16, 6, "#ffe9a8", 1, 'opacity=".85"')},
  uhr:{vb:[40,40], z:() => { const t = new Date(), hw = ((t.getHours() % 12) + t.getMinutes() / 60) * 30, mw = t.getMinutes() * 6, rad = a => a * Math.PI / 180;
    return C(20, 20, 19, "#ff9fc4") + C(20, 20, 15.5, "#fffdf8") + [0, 90, 180, 270].map(a => C(20 + 12 * Math.sin(rad(a)), 20 - 12 * Math.cos(rad(a)), 1.4, "#c3a8ff")).join("")
      + L(`M20,20 L${20 + 8 * Math.sin(rad(hw))},${20 - 8 * Math.cos(rad(hw))}`, "#4a3b66", 2.6) + L(`M20,20 L${20 + 12 * Math.sin(rad(mw))},${20 - 12 * Math.cos(rad(mw))}`, "#4a3b66", 1.6) + C(20, 20, 1.8, "#ff7fa8"); }},
  wandregal:{vb:[70,24], z:() => P("M8,16 L8,24 L16,16Z", HOLZ_D) + P("M62,16 L62,24 L54,16Z", HOLZ_D) + R(0, 9, 70, 5, HOLZ_H, 2) + R(0, 12, 70, 5, HOLZ, 2)},
  girlande:{vb:[120,24], z:() => L("M2,4 Q60,28 118,4", "#c9b8a6", 1.2) + Array.from({length:10}, (_, i) => {
      const t = (i + .5) / 10, x = 2 + 116 * t, y = 4 + 24 * t * (1 - t);
      return P(`M${x - 4.5},${y} L${x + 4.5},${y} L${x},${y + 9}Z`, ["#ff9fc7","#ffd86b","#8fdcb0","#9fc8ff","#c3a8ff"][i % 5]); }).join("")},
  lichterkette:{vb:[120,20], z:d => L("M2,4 Q60,24 118,4", "#9a8a7a", 1) + Array.from({length:11}, (_, i) => {
      const t = (i + .5) / 11, x = 2 + 116 * t, y = 4 + 20 * t * (1 - t) + 3, f = ["#ffe27a","#ff9fc7","#9fe0ff","#b6f0a0"][i % 4];
      return (d.an ? C(x, y, 4.5, f, 'opacity=".35" class="leuchten"') : "") + E(x, y, 2, 2.8, d.an ? f : "#e8e0d4"); }).join("")},
  haengepflanze:{vb:[40,56], z:() => L("M20,0 L20,10", "#b8a898", 1.2) + P("M8,10 L32,10 L28,24 L12,24Z", "#f2a97e") + E(20, 10, 12, 2.5, "#f7c3a0")
      + L("M12,22 Q8,36 12,48 M20,24 Q22,40 18,54 M28,22 Q32,34 29,44", "#5cb874", 1.8)
      + [[11,30],[12,42],[21,34],[19,48],[30,30],[29,40],[16,26],[25,26]].map(([x, y], i) => E(x, y, 3.4, 2, i % 2 ? "#7fd08f" : "#5cb874", `transform="rotate(${i * 40} ${x} ${y})"`)).join("")},
  pflanze:{vb:[50,70], z:() => L("M25,48 L20,22 M25,48 L32,18 M25,48 L12,32 M25,48 L38,34 M25,48 L25,14", "#5a9e6a", 2)
      + [[20,20,9,5,-30,"#6ccb84"],[33,16,9,5,30,"#5cb874"],[11,31,8,4.5,-50,"#7fd897"],[39,33,8,4.5,40,"#6ccb84"],[25,12,7,4.5,0,"#8ee3a3"],[16,40,7,4,-20,"#5cb874"],[34,42,7,4,20,"#7fd897"]]
        .map(([x, y, rx, ry, r, c]) => E(x, y, rx, ry, c, `transform="rotate(${r} ${x} ${y})"`)).join("")
      + P("M12,48 L38,48 L34,69 L16,69Z", "#f2a97e") + E(25, 48, 13, 3, "#f7c3a0") + E(25, 48.5, 10, 2, "#9a7458")},
  radio:{vb:[50,36], z:d => (d.an ? `<text class="noten" x="10" y="2" font-size="10" fill="#a26bff">♪</text><text class="noten n2" x="36" y="0" font-size="11" fill="#ff7fb0">♫</text>` : "")
      + L("M8,10 L32,0", "#b8a898", 1.2) + R(2, 10, 46, 24, "#ff8f8f", 7) + R(2, 10, 46, 6, "#ffb3b3", 6) + C(15, 24, 7, "#ffd6d6")
      + [[12,21],[18,21],[12,27],[18,27],[15,24]].map(([x, y]) => C(x, y, 1.1, "#e06a6a")).join("") + R(28, 18, 15, 5, "#ffffff", 2) + C(31, 28, 2.4, "#ffd84d") + C(39, 28, 2.4, "#ffd84d")},
  buecherregal:{vb:[70,110], z:d => { const c = d.farbe || HOLZ;
    const buecher = (x0, yb) => ["#ff8f8f","#8fc8ff","#ffe27a","#8fdc9a","#c3a8ff"].map((f, i) => R(x0 + i * 5.6, yb - 22 + (i % 2) * 4, 5, 22 - (i % 2) * 4, f, 1)).join("");
    return R(0, 0, 70, 110, c, 4) + R(0, 0, 70, 5, hell(c, .28), 4) + R(5, 6, 60, 100, dunkel(c, .2), 2) + [32, 66, 101].map(y => R(3, y, 64, 4, hell(c, .15), 1)).join("")
      + buecher(8, 32) + buecher(8, 66) + E(56, 0, 7, 3, "#6ccb84") + E(52, -2, 4, 2.5, "#8ee3a3"); }},
  bett:{vb:[150,80], z:() => R(0, 0, 24, 74, HOLZ, 9) + R(0, 0, 24, 8, HOLZ_H, 8) + R(8, 48, 140, 14, HOLZ, 4)
      + R(14, 22, 128, 22, "#ffffff", 9) + R(14, 38, 128, 12, "#f2ede6", 5) + E(62, 28, 17, 8, "#ffffff") + E(62, 31, 15, 4, "#f1ece4")
      + R(136, 26, 14, 44, HOLZ, 7) + R(136, 26, 14, 7, HOLZ_H, 6) + R(12, 62, 6, 12, HOLZ_D, 2) + R(132, 62, 6, 12, HOLZ_D, 2),
    vorne:d => { const c = d.farbe || "#9fc8ff"; return R(84, 36, 58, 16, dunkel(c, .06), 6) + R(84, 20, 58, 26, c, 9) + R(84, 20, 58, 7, hell(c, .3), 7)
      + [[100,34],[118,30],[130,40],[108,42]].map(([x, y]) => C(x, y, 2.6, hell(c, .45))).join(""); }},
  spielzeugkiste:{vb:[64,48], z:d => { const c = d.farbe || "#ffb86b";
    return (d.offen ? R(2, -10, 60, 14, hell(c, .2), 5) : "") + R(2, 14, 60, 32, c, 5)
      + (d.offen ? R(4, 10, 56, 8, dunkel(c, .35), 3) : R(0, 6, 64, 11, dunkel(c, .06), 5) + R(0, 4, 64, 6, hell(c, .28), 5))
      + emojiText(32, 38, "★", 12).replace('text-anchor', 'fill="#fff" text-anchor') + emojiText(16, 34, "★", 8).replace('text-anchor', 'fill="#fff" text-anchor') + emojiText(48, 34, "★", 8).replace('text-anchor', 'fill="#fff" text-anchor'); }},
  schreibtisch:{vb:[100,62], z:d => { const c = d.farbe || "#f6d2a8"; return R(0, 2, 100, 20, hell(c, .2), 5) + R(0, 17, 100, 6, c, 3)
      + R(4, 23, 32, 37, dunkel(c, .04), 3) + R(4, 35, 32, 1.2, dunkel(c, .2), 0) + R(4, 47, 32, 1.2, dunkel(c, .2), 0)
      + [29, 41, 53].map(y => C(20, y, 1.6, dunkel(c, .3))).join("") + R(88, 23, 6, 37, dunkel(c, .08), 2); }},
  kommode:{vb:[80,62], z:d => { const c = d.farbe || "#ffffff"; return R(0, 0, 80, 12, hell(c, .25), 4) + R(2, 9, 76, 46, dunkel(c, .04), 4)
      + R(2, 24, 76, 1.2, dunkel(c, .15), 0) + R(2, 39, 76, 1.2, dunkel(c, .15), 0) + [16, 31.5, 46.5].map(y => R(34, y - 1.5, 12, 3, "#ffb35c", 1.5)).join("")
      + R(8, 55, 5, 6, "#c8a88a", 1) + R(67, 55, 5, 6, "#c8a88a", 1); }},
  kleiderschrank:{vb:[80,124], z:d => { const c = d.farbe || "#fbe6cc";
    return R(0, 0, 80, 122, dunkel(c, .03), 5) + R(0, 0, 80, 6, hell(c, .3), 5) + (d.offen
      ? R(5, 8, 70, 110, "#f3e6d4", 3) + L("M9,16 L71,16", METALL_D, 2.5)
        + ["#ff9fc7","#8fc8ff","#ffe27a","#8fdc9a"].map((f, i) => P(`M${16 + i * 15},16 L${11 + i * 15},22 L${11 + i * 15},48 L${21 + i * 15},48 L${21 + i * 15},22Z`, f)).join("")
        + R(5, 62, 70, 3, dunkel(c, .12), 1) + R(5, 114, 70, 3, dunkel(c, .12), 1)
      : R(39.4, 8, 1.2, 110, dunkel(c, .15), 0) + R(8, 14, 26, 40, "none", 3, `stroke="${dunkel(c, .1)}" stroke-width="2"`) + R(46, 14, 26, 40, "none", 3, `stroke="${dunkel(c, .1)}" stroke-width="2"`)
        + R(34, 60, 2.5, 14, HOLZ_D, 1) + R(43.5, 60, 2.5, 14, HOLZ_D, 1)); }},
  badewanne:{vb:[140,62], z:d => L("M16,24 L16,8 Q16,4 22,4 L30,4", METALL_D, 3.5) + (d.an ? R(28.5, 3, 3, 18, "#8fd8ff", 1, 'class="wasser"') : "")
      + R(4, 16, 132, 42, "#f6f1ea", 20) + E(70, 22, 64, 9, "#ffffff") + E(70, 23, 57, 6.5, "#a9dcf5"),
    vorne:d => (d.an ? [[26,22,6],[38,18,7],[52,21,5],[66,17,8],[82,20,6],[96,17,7],[110,21,6]].map(([x, y, r]) => C(x, y, r, "#ffffff", 'class="schaum"')).join("") : "")
      + R(4, 25, 132, 33, "#f6f1ea", 17) + R(10, 25, 120, 3, "#ffffff", 1.5) + R(16, 55, 8, 7, "#ffd86b", 2) + R(116, 55, 8, 7, "#ffd86b", 2)},
  dusche:{vb:[56,130], z:d => R(2, 0, 52, 124, "#e7f4f9", 5) + [20, 40, 60, 80, 100].map(y => R(2, y, 52, 1, "#d2e8f0", 0)).join("") + [19, 37].map(x => R(x, 0, 1, 118, "#d2e8f0", 0)).join("")
      + L("M46,60 L46,12 L36,12", METALL_D, 3) + E(32, 14, 8, 3.4, METALL)
      + (d.an ? `<g class="tropfen">${[26, 30, 34, 38].map((x, i) => L(`M${x},${20 + i * 2} L${x - 2 + i},${110}`, "#8fd8ff", 2, 'stroke-dasharray="4 7"')).join("")}</g>` : "")
      + R(0, 118, 56, 10, "#ffffff", 4) + R(0, 124, 56, 6, "#e4ebf0", 3),
    vorne:() => R(3, 12, 50, 112, "#bfe6ff", 4, 'opacity=".22"') + R(3, 12, 50, 112, "none", 4, 'stroke="#a9dcf0" stroke-width="1.5"') + L("M10,22 L22,22", "#ffffff", 2, 'opacity=".7"') + R(47, 62, 3, 16, METALL_D, 1.5)},
  toilette:{vb:[42,66], z:() => R(8, 0, 26, 24, WEISS, 5) + R(8, 0, 26, 5, "#ffffff", 4) + C(21, 3, 2, "#bfe6ff")
      + P("M11,46 L31,46 L28,65 L14,65Z", "#efe9e1") + E(21, 38, 18, 9, "#ffffff") + E(21, 38, 12, 5, "#d6ecf6")},
  waschbecken:{vb:[52,72], z:d => R(20, 30, 12, 41, "#efe9e1", 4) + P("M2,16 L50,16 Q50,34 26,34 Q2,34 2,16Z", WEISS) + E(26, 17, 24, 4.5, "#ffffff") + E(26, 17.5, 19, 3.2, "#cfe6f2")
      + L("M26,14 L26,4 Q26,1 30,1 L33,1", METALL_D, 3) + (d.an ? R(31.5, 1, 2.6, 14, "#8fd8ff", 1, 'class="wasser"') : "")},
  spiegel:{vb:[44,58], z:() => E(22, 29, 21, 28, "#ffd86b") + E(22, 29, 16.5, 23, "#dff1fb") + L("M13,17 Q15,11 21,9", "#ffffff", 3) + L("M27,42 L31,36", "#ffffff", 2, 'opacity=".7"')},
  waschmaschine:{vb:[56,66], z:d => R(2, 2, 52, 62, WEISS, 6) + R(2, 2, 52, 7, "#ffffff", 5) + R(2, 9, 52, 9, "#eef1f5", 0) + C(44, 13, 3, "#ff9fc7") + R(8, 11, 14, 4, "#bfe6ff", 1.5)
      + C(28, 40, 17, "#dfe5ec") + C(28, 40, 13, "#9fd3f0")
      + `<g class="${d.waescht ? "trommel" : ""}">${C(23, 38, 4, "#ff9fc7", 'opacity=".85"') + C(33, 44, 4.5, "#ffd84d", 'opacity=".85"') + C(30, 33, 3, "#8fdc9a", 'opacity=".85"')}</g>`
      + L("M20,32 Q24,28 30,28", "#ffffff", 2, 'opacity=".7"')},
  aquarium:{vb:[70,58], z:() => R(4, 38, 62, 19, HOLZ, 3) + R(4, 38, 62, 4, HOLZ_H, 2) + R(2, 2, 66, 36, "#9fe0ff", 4, 'opacity=".9"') + R(2, 2, 66, 4, METALL, 2)
      + R(4, 30, 62, 6, "#f4dc9a", 2) + L("M12,34 Q10,24 14,16 M16,34 Q18,26 16,20", "#5cb874", 2.5)
      + `<g class="fisch">${emojiText(30, 20, "🐠", 10)}</g><g class="fisch f2">${emojiText(50, 28, "🐟", 8)}</g>` + C(58, 10, 1.5, "#fff") + C(56, 16, 1, "#fff")},
  tierkorb:{vb:[60,30], z:d => { const c = d.farbe || "#ff9f9f"; return E(30, 17, 29, 12, "#dfab72") + E(30, 14, 26, 9, "#efc28e") + E(30, 15, 21, 7, c) + E(26, 13, 9, 2.5, hell(c, .35)); }},
  kratzbaum:{vb:[50,100], z:() => R(4, 86, 42, 12, "#b98a62", 4) + R(4, 86, 42, 4, "#d2a67c", 3) + R(10, 12, 8, 78, "#efd7ac", 2) + R(32, 50, 8, 40, "#efd7ac", 2)
      + [20, 30, 40, 60, 70, 80].map(y => L(`M10,${y} L18,${y + 3}`, "#d9b984", 1.2)).join("")
      + E(25, 12, 22, 5, "#a98be6") + E(25, 10, 22, 5, "#c3a8ff") + E(34, 51, 14, 4, "#a98be6") + E(34, 49, 14, 4, "#c3a8ff") + L("M40,51 L40,62", "#9a8a7a", 1) + C(40, 64, 3, "#ff9fc7")},
  regal:{vb:[70,100], z:d => { const l = LAEDEN[d.laden] || {n:"", waren:[]};
    const zeigen = l.waren.filter((w, i, a) => a.findIndex(v => (Array.isArray(v) ? v[0] : v) === (Array.isArray(w) ? w[0] : w)) === i).slice(0, 9);
    const ware = (w, i) => {
      const typ = Array.isArray(w) ? w[0] : w, x = 16 + (i % 3) * 19, yb = 41 + Math.floor(i / 3) * 26;
      if (K[typ].e) return emojiText(x, yb - 1, K[typ].e, 13);
      const g = GRAFIK[typ]; return `<svg x="${x - 9}" y="${yb - 19}" width="18" height="19" viewBox="0 0 ${g.vb[0]} ${g.vb[1]}" preserveAspectRatio="xMidYMax meet" overflow="visible">${g.z(Object.assign({typ}, Array.isArray(w) ? w[1] : {}), {})}</svg>`;
    };
    return R(0, 10, 70, 90, HOLZ, 4) + R(4, 14, 62, 82, HOLZ_H, 2) + [40, 66, 92].map(y => R(2, y, 66, 4, HOLZ, 1)).join("") + zeigen.map(ware).join("")
      + R(0, 0, 70, 13, "#ffffff", 5) + `<text x="35" y="9.5" font-size="6.5" text-anchor="middle" font-weight="700" fill="#4a3b66">${l.n}</text>`; }},
  kasse:{vb:[100,60], z:() => R(0, 16, 100, 12, "#f0f0f5", 4) + R(4, 18, 56, 6, DUNKEL, 2) + [12, 22, 32, 42, 52].map(x => R(x, 18, 1, 6, "#7a7290", 0)).join("")
      + R(0, 24, 100, 34, "#ffa8c9", 5) + R(0, 24, 100, 3, "#ffc4dc", 2) + R(62, 0, 30, 18, "#6a6480", 4) + R(66, 3, 22, 7, "#b6ffc6", 2)
      + `<text x="50" y="46" font-size="11" text-anchor="middle" fill="#fff" font-weight="700">💰 Kasse</text>`},
  einkaufswagen:{vb:[60,55], z:() => L("M2,8 L10,8 L16,40 L50,40", METALL_D, 3) + P("M12,14 L56,14 L50,36 L17,36Z", "#e2e8f0")
      + [20, 28, 36, 44].map(x => L(`M${x},14 L${x - 1},36`, "#c6cfdb", 1.2)).join("") + L("M14,25 L53,25", "#c6cfdb", 1.2) + R(10, 12, 48, 3, "#ff9fc7", 1.5) + C(20, 48, 5, DUNKEL) + C(46, 48, 5, DUNKEL)},
  friseurstuhl:{vb:[55,80], z:d => { const c = d.farbe || "#ff8fbf"; return R(10, 0, 35, 32, c, 11) + R(14, 4, 27, 10, hell(c, .25), 5) + R(6, 28, 43, 14, hell(c, .28), 6) + R(6, 38, 43, 8, dunkel(c, .04), 4)
      + R(1, 24, 10, 16, c, 5) + R(44, 24, 10, 16, c, 5) + R(24, 46, 7, 22, METALL, 2) + E(27.5, 72, 20, 6, METALL_D) + E(27.5, 70.5, 20, 5, METALL); }},
  kleiderstange:{vb:[110,90], z:d => { const fb = d.variante ? ["#c3a8ff","#5fe0d4","#ffe27a","#ff8f8f","#7f9fe6"] : ["#ff9fc7","#8fdc9a","#8fc8ff","#ffb36b","#ffffff"];
    return R(4, 8, 4, 78, METALL_D, 1) + R(102, 8, 4, 78, METALL_D, 1) + R(2, 6, 106, 4, METALL, 2) + R(0, 84, 110, 5, METALL_D, 2)
      + fb.map((c, i) => { const x = 16 + i * 19; return L(`M${x},8 L${x},13`, "#9aa3b5", 1.2) + (i % 2 ? P(`M${x - 8},14 L${x + 8},14 L${x + 12},62 L${x - 12},62Z`, c) + R(x - 8, 14, 16, 4, dunkel(c, .08), 2)
        : P(`M${x - 9},14 L${x + 9},14 L${x + 9},48 L${x - 9},48Z M${x - 9},14 L${x - 14},28 L${x - 9},30 M${x + 9},14 L${x + 14},28 L${x + 9},30`, c) + R(x - 9, 30, 18, 3, hell(c, .4), 1)); }).join(""); }},
  baum:{vb:[120,150], z:() => R(52, 78, 16, 70, "#b5845a", 5) + L("M60,100 L46,86", "#b5845a", 6)
      + [[60,40,34,"#6ccb84"],[34,58,24,"#5cbf78"],[86,58,24,"#5cbf78"],[44,30,22,"#7fd897"],[78,30,22,"#7fd897"],[60,70,22,"#5cbf78"]].map(([x, y, r, c]) => C(x, y, r, c)).join("")
      + C(54, 34, 16, "#8ee3a3") + [[44,40],[74,52],[60,26],[38,62],[84,36]].map(([x, y]) => C(x, y, 3.5, "#ff7f7f")).join("")},
  busch:{vb:[60,40], z:() => [[14,26,12],[30,20,15],[46,26,12],[24,30,10],[38,30,10]].map(([x, y, r], i) => C(x, y, r, i % 2 ? "#6ccb84" : "#5cbf78")).join("")
      + C(26, 15, 6, "#8ee3a3") + [[18,22],[34,14],[44,24],[28,28]].map(([x, y], i) => C(x, y, 2.2, i % 2 ? "#ffd86b" : "#ff9fc7")).join("")},
  schaukel:{vb:[100,110], z:d => L("M6,108 L22,4 M38,108 L22,4 M62,108 L78,4 M94,108 L78,4", "#ffa577", 5) + R(16, 2, 68, 6, "#ff8f5a", 3)
      + `<g class="${d.schwingt ? "schwing" : ""}" style="transform-origin:50px 6px">${L("M38,8 L38,86 M62,8 L62,86", METALL_D, 1.6) + R(32, 84, 36, 6, "#ff8f8f", 3) + R(32, 84, 36, 2, "#ffb3b3", 1)}</g>`},
  rutsche:{vb:[130,110], z:() => L("M12,108 L12,30 M34,108 L34,30", "#7fbfe6", 4) + [44, 60, 76, 92].map(y => L(`M12,${y} L34,${y}`, "#7fbfe6", 3)).join("")
      + R(8, 26, 44, 7, "#7fbfe6", 3) + R(8, 26, 44, 3, "#a9d8f2", 2) + P("M44,28 Q64,30 82,64 Q98,100 128,100 L128,108 Q92,108 76,72 Q60,40 44,36Z", "#ffd86b") + L("M48,31 Q66,34 82,66 Q98,98 126,102", "#fff2b0", 2.5)},
  sandkasten:{vb:[120,40], z:() => R(0, 4, 120, 34, "#d9a774", 9) + R(6, 8, 108, 26, "#f6dc9e", 7) + P("M30,26 L36,14 L42,26Z", "#e8c77d") + R(33, 10, 6, 5, "#e8c77d", 1)
      + P("M70,24 L78,24 L76,15 L72,15Z", "#ff8f8f") + L("M88,26 L98,13", "#7fbfe6", 2.5) + E(56, 22, 6, 2, "#ecd08e")},
  bank:{vb:[100,54], z:d => { const c = d.farbe || "#7fbfe6"; return R(12, 0, 4, 24, "#6a6480", 1.5) + R(84, 0, 4, 24, "#6a6480", 1.5) + R(6, 0, 88, 7, c, 3) + R(6, 10, 88, 7, c, 3)
      + R(2, 22, 96, 12, hell(c, .25), 4) + R(2, 31, 96, 6, dunkel(c, .05), 3) + R(10, 36, 4, 17, "#6a6480", 1.5) + R(86, 36, 4, 17, "#6a6480", 1.5); }},
  blumenbeet:{vb:[110,36], z:d => R(0, 16, 110, 18, "#a87a55", 9) + R(4, 16, 102, 6, "#b98a62", 5) + (d.gegossen === heute()
      ? [10, 26, 42, 58, 74, 90].map((x, i) => L(`M${x + 4},20 L${x + 4},8`, "#5cb874", 2) + C(x + 4, 7, 5, ["#ff8f8f","#ffe27a","#ff9fc7","#c3a8ff","#ffb36b","#8fc8ff"][i]) + C(x + 4, 7, 1.8, "#fff8")).join("")
      : [14, 30, 46, 62, 78, 94].map(x => L(`M${x},20 L${x},14 M${x},16 Q${x - 4},12 ${x - 6},14 M${x},15 Q${x + 4},11 ${x + 6},13`, "#5cb874", 2)).join(""))},
  teich:{vb:[140,44], z:() => E(70, 24, 69, 19, "#b6e8f6") + E(70, 24, 60, 14, "#86d6ef") + E(52, 20, 18, 3, "#a9e3f5")
      + E(34, 26, 9, 3.5, "#6ccb84") + E(54, 32, 7, 3, "#5cbf78") + C(36, 25, 2, "#ff9fc7") + L("M128,22 L130,4 M132,24 L136,8", "#5cb874", 2)},
  adoption:{vb:[120,72], z:() => R(0, 28, 120, 10, "#ffd8b0", 4) + R(2, 34, 116, 36, "#ffbf86", 5) + R(16, 0, 88, 22, "#ffffff", 7)
      + `<text x="60" y="14.5" font-size="8" text-anchor="middle" font-weight="700" fill="#4a3b66">🐾 Tiere suchen ein Zuhause</text>` + emojiText(30, 58, "🐾", 12) + emojiText(90, 58, "🐾", 12) + emojiText(60, 60, "❤️", 12)},
  tafel:{vb:[180,90], z:d => R(0, 0, 180, 78, "#c99868", 5) + R(7, 7, 166, 64, "#3f6e5a", 3)
      + (d.bild ? `<image href="${d.bild}" x="7" y="7" width="166" height="64" preserveAspectRatio="none"/>` : `<text x="90" y="44" font-size="10" text-anchor="middle" fill="#fff" opacity=".75">Tipp mich an zum Malen ✏️</text>`)
      + R(18, 76, 144, 6, "#a8774f", 2) + R(40, 73, 10, 3, "#ffffff", 1) + R(60, 73, 8, 3, "#ffd84d", 1) + R(74, 73, 8, 3, "#ff9fc7", 1)},
  schulpult:{vb:[70,52], z:() => R(0, 0, 70, 18, "#f6d2a8", 4) + R(0, 14, 70, 5, "#e8b98c", 2) + R(5, 19, 60, 16, "#a9d8f2", 3) + R(8, 35, 4, 16, METALL_D, 1.5) + R(58, 35, 4, 16, METALL_D, 1.5)},
  basketballkorb:{vb:[50,140], z:d => R(21, 30, 7, 104, METALL_D, 2) + R(10, 132, 28, 7, "#6a6480", 3) + R(2, 2, 46, 30, "#ffffff", 4) + R(15, 11, 20, 15, "none", 1, 'stroke="#ff7f5a" stroke-width="2"')
      + L("M12,34 L16,50 L34,50 L38,34", "#e8e0d8", 1.4, 'stroke-dasharray="3 2"') + E(25, 34, 14, 3.5, "none", 'stroke="#ff8f4a" stroke-width="3"') + (d.treffer ? emojiText(25, 46, "🏀", 14) : "")},
  huepfekaestchen:{vb:[140,30], z:() => [[4,8],[24,8],[44,2],[44,15],[64,8],[84,2],[84,15],[104,8]].map(([x, y], i) => R(x, y, 19, [2, 3, 5, 6].includes(i) ? 12 : 16, "none", 1, 'stroke="#fff" stroke-width="2"')
      + `<text x="${x + 9.5}" y="${y + 10}" font-size="8" text-anchor="middle" fill="#fff">${i + 1}</text>`).join("") + `<text x="130" y="20" font-size="10" fill="#fff">☆</text>`},
  essensausgabe:{vb:[180,80], z:() => R(6, 2, 168, 22, "#d9f1fb", 3, 'opacity=".55"') + [20, 60, 100, 140].map(x => R(x, 2, 2, 24, METALL_D, 1)).join("")
      + R(0, 24, 180, 16, "#e9edf3", 4) + [[22,"#ffd27a","🍝"],[52,"#ff9f8f","🍕"],[82,"#a8e6a0","🥗"],[112,"#ffe2b0","🥪"],[142,"#ffb3b3","🍔"]].map(([x, c, e]) => R(x - 12, 26, 24, 9, c, 2) + emojiText(x, 34, e, 9)).join("")
      + R(0, 36, 180, 42, "#7fbfe6", 5) + R(0, 36, 180, 4, "#a9d8f2", 2) + [20, 36, 52].map(y => R(150, y + 10, 24, 4, "#5aa0d6", 1.5)).join("")
      + `<text x="70" y="62" font-size="11" text-anchor="middle" fill="#fff" font-weight="700">🍽️ Essen</text>`},
  kantinentisch:{vb:[140,54], z:() => R(10, 24, 5, 28, METALL_D, 2) + R(125, 24, 5, 28, METALL_D, 2) + R(68, 24, 4, 26, METALL_D, 2) + R(0, 0, 140, 22, "#f6dcc0", 8) + R(0, 18, 140, 6, "#e8c39c", 3)},
  kantinenbank:{vb:[130,30], z:() => R(0, 4, 130, 12, "#e8c39c", 4) + R(0, 4, 130, 4, "#f2d4b2", 3) + R(0, 13, 130, 5, "#d4a77a", 2) + [8, 63, 118].map(x => R(x, 18, 4, 11, METALL_D, 1.5)).join("")},
  muelltrennung:{vb:[70,56], z:() => R(2, 10, 32, 44, "#ffd86b", 5) + R(2, 6, 32, 8, "#ffe9a0", 4) + R(36, 10, 32, 44, "#7fd39a", 5) + R(36, 6, 32, 8, "#a8e6b8", 4)
      + `<text x="18" y="38" font-size="12" text-anchor="middle" fill="#fff">♻</text><text x="52" y="38" font-size="12" text-anchor="middle" fill="#fff">♻</text>`},
  getraenkeautomat:{vb:[50,110], z:d => R(2, 0, 46, 108, "#ff7f8f", 6) + R(2, 0, 46, 6, "#ffa3b0", 5) + R(7, 8, 26, 64, "#dff1fb", 3)
      + [16, 32, 48].map((y, j) => [11, 18, 25].map((x, i) => R(x, y, 5, 12, ["#ffd86b","#8fdc9a","#9fc8ff","#ff9fc7"][(i + j) % 4], 2)).join("")).join("") + [28, 44, 60].map(y => R(7, y, 26, 1.5, "#c6dbe6", 0)).join("")
      + R(7, 80, 26, 14, DUNKEL, 3) + (d.macht ? R(12, 84, 8, 8, "#ffd86b", 2) : "") + [16, 24, 32].map(y => C(41, y, 2.2, "#ffffff")).join("") + R(38, 44, 6, 10, "#d6dee8", 2)},
  theke:{vb:[160,72], z:() => R(0, 0, 160, 14, "#f8ecd8", 5) + R(0, 10, 160, 60, HOLZ, 5) + R(0, 10, 160, 2, dunkel(HOLZ, .08), 0) + [10, 60, 110].map(x => R(x, 18, 40, 44, HOLZ_H, 5)).join("")
      + `<text x="80" y="45" font-size="13" text-anchor="middle" fill="#c98a5a" font-weight="700">☕ Café</text>`},
  kaffeemaschine:{vb:[40,50], z:d => (d.macht ? L("M18,26 Q14,20 18,14 M24,24 Q20,18 24,12", "#dde5ee", 2, 'class="dampf"') : "") + R(4, 2, 32, 46, "#e9677a", 6) + R(4, 2, 32, 6, "#f28b9a", 5)
      + R(8, 22, 24, 20, DUNKEL, 3) + R(17, 22, 6, 5, METALL_D, 1) + C(12, 13, 2.5, "#ffffff") + C(20, 13, 2.5, "#ffd84d") + C(28, 13, 2.5, "#8fdc9a") + R(4, 44, 32, 4, METALL_D, 2)},
  cafetisch:{vb:[60,60], z:() => R(28, 12, 4, 42, "#6a6480", 1) + E(30, 56, 14, 3.5, "#6a6480") + E(30, 10, 29, 7, "#e6e0d6") + E(30, 8, 29, 7, "#ffffff")},
  vitrine:{vb:[80,90], z:() => R(0, 0, 80, 88, HOLZ, 5) + R(5, 5, 70, 58, "#eaf7ff", 3, 'opacity=".95"') + R(5, 31, 70, 2.5, "#ffffff", 1) + R(5, 60, 70, 2.5, "#ffffff", 1)
      + L("M12,10 L22,10", "#ffffff", 2.5) + R(8, 68, 64, 16, HOLZ_H, 3)},
  ofen:{vb:[64,80], z:d => ((d.zutaten || []).length ? emojiText(32, -2, d.zutaten.map(t => K[t].e).join(""), 9) : "") + R(2, 2, 60, 76, "#eceef3", 6) + R(2, 2, 60, 7, "#f8f9fb", 5)
      + [14, 25, 39, 50].map(x => C(x, 15, 2.6, "#c6cdd8")).join("") + R(8, 24, 48, 46, DUNKEL, 5)
      + R(14, 32, 36, 26, d.backt ? "#ffb36b" : "#7a7290", 3, d.backt ? 'class="glut"' : "") + R(16, 27, 32, 2.5, METALL, 1.2)},
  arbeitsplatte:{vb:[130,60], z:() => R(0, 2, 130, 12, "#efe7da", 4) + R(2, 10, 126, 48, WEISS, 4) + R(2, 10, 126, 2, "#e6ded2", 0) + [44, 86].map(x => R(x, 12, 1.2, 44, "#e6e0d6", 0)).join("")
      + [23, 65, 107].map(x => R(x - 6, 16, 12, 3, METALL_D, 1.5)).join("")},
  krankenbett:{vb:[150,82], z:() => R(2, 8, 12, 66, "#a9d8f2", 5) + R(136, 26, 12, 48, "#a9d8f2", 5) + R(10, 50, 132, 8, METALL, 3)
      + R(14, 26, 124, 20, "#ffffff", 8) + R(14, 42, 124, 10, "#eef2f6", 5) + E(62, 32, 16, 7, "#ffffff") + E(62, 35, 14, 3.5, "#eef2f6")
      + R(22, 58, 4, 14, METALL_D, 1) + R(124, 58, 4, 14, METALL_D, 1) + C(24, 75, 4, DUNKEL) + C(126, 75, 4, DUNKEL),
    vorne:() => R(84, 38, 56, 14, "#86c4e6", 6) + R(84, 24, 56, 26, "#9fd3f0", 8) + R(84, 24, 56, 6, "#c7e7f8", 6)},
  arztschrank:{vb:[62,110], z:d => R(0, 0, 62, 108, WEISS, 5) + R(0, 0, 62, 6, "#ffffff", 4) + (d.offen
    ? R(5, 7, 52, 96, "#eef8ff", 3) + R(5, 41, 52, 3, "#d6e8f2", 1) + R(5, 83, 52, 3, "#d6e8f2", 1)
    : R(30.4, 8, 1.2, 96, "#e6e0d6", 0) + R(24, 50, 3, 12, METALL_D, 1.5) + R(35, 50, 3, 12, METALL_D, 1.5)
      + R(9, 20, 14, 5, "#ff7f8f", 1) + R(13.5, 15.5, 5, 14, "#ff7f8f", 1) + R(39, 20, 14, 5, "#ff7f8f", 1) + R(43.5, 15.5, 5, 14, "#ff7f8f", 1))},
  rollstuhl:{vb:[60,66], z:() => R(16, 4, 7, 34, "#7fbfe6", 3) + L("M18,6 L12,4", METALL_D, 3) + R(16, 30, 36, 9, "#a9d8f2", 3) + R(16, 36, 36, 4, "#5aa0d6", 2)
      + C(26, 46, 18, "none", `stroke="${DUNKEL}" stroke-width="3"`) + C(26, 46, 14, "none", `stroke="${METALL_D}" stroke-width="1.5"`) + C(26, 46, 2.5, DUNKEL) + C(52, 60, 5, DUNKEL) + L("M52,40 L52,55", METALL_D, 2.5)},
  roentgen:{vb:[80,120], z:() => R(0, 0, 80, 14, "#d6dee8", 5) + R(2, 12, 6, 100, "#d6dee8", 2) + R(72, 12, 6, 100, "#d6dee8", 2) + R(0, 110, 80, 9, "#bcc6d4", 4) + C(66, 7, 3, "#5fd38a"),
    vorne:(d, k) => R(9, 16, 62, 92, "#1d2a44", 4, `opacity="${k && k.besetzt ? .92 : .55}"`) + (k && k.besetzt ? `<g stroke="#e8f6ff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".95">
        <circle cx="40" cy="32" r="10"/><circle cx="36" cy="30" r="2" fill="#e8f6ff"/><circle cx="44" cy="30" r="2" fill="#e8f6ff"/><path d="M36,37 L44,37"/><path d="M40,42 L40,78"/>
        ${[48, 54, 60, 66].map(y => `<path d="M40,${y} Q31,${y + 2} 29,${y + 6} M40,${y} Q49,${y + 2} 51,${y + 6}"/>`).join("")}<path d="M28,46 L22,72 M52,46 L58,72"/><path d="M34,80 L46,80 M36,80 L33,104 M44,80 L47,104"/></g>
        <text x="40" y="104" font-size="6" text-anchor="middle" fill="#9fffb0">alles gesund ✓</text>` : `<text x="40" y="64" font-size="7" text-anchor="middle" fill="#9fd3f0">Röntgen</text>`)},
  behandlungstisch:{vb:[100,56], z:() => R(0, 6, 100, 16, "#e9eff5", 5) + R(0, 18, 100, 5, "#cfd8e3", 2) + R(10, 23, 80, 24, "#ffffff", 4) + R(49.4, 23, 1.2, 24, "#e6e0d6", 0)
      + R(14, 47, 5, 8, METALL_D, 1) + R(81, 47, 5, 8, METALL_D, 1) + emojiText(30, 40, "🐾", 10) + emojiText(70, 40, "➕", 9)},
  becken:{vb:[200,60], z:() => R(0, 0, 200, 60, "#eef6f9", 10) + R(0, 0, 200, 6, "#ffffff", 8) + R(8, 6, 184, 46, "#7fd6ee", 7)
      + `<g class="wellen">${L("M20,16 Q30,12 40,16 T60,16 M90,22 Q100,18 110,22 T130,22 M140,12 Q150,8 160,12 T180,12", "#b8ecf8", 2)}</g>`
      + L("M178,4 L178,24 M188,4 L188,24 M178,10 L188,10 M178,17 L188,17", METALL_D, 2),
    vorne:() => R(8, 28, 184, 24, "rgba(110,205,235,.82)", 6) + L("M14,32 Q24,29 34,32 T54,32 T74,32 T94,32 T114,32 T134,32 T154,32 T174,32 T188,32", "#c8f2fb", 1.6)
      + R(0, 50, 200, 10, "#e2eef3", 6) + R(0, 50, 200, 3, "#ffffff", 1.5)},
  sprungbrett:{vb:[70,50], z:() => R(0, 14, 22, 36, "#7fbfe6", 4) + R(0, 10, 22, 8, "#a9d8f2", 3) + R(14, 8, 56, 6, "#ffffff", 3) + R(14, 12, 56, 3, "#dfe5ec", 1) + R(4, 30, 14, 3, "#a9d8f2", 1)},
  liegestuhl:{vb:[90,44], z:d => { const c = d.farbe || "#ff8f8f"; return L("M10,10 L18,42 M30,32 L26,42 M84,32 L84,42", "#d7cbbb", 2.5)
      + P("M4,10 L26,6 L36,30 L14,34Z", c) + P("M10,9 L18,8 L28,32 L20,33Z", "#ffffff", 'opacity=".6"') + R(30, 24, 58, 10, c, 4) + [44, 60, 76].map(x => R(x, 24, 7, 10, "#ffffff", 0, 'opacity=".6"')).join(""); }},
  sonnenschirm:{vb:[80,110], z:d => { const c = d.farbe || "#ff8f8f"; return R(39, 30, 3, 78, "#d7cbbb", 1) + E(40.5, 107, 10, 2.5, "#bba890")
      + P("M2,34 Q40,-6 78,34Z", c) + P("M22,30 Q30,4 40,3 Q34,10 34,32Z", "#ffffff", 'opacity=".7"') + P("M46,32 Q46,10 40,3 Q54,6 60,30Z", "#ffffff", 'opacity=".7"') + C(40.5, 3, 3, hell(c, .2)); }},
  sandburg:{vb:[60,44], z:() => R(4, 22, 52, 20, "#f2d08a", 3) + R(8, 10, 14, 14, "#f2d08a", 2) + R(38, 10, 14, 14, "#f2d08a", 2) + R(22, 4, 16, 20, "#f6dca0", 2)
      + [8, 13, 18, 38, 43, 48].map(x => R(x, 7, 3, 4, "#f2d08a", 0)).join("") + R(27, 30, 6, 12, "#d9b066", 3) + L("M30,4 L30,-8", "#9a8a7a", 1.2) + P("M30,-8 L38,-5 L30,-2Z", "#ff7f8f")},
  traktor:{vb:[120,90], z:() => R(30, 30, 70, 34, "#ff6b6b", 8) + R(70, 36, 46, 26, "#ff7f7f", 8) + R(108, 42, 8, 16, "#ffb3b3", 3) + R(92, 14, 5, 24, "#6a6480", 2)
      + R(28, 0, 40, 40, "#ff8f8f", 6) + R(34, 6, 28, 22, "#dff1fb", 4) + C(42, 66, 22, "#4a4458") + C(42, 66, 11, "#ffd86b") + C(98, 74, 14, "#4a4458") + C(98, 74, 6, "#ffd86b")},
  heuballen:{vb:[60,40], z:() => R(2, 8, 56, 30, "#e2ac4c", 10) + R(2, 6, 56, 10, "#f0c86c", 8) + L("M8,20 L20,18 M26,28 L40,25 M44,18 L54,16 M10,32 L22,30", "#d9ae4a", 1.4) + R(14, 6, 3, 32, "#d9ae4a", 1) + R(43, 6, 3, 32, "#d9ae4a", 1)},
  zaun:{vb:[140,40], z:() => R(0, 12, 140, 5, "#efe7da", 2) + R(0, 26, 140, 5, "#efe7da", 2) + [2, 22, 42, 62, 82, 102, 122].map(x => P(`M${x},38 L${x},8 L${x + 3.5},4 L${x + 7},8 L${x + 7},38Z`, "#fbf6ee")).join("")},
  futtertrog:{vb:[80,34], z:() => R(6, 26, 4, 8, "#a8774f", 1) + R(70, 26, 4, 8, "#a8774f", 1) + P("M2,8 L78,8 L72,28 L8,28Z", "#c99868") + E(40, 9, 37, 4, "#a8774f") + E(40, 8, 33, 3, "#f2d07e")
      + L("M14,7 L22,5 M30,8 L42,6 M50,7 L60,5", "#d9ae4a", 1.2)},
  huehnerstall:{vb:[64,64], z:d => { const rest = 3 - (d.eierTag === heute() ? (d.eier || 0) : 0);
    return R(4, 20, 56, 42, "#e7a07f", 4) + P("M0,24 L32,0 L64,24Z", "#c96f52") + C(32, 40, 9, "#6a4a3a") + E(32, 60, 18, 4, "#f2d07e")
      + Array.from({length:rest}, (_, i) => E(22 + i * 10, 57, 3.4, 4.2, "#fffaf0")).join(""); }},
  eistheke:{vb:[150,74], z:() => R(4, 0, 142, 14, "#d9f1fb", 4, 'opacity=".6"') + R(0, 12, 150, 18, "#eef8fb", 4)
      + [["#ff9fc7",18],["#a8e6c4",40],["#fff1b0",62],["#c98a5a",84],["#c3a8ff",106],["#ffffff",128]].map(([c, x]) => E(x, 20, 9, 4.5, c) + E(x - 2, 18.5, 4, 1.5, "#ffffff", 'opacity=".6"')).join("")
      + R(0, 28, 150, 44, "#ff9fc4", 6) + Array.from({length:10}, (_, i) => C(8 + i * 15, 29, 7.5, "#ffc4dc")).join("") + R(0, 28, 150, 3, "#ffc4dc", 0)
      + `<text x="75" y="58" font-size="13" text-anchor="middle" fill="#fff" font-weight="700">🍦 Eis</text>`},
  leinwand:{vb:[200,90], z:d => R(24, 4, 152, 74, "#f7f3ec", 3) + (d.film
      ? `<g class="film">${R(26, 6, 148, 70, "#8fd8ff", 2) + C(60, 30, 12, "#ffe27a") + P("M26,76 L80,40 L120,76Z", "#79c98a") + P("M100,76 L150,34 L174,76Z", "#5ab87a")}<g class="flieger">${emojiText(120, 30, "🚀", 18)}</g></g>`
      : `<text x="100" y="44" font-size="10" text-anchor="middle" fill="#9a8a9a">🎬 Antippen für den Film</text>`)
      + R(0, 0, 26, 90, "#b0304f", 4) + R(174, 0, 26, 90, "#b0304f", 4) + [6, 13, 20, 180, 187, 194].map(x => R(x, 0, 2, 90, "#8e2340", 1)).join("") + R(0, 0, 200, 6, "#8e2340", 2)},
  kinositz:{vb:[60,56], z:d => { const c = d.farbe || "#e5566a"; return [2, 32].map(x => R(x + 1, 0, 26, 30, c, 8) + R(x + 4, 3, 20, 8, hell(c, .2), 4) + R(x, 24, 28, 12, hell(c, .25), 5) + R(x, 32, 28, 10, dunkel(c, .1), 4)).join("")
      + R(0, 44, 60, 10, "#4a3a4a", 3) + R(28, 20, 4, 18, dunkel(c, .25), 2); }},
  popcornstand:{vb:[70,90], z:() => R(4, 40, 62, 44, "#ff6b6b", 6) + [12, 26, 40, 54].map(x => R(x, 40, 6, 44, "#ffffff", 0, 'opacity=".75"')).join("") + R(10, 6, 50, 36, "#fff5d6", 4)
      + Array.from({length:22}, (_, i) => C(14 + (i * 7) % 44, 20 + Math.floor(i / 6) * 5 + (i % 2) * 2, 3, i % 3 ? "#ffffff" : "#ffe08a")).join("") + R(2, 0, 66, 8, "#ff6b6b", 3)
      + R(14, 62, 42, 12, "#ffffff", 4) + `<text x="35" y="71" font-size="8" text-anchor="middle" fill="#ff6b6b" font-weight="700">Popcorn</text>` + C(14, 86, 4, DUNKEL) + C(56, 86, 4, DUNKEL)}
};
GRAFIK.lehrerpult = GRAFIK.schreibtisch;
