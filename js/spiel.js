// SoCla – Spiellogik: Spielstand, Zeichnen der Orte, Ziehen und Ablegen, Geräte, Läden, Baukasten, Aufgaben.
"use strict";
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = l => l[Math.floor(Math.random() * l.length)];
const mische = l => { l = l.slice(); for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; } return l; };
const esc = t => String(t).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const klemme = (v, a, b) => Math.max(a, Math.min(b, v));
const heute = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const ORT = id => ORTE.find(o => o.id === id);
const KLEINGERAETE = ["toaster", "kaffeemaschine", "radio", "tischlampe"];
const TABLET = window.SOCLA_MODUS === "tablet";   // Tablet-Fassung: speichert nur im Browser, ohne PC-Server

let S = null;   // Spielstand
const anim = {}; // kurze Bewegungen: uid -> {klasse, bis}

// ---------------------------------------------------------------- Dinge
const istFigur = d => d.typ === "figur";
const artVon = d => istFigur(d) ? "figur" : (K[d.typ] || {}).art;
const istKlein = d => !istFigur(d) && (!!(K[d.typ] || {}).e || KLEINGERAETE.includes(d.typ));
const emojiVon = d => (K[d.typ] || {}).e || "📦";
function breite(d) {
  if (istFigur(d)) return BREITE_FIGUR[d.f.groesse] || 10.5;
  const k = K[d.typ] || {};
  return k.b || 4.2;
}
function hoehe(d) {   // in cqw
  if (istFigur(d)) return breite(d) * 1.74;
  const g = GRAFIK[d.typ];
  return g ? breite(d) * g.vb[1] / g.vb[0] : breite(d);
}
const hoeheP = d => hoehe(d) / HOEHE * 100;
function bodenY(ortId, x) { const r = ORT(ortId).raeume[klemme(Math.floor(x / 100), 0, ORT(ortId).raeume.length - 1)]; return r.strand ? 47 : r.draussen ? DRAUSSEN_BODEN : BODEN; }
function neu(typ, x, y, props) { return Object.assign({uid:S.naechsteId++, typ, x, y}, props || {}); }

function finde(uid) {
  const such = (liste, ort, besitzer) => {
    for (let i = 0; i < liste.length; i++) {
      const d = liste[i];
      if (d.uid === uid) return {liste, i, d, ort, besitzer};
      if (d.hand) { if (d.hand.uid === uid) return {liste:null, i:-1, d:d.hand, ort, besitzer:d, inHand:true}; }
      if (d.inhalt) { const r = such(d.inhalt, ort, d); if (r) return r; }
    }
    return null;
  };
  for (const o of ORTE) { const r = such(S.orte[o.id], o.id, null); if (r) return r; }
  return such(S.tasche, "tasche", null);
}
function nimmRaus(d) {
  const f = finde(d.uid); if (!f) return;
  if (f.inHand) f.besitzer.hand = null; else f.liste.splice(f.i, 1);
  d.sitz = null; d.auf = null; d.schlaeft = false;
}
function angehaengt(d, liste) { return liste.filter(x => (x.sitz && x.sitz.uid === d.uid) || (x.auf && x.auf.uid === d.uid)); }
function zVon(d) { const k = K[d.typ] || {}; if (k.boden) return 2; if (k.wand) return 10 + Math.round(d.y); return 100 + Math.round(d.y * 10); }
function lage(d, liste) {
  liste = liste || S.orte[S.ort];
  if (d.sitz) {
    const m = liste.find(x => x.uid === d.sitz.uid), p = m && (K[m.typ].sitz || [])[d.sitz.i];
    if (p) { const sy = m.y - (1 - p[1]) * hoeheP(m);
      return {x:m.x + (p[0] - .5) * breite(m), y:p[2] === "sitzt" && istFigur(d) ? sy + SCHOSS * hoeheP(d) : sy, z:zVon(m) + 5 + d.sitz.i, pose:p[2], m}; }
    d.sitz = null;
  }
  if (d.auf) {
    const m = liste.find(x => x.uid === d.auf.uid), fl = m && K[m.typ].flaeche;
    if (fl) return {x:m.x + d.auf.dx, y:m.y - (1 - fl[2]) * hoeheP(m), z:zVon(m) + 3, m};
    d.auf = null;
  }
  return {x:d.x, y:d.y, z:zVon(d)};
}
function festhalten(d) { const L = lage(d); d.x = +L.x.toFixed(1); d.y = +L.y.toFixed(1); }

// ---------------------------------------------------------------- Spielstand
function neuerStand() {
  S = {version:3, sterne:START_STERNE, naechsteId:1, tag:heute(), besitz:[], aufgaben:[], erledigt:0, ton:true, ort:"haus",
       blick:{}, orte:{}, raeume:{}, tasche:[]};
  for (const o of ORTE) {
    S.orte[o.id] = []; S.blick[o.id] = 0;
    S.raeume[o.id] = o.raeume.map(r => ({wand:r.wand || "weiss", boden:r.boden || (r.draussen ? "gras" : "holz")}));
    o.raeume.forEach((r, ri) => r.dinge.forEach(([typ, x, y, props]) => {
      const p = Object.assign({}, props); const inhalt = p.inhalt, auf = p.auf; delete p.inhalt; delete p.auf;
      const d = neu(typ, ri * 100 + x, y, p);
      if (inhalt) d.inhalt = inhalt.map(t => neu(t, 0, 0));
      S.orte[o.id].push(d);
      if (auf) { const fl = K[typ].flaeche, b = breite(d);
        auf.forEach((t, j) => S.orte[o.id].push(neu(t, d.x, d.y, {auf:{uid:d.uid, dx:+(((fl[0] + (j + 1) / (auf.length + 1) * (fl[1] - fl[0])) - .5) * b).toFixed(1)}}))); }
    }));
  }
  for (const [ort, raum, x, y, f] of START_FIGUREN) S.orte[ort].push(neu("figur", raum * 100 + x, y, {f:Object.assign({}, FIGUR_STANDARD, f)}));
  S.aufgaben = START_AUFGABEN.map(id => ({id, n:0, fertig:false}));
}
function ergaenze() {
  const leer = {besitz:[], aufgaben:[], erledigt:0, ton:true, ort:"haus", blick:{}, orte:{}, raeume:{}, tasche:[]};
  for (const k in leer) if (S[k] === undefined) S[k] = leer[k];
  for (const o of ORTE) {
    S.orte[o.id] = S.orte[o.id] || []; S.blick[o.id] = S.blick[o.id] || 0;
    S.raeume[o.id] = o.raeume.map((r, i) => {
      const st = (S.raeume[o.id] || [])[i] || {};
      return {wand:TAPETEN[st.wand] ? st.wand : (r.wand || "weiss"), boden:BOEDEN[st.boden] ? st.boden : (r.boden || (r.draussen ? "gras" : "holz"))};
    });
  }
  const putzen = d => { delete d.waescht; delete d.macht; delete d.backt; delete d.toast; delete d.treffer; delete d.schwingt; delete d.kocht; delete d.film; if (d.inhalt) d.inhalt.forEach(putzen); };
  for (const o of ORTE) S.orte[o.id].forEach(putzen);
  S.aufgaben = S.aufgaben.filter(a => AUFGABEN[a.id]);
  while (S.aufgaben.length < 4) S.aufgaben.push(neueAufgabe());
}
async function laden() {
  let datei = null, lokal = null;
  if (!TABLET && location.protocol !== "file:") {
    try { const r = await fetch("daten/spielstand.json?t=" + Date.now(), {cache:"no-store"}); if (r.ok) datei = await r.json(); } catch (e) {}
  }
  try { lokal = JSON.parse(localStorage.getItem("socla3") || "null"); } catch (e) {}
  if (datei && datei.version !== 3) datei = null;   // Spielstände älterer Fassungen werden nicht übernommen
  let s = datei;
  if (lokal && lokal.version === 3 && (!s || (lokal.gespeichert || "") > (s.gespeichert || ""))) s = lokal;
  if (s) { S = s; ergaenze(); return false; }
  neuerStand(); return true;
}
let speicherTimer = null, warnTimer = null;
const alsText = () => JSON.stringify(S, (k, v) => k.startsWith("_") ? undefined : v);
function speichern() {
  S.gespeichert = new Date().toISOString();
  try { localStorage.setItem("socla3", alsText()); } catch (e) {}
  clearTimeout(speicherTimer); speicherTimer = setTimeout(sendeStand, 500);
}
async function sendeStand() {
  if (TABLET || location.protocol === "file:") return;
  try {
    const r = await fetch("spielstand", {method:"POST", headers:{"Content-Type":"application/json"}, body:alsText()});
    if (r.status === 409) return warne("In einem anderen Fenster gibt es einen neueren Spielstand. Bitte dieses Fenster schließen oder die Seite neu laden (F5).");
    if (!r.ok) throw new Error(r.status);
    clearTimeout(warnTimer); warnTimer = null; warne("");
  } catch (e) {
    if (!warnTimer) warnTimer = setTimeout(() => warne("⚠️ Speichern klappt gerade nicht. Ist das schwarze SoCla-Fenster noch offen? Sonst bitte „SoCla starten“ doppelklicken."), 8000);
    clearTimeout(speicherTimer); speicherTimer = setTimeout(sendeStand, 4000);
  }
}
function warne(t) { const w = $("#warnung"); w.textContent = t; w.style.display = t ? "block" : "none"; }

// ---------------------------------------------------------------- Ton
let ac = null;
function ton(art) {
  if (!S || !S.ton) return;
  try {
    ac = ac || new AudioContext();
    const noten = {pop:[[520,.06]], stern:[[880,.08],[1320,.14]], tada:[[523,.1],[659,.1],[784,.2]], lecker:[[392,.08],[523,.12]], fehler:[[330,.12],[262,.18]],
      herz:[[660,.08],[880,.1]], klick:[[700,.03]], klingel:[[1568,.12],[1568,.12],[1568,.2]], brumm:[[110,.15],[98,.15],[110,.2]], platsch:[[300,.06],[200,.12]], spuelen:[[600,.08],[450,.08],[300,.1],[200,.2]],
      lied:[[523,.18],[587,.18],[659,.18],[523,.18],[659,.18],[784,.3],[698,.18],[659,.36]]}[art] || [];
    let t = ac.currentTime;
    for (const [fr, d] of noten) {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "triangle"; o.frequency.value = fr;
      g.gain.setValueAtTime(.13, t); g.gain.exponentialRampToValueAtTime(.001, t + d);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + d + .02); t += d * .92;
    }
  } catch (e) {}
}
function tonUmschalten() { S.ton = !S.ton; speichern(); zeichneKopf(); }

// ---------------------------------------------------------------- Anzeige
let toastTimer = null;
function sag(t, dauer) {
  const el = $("#toast"); el.textContent = t; el.style.display = "block";
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.style.display = "none", dauer || 3200);
}
function sterneAnzeigen(n) {
  const r = $(".sterne").getBoundingClientRect(), el = document.createElement("div");
  el.className = "plus"; el.textContent = (n > 0 ? "+" : "") + n + " ⭐";
  el.style.left = (r.left + 10) + "px"; el.style.top = (r.bottom + 4) + "px";
  document.body.appendChild(el); setTimeout(() => el.remove(), 1400);
}
function sterne(n) { S.sterne += n; sterneAnzeigen(n); ton("stern"); zeichneKopf(); }
function ueberDing(uid) {   // Position über einem Ding, in px innerhalb der Bahn
  const el = document.querySelector(`#bahn [data-uid="${uid}"]`), b = $("#bahn");
  if (!el) return null;
  const r = el.getBoundingClientRect(), br = b.getBoundingClientRect();
  return {x:r.left - br.left + r.width / 2, y:r.top - br.top};
}
function herzen(uid, zeichen) {
  const p = ueberDing(uid); if (!p) return;
  for (let i = 0; i < 3; i++) {
    const h = document.createElement("div"); h.className = "herz"; h.textContent = zeichen;
    h.style.left = (p.x - 14 + (i - 1) * 22) + "px"; h.style.top = (p.y - 6 - i * 8) + "px"; h.style.animationDelay = (i * .15) + "s";
    $("#effekte").appendChild(h); setTimeout(() => h.remove(), 1700);
  }
}
function sprechblase(uid, text, knopf) {
  document.querySelectorAll(".blase").forEach(b => b.remove());
  const p = ueberDing(uid); if (!p) return;
  const b = document.createElement("div"); b.className = "blase";
  b.innerHTML = esc(text) + (knopf ? `<br><button onclick="oeffneBaukasten(${uid})">✨ Anpassen</button>` : "");
  b.style.left = p.x + "px"; b.style.top = p.y + "px";
  $("#effekte").appendChild(b); setTimeout(() => b.remove(), knopf ? 4500 : 2600);
}
function animiere(uid, klasse, ms) {
  anim[uid] = {klasse, bis:Date.now() + ms};
  const el = document.querySelector(`#bahn [data-uid="${uid}"]`); if (el) el.classList.add(klasse);
  setTimeout(() => {
    if (!anim[uid] || anim[uid].bis > Date.now() + 30) return;
    delete anim[uid]; const e2 = document.querySelector(`#bahn [data-uid="${uid}"]`); if (e2) e2.classList.remove(klasse);
  }, ms + 40);
}
function passeAn() {
  const b = $(".buehne").getBoundingClientRect(), sz = $("#szene");
  let w = b.width, h = w * 9 / 16;
  if (h > b.height) { h = b.height; w = h * 16 / 9; }
  sz.style.width = w + "px"; sz.style.height = h + "px";
}

// ---------------------------------------------------------------- Zeichnen
function fensterHTML(x) {
  return `<div class="fenster" style="left:${x}cqw"><svg viewBox="0 0 100 92"><rect x="4" y="2" width="92" height="80" rx="8" fill="#ffffff"/>
    <rect x="11" y="9" width="78" height="66" rx="4" fill="#bfe9ff"/><circle cx="68" cy="26" r="9" fill="#fff6c4"/><ellipse cx="32" cy="24" rx="12" ry="5" fill="#ffffff" opacity=".9"/>
    <path d="M11,60 Q30,46 50,58 T89,52 L89,75 L11,75Z" fill="#a8e6a0"/><rect x="48" y="9" width="4" height="66" fill="#ffffff"/><rect x="11" y="40" width="78" height="4" fill="#ffffff"/>
    <rect x="0" y="80" width="100" height="8" rx="3" fill="#f3ece2"/><path d="M0,0 Q18,44 6,86 L0,86Z M100,0 Q82,44 94,86 L100,86Z" fill="#ffc4dc"/>
    <rect x="0" y="0" width="100" height="5" rx="2.5" fill="#d9c6b0"/></svg></div>`;
}
const DECKENLAMPE = `<div class="deckenlampe"><svg viewBox="0 0 40 40"><path d="M20,0 L20,18" stroke="#b8a898" stroke-width="1.2"/><path d="M8,30 Q8,16 20,16 Q32,16 32,30Z" fill="#ffd2a1"/><ellipse cx="20" cy="30" rx="12" ry="2.5" fill="#f3b980"/><circle cx="20" cy="32" r="3" fill="#fff6c4"/></svg></div>`;
function raeumeHTML(ort) {
  return ort.raeume.map((r, i) => {
    const st = S.raeume[ort.id][i], boden = esc((BOEDEN[st.boden] || BOEDEN.gras)[1]);
    if (r.strand) return `<div class="raum draussen" style="left:${i * 100}cqw"><div class="himmel"></div><div class="sonne">🌞</div>
      <div class="wolke" style="left:${24 + i * 7}cqw;top:5cqh">☁️</div><div class="wolke" style="left:${66 - i * 5}cqw;top:11cqh">☁️</div>
      <div class="meer"><div class="welle"></div></div><div class="gras sand"><div class="bodenmuster" style="background:${boden}"></div></div><div class="gischt"></div></div>`;
    if (r.draussen) return `<div class="raum draussen" style="left:${i * 100}cqw"><div class="himmel"></div>${i % 2 === 0 ? `<div class="sonne">🌞</div>` : ""}
      <div class="wolke" style="left:${20 + i * 7}cqw;top:4cqh">☁️</div><div class="wolke" style="left:${62 - i * 5}cqw;top:10cqh">☁️</div>
      <div class="huegel"></div><div class="huegel h2"></div><div class="hecke"></div><div class="gras"><div class="bodenmuster" style="background:${boden}"></div></div></div>`;
    return `<div class="raum" style="left:${i * 100}cqw"><div class="wand" style="background:${esc(TAPETEN[st.wand][1])}"></div><div class="wandlicht"></div>
      <div class="fussboden"><div class="bodenmuster" style="background:${boden}"></div><div class="bodenlicht"></div></div><div class="leiste"></div>
      ${(r.fenster || []).map(fensterHTML).join("")}${DECKENLAMPE}${i > 0 ? `<div class="pfeiler"></div>` : ""}</div>`;
  }).join("");
}
function kleinHTML(d, stil, klasse) {
  const k = K[d.typ] || {};
  if (!k.e) { const g = GRAFIK[d.typ]; return `<div class="${klasse}" data-uid="${d.uid}" style="${stil};width:${breite(d) * .6}cqw">${svgVon(g.vb, g.z(d, {}))}</div>`; }
  const biss = d.bissen ? `;opacity:${1 - d.bissen * .2};transform:translate(-50%,-50%) scale(${1 - d.bissen * .18})` : "";
  return `<div class="${klasse}" data-uid="${d.uid}" style="${stil}${k.filter ? ";filter:" + k.filter : ""}${biss}">${k.e}${d.pflaster === heute() ? `<span class="pfl">🩹</span>` : ""}</div>`;
}
function dingHTML(d, liste) {
  const L = lage(d, liste), k = K[d.typ] || {}, b = breite(d), a = anim[d.uid] && anim[d.uid].bis > Date.now() ? anim[d.uid].klasse : "";
  const von = d._von; delete d._von;
  const pos = von ? `left:${von.x}cqw;top:${von.y}cqh` : `left:${L.x}cqw;top:${L.y}cqh`;
  const ziel = von ? ` data-zx="${L.x}" data-zy="${L.y}"` : "";
  if (istFigur(d)) {
    const pose = d.schlaeft || L.pose === "liegt" ? "liegt" : L.pose === "sitzt" ? "sitzt" : "steht";
    const svg = figurSVG(d.f, {pose:pose === "sitzt" ? "sitzt" : "steht", zu:pose === "liegt" && d.schlaeft, lacht:(d._lacht || 0) > Date.now(), pflaster:d.pflaster === heute() ? "gesicht" : ""});
    const hand = d.hand ? kleinHTML(d.hand, `font-size:${b * .3}cqw`, "hand") : "";
    return `<div class="ding figur ${pose === "liegt" ? "liegt" : ""} ${a}"${ziel} data-uid="${d.uid}" style="${pos};z-index:${L.z};width:${b}cqw">${svg}${hand}
      <div class="name">${esc(d.f.name)}</div>${d.schlaeft ? `<div class="zzz">💤</div>` : ""}</div>`;
  }
  if (k.e) return kleinHTML(d, `${pos};z-index:${L.z};font-size:${b}cqw`, `ding klein ${a}`).replace('class="', `${ziel} class="`);
  const g = GRAFIK[d.typ]; if (!g) return "";
  const besetzt = liste.some(x => x.sitz && x.sitz.uid === d.uid);
  let innen = svgVon(g.vb, (k.wand || k.boden ? "" : schattenSVG(g.vb)) + g.z(d, {besetzt}));
  if (k.fach && (d.offen || !k.fach.tuer))
    innen += (d.inhalt || []).map((x, i) => { const p = k.fach.plaetze[i]; return p ? kleinHTML(x, `left:${p[0] * 100}%;top:${p[1] * 100}%;font-size:${Math.min(3.4, b * .26)}cqw`, "imfach") : ""; }).join("");
  let html = `<div class="ding moebel ${k.fest ? "fest" : ""} ${a}"${ziel} data-uid="${d.uid}" style="${pos};z-index:${L.z};width:${b}cqw">${innen}</div>`;
  if (g.vorne) html += `<div class="vorne" style="left:${L.x}cqw;top:${L.y}cqh;z-index:${L.z + 20};width:${b}cqw">${svgVon(g.vb, g.vorne(d, {besetzt}))}</div>`;
  return html;
}
function zeichneKopf() {
  $("#sternZahl").textContent = S.sterne;
  $("#knopfTon").textContent = S.ton ? "🔊" : "🔇";
  const fertig = S.aufgaben.filter(a => a.fertig).length;
  $("#knopfAufgaben").innerHTML = "📋 Aufgaben" + (fertig ? `<span class="abzeichen">${fertig}</span>` : "");
  $("#knopfEinrichten").style.display = ORT(S.ort).einrichten ? "" : "none";
}
function aktiverRaum() { return klemme(Math.round(S.blick[S.ort] / 100), 0, ORT(S.ort).raeume.length - 1); }
function zeichne() {
  const ort = ORT(S.ort), liste = S.orte[S.ort];
  zeichneKopf();
  $("#orte").innerHTML = ORTE.map(o => `<button data-ort-tab="${o.id}" title="${esc(o.n)}" class="${o.id === S.ort ? "aktiv" : ""}" onclick="geheZu('${o.id}')"><span class="ico">${o.e}</span>${o.k}</button>`).join("");
  const ar = aktiverRaum();
  $("#raeume").innerHTML = ort.raeume.length > 1 ? ort.raeume.map((r, i) => `<button data-raum-tab="${i}" class="${i === ar ? "aktiv" : ""}" onclick="geheZuRaum(${i})">${esc(r.n)}</button>`).join("") : `<span class="raumname">${esc(ort.raeume[0].n)}</span>`;
  const bahn = $("#bahn");
  bahn.style.width = ort.raeume.length * 100 + "cqw";
  if (bahn.dataset.ort !== S.ort) { $("#effekte").innerHTML = ""; bahn.dataset.ort = S.ort; }
  $("#bahnInhalt").innerHTML = raeumeHTML(ort) + liste.map(d => dingHTML(d, liste)).join("");
  setzeBlick(S.blick[S.ort]);
  // Bewegungen (Fallen, Rutschen) nach dem Zeichnen starten
  const beweg = bahn.querySelectorAll("[data-zx]");
  if (beweg.length) requestAnimationFrame(() => requestAnimationFrame(() => beweg.forEach(el => { el.classList.add("gleitet"); el.style.left = el.dataset.zx + "cqw"; el.style.top = el.dataset.zy + "cqh"; })));
  zeichneTasche();
}
function zeichneTasche() {
  $("#taschenInhalt").innerHTML = S.tasche.length ? S.tasche.map(d => {
    const k = K[d.typ] || {};
    if (k.e) return `<div class="tding" data-uid="${d.uid}" title="${esc(k.n)}">${k.e}</div>`;
    const g = GRAFIK[d.typ]; return `<div class="tding" data-uid="${d.uid}" title="${esc(k.n)}">${svgVon(g.vb, g.z(d, {}))}</div>`;
  }).join("") : `<span class="leer">Zieh Sachen hier hinein, um sie mitzunehmen.</span>`;
}
function setzeBlick(v, sanft) {
  const max = (ORT(S.ort).raeume.length - 1) * 100;
  S.blick[S.ort] = klemme(v, 0, max);
  const bahn = $("#bahn");
  if (sanft !== undefined) bahn.classList.toggle("sanft", !!sanft);
  bahn.style.transform = `translateX(${-S.blick[S.ort]}cqw)`;
  $("#links").style.visibility = S.blick[S.ort] > 1 ? "visible" : "hidden";
  $("#rechts").style.visibility = S.blick[S.ort] < max - 1 ? "visible" : "hidden";
  const ar = aktiverRaum();
  document.querySelectorAll("#raeume button").forEach((b, i) => b.classList.toggle("aktiv", i === ar));
}
function geheZu(ort) { if (zug && zug.bewegt) return; S.ort = ort; speichern(); zeichne(); ton("klick"); }
function geheZuRaum(i) { if (zug && zug.bewegt) return; setzeBlick(i * 100, true); speichern(); }
function blaettern(r) { setzeBlick(Math.round(S.blick[S.ort] / 100) * 100 + r * 100, true); speichern(); }

// ---------------------------------------------------------------- Ziehen mit der Maus
let zug = null, hoverEl = null, randLauf = null;
const dialogOffen = () => $("#schleier").style.display === "flex";
document.addEventListener("pointerdown", e => {
  if (e.button !== 0 || dialogOffen() || e.target.closest("button")) return;
  const el = e.target.closest("[data-uid]");
  const inSzene = e.target.closest("#szene");
  if (el) {
    const f = finde(+el.dataset.uid); if (!f) return;
    e.preventDefault();
    const fest = !!(K[f.d.typ] || {}).fest;
    const r = el.getBoundingClientRect();
    zug = {art:fest ? "fest" : "ding", uid:f.d.uid, el, sx:e.clientX, sy:e.clientY, rx:(e.clientX - r.left) / r.width, ry:(e.clientY - r.top) / r.height, bewegt:false, blick:S.blick[S.ort]};
    if (el.closest(".liegt") || el.classList.contains("tding")) { zug.rx = .5; zug.ry = .5; }
  } else if (inSzene) { e.preventDefault(); zug = {art:"pan", sx:e.clientX, sy:e.clientY, bewegt:false, blick:S.blick[S.ort]}; }
});
document.addEventListener("pointermove", e => {
  if (!zug) return;
  zug.px = e.clientX; zug.py = e.clientY;
  if (!zug.bewegt) {
    if (Math.hypot(e.clientX - zug.sx, e.clientY - zug.sy) < 7) return;
    zug.bewegt = true;
    if (zug.art === "ding") starteGeist(e);
  }
  if (zug.art === "pan" || zug.art === "fest") {
    const sw = $("#szene").getBoundingClientRect().width;
    setzeBlick(zug.blick - (e.clientX - zug.sx) / sw * 100, false); return;
  }
  bewegeGeist(e);
});
document.addEventListener("pointerup", e => {
  if (!zug) return;
  const z = zug; zug = null; cancelAnimationFrame(randLauf);
  if (hoverEl) { hoverEl.classList.remove("ziel-hover"); hoverEl = null; }
  if (z.art === "pan") { if (z.bewegt) speichern(); return; }
  if (z.art === "fest") { if (!z.bewegt) tippen(z.uid); else speichern(); return; }
  if (!z.bewegt) { tippen(z.uid); return; }
  const g = z.geist, gr = g.getBoundingClientRect(); g.remove();
  const s = $("#szene").getBoundingClientRect();
  const ziel = zielUnter(e.clientX, e.clientY, z);
  const anker = {x:S.blick[S.ort] + (gr.left + gr.width / 2 - s.left) / s.width * 100, y:(gr.bottom - s.top) / s.height * 100, zeigerX:S.blick[S.ort] + (e.clientX - s.left) / s.width * 100};
  const drinnen = e.clientX >= s.left && e.clientX <= s.right && e.clientY >= s.top && e.clientY <= s.bottom;
  ablegen(z.uid, ziel, anker, drinnen);
});
function starteGeist(e) {
  const f = finde(zug.uid); if (!f) { zug = null; return; }
  const d = f.d, sw = $("#szene").getBoundingClientRect().width, b = breite(d) * sw / 100;
  const g = document.createElement("div"); g.className = "geist";
  const k = K[d.typ] || {};
  if (istFigur(d)) g.innerHTML = figurSVG(d.f) + (d.hand ? `<div class="hand" style="font-size:${b * .3}px">${emojiVon(d.hand)}</div>` : "");
  else if (k.e) { g.textContent = k.e; g.style.fontSize = b + "px"; g.style.lineHeight = "1"; if (k.filter) g.style.filter = k.filter; }
  else g.innerHTML = svgVon(GRAFIK[d.typ].vb, GRAFIK[d.typ].z(d, {}));
  if (!k.e) g.style.width = b + "px";
  document.body.appendChild(g); zug.geist = g;
  const gr = g.getBoundingClientRect(); zug.gw = gr.width; zug.gh = gr.height;
  zug.el.style.opacity = ".25";
  document.querySelectorAll(`#bahn [data-uid="${zug.uid}"]`).forEach(x => x.style.opacity = ".25");
  const rand = () => {
    if (!zug || !zug.bewegt) return;
    const s = $("#szene").getBoundingClientRect();
    if (zug.py > s.top && zug.py < s.bottom) {
      if (zug.px < s.left + 50 && zug.px > s.left - 30) setzeBlick(S.blick[S.ort] - 1.2, false);
      if (zug.px > s.right - 50 && zug.px < s.right + 30) setzeBlick(S.blick[S.ort] + 1.2, false);
    }
    randLauf = requestAnimationFrame(rand);
  };
  randLauf = requestAnimationFrame(rand);
}
function bewegeGeist(e) {
  if (!zug.geist) return;
  zug.geist.style.left = (e.clientX - zug.rx * zug.gw) + "px"; zug.geist.style.top = (e.clientY - zug.ry * zug.gh) + "px";
  const ziel = zielUnter(e.clientX, e.clientY, zug);
  const zeigen = ziel && (ziel.dataset.ortTab || ziel.dataset.raumTab != null || ziel.dataset.tasche != null || passt(zug.uid, ziel)) ? ziel : null;
  if (zeigen !== hoverEl) { if (hoverEl) hoverEl.classList.remove("ziel-hover"); hoverEl = zeigen; if (zeigen) zeigen.classList.add("ziel-hover"); }
}
function zielUnter(x, y, z) {   // bevorzugt ein Ziel, bei dem etwas passiert (kleine Sachen davor stören dann nicht)
  const kandidaten = [];
  for (const el of document.elementsFromPoint(x, y)) {
    const t = el.closest("[data-uid],[data-ort-tab],[data-raum-tab],[data-tasche]");
    if (!t || t.classList.contains("geist") || kandidaten.includes(t)) continue;
    if (z && z.el && (t === z.el || z.el.contains(t))) continue;
    if (t.dataset.uid && +t.dataset.uid === z.uid) continue;
    if (!t.dataset.uid || passt(z.uid, t)) return t;
    kandidaten.push(t);
  }
  return kandidaten[0] || null;
}
// Würde das Ablegen auf diesem Ziel etwas Besonderes auslösen? (für die Hervorhebung)
function passt(uid, zielEl) {
  if (!zielEl.dataset.uid) return false;
  const f = finde(uid), z = finde(+zielEl.dataset.uid); if (!f || !z) return false;
  const d = f.d, t = z.d, da = artVon(d), ta = artVon(t), k = K[d.typ] || {}, tk = K[t.typ] || {};
  if (ta === "figur") return istKlein(d) && da !== "figur";
  if (ta === "tier") return ["essen","trinken","spielzeug","medizin"].includes(da);
  if (tk.sitz && (da === "figur" || da === "tier")) return freierPlatz(t, d, null) >= 0;
  if (tk.fach && istKlein(d)) return true;
  return (t.typ === "herd" && k.zutat) || (t.typ === "toaster" && d.typ === "brot") || (t.typ === "ofen" && k.backzutat) || (t.typ === "waschmaschine" && da === "unordnung")
    || (t.typ === "muelleimer" && istKlein(d) && da !== "tier") || (t.typ === "basketballkorb" && k.ball) || (t.typ === "blumenbeet" && d.typ === "eimer")
    || (t.typ === "spiegel" && da === "figur") || (t.typ === "kleiderstange" && da === "figur")
    || (t.typ === "futtertrog" && (da === "essen" || da === "trinken")) || (t.typ === "muelltrennung" && ["essen", "trinken", "unordnung"].includes(da));
}

// ---------------------------------------------------------------- Ablegen
function ablegen(uid, zielEl, anker, drinnen) {
  const f = finde(uid); if (!f) return zeichne();
  const d = f.d;
  if (zielEl && zielEl.dataset.ortTab) { if (zielEl.dataset.ortTab !== f.ort) { zuOrt(d, zielEl.dataset.ortTab); return fertig(); } }
  if (zielEl && zielEl.dataset.raumTab != null) { zuRaum(d, +zielEl.dataset.raumTab); return fertig(); }
  if (zielEl && zielEl.dataset.tasche != null) { inTasche(d); return fertig(); }
  let t = null;
  if (zielEl && zielEl.dataset.uid) { const z = finde(+zielEl.dataset.uid); if (z && z.ort === S.ort && !z.inHand && !z.besitzer) t = z.d; }
  if (t && interaktion(d, t, anker)) return fertig();
  if (!drinnen) return zeichne();
  hinlegen(d, anker);
  if (t) nebenwirkung(d, t);
  fertig();
}
function fertig() { speichern(); zeichne(); }
function hinlegen(d, p) {
  const ort = S.orte[S.ort], k = K[d.typ] || {}, max = ORT(S.ort).raeume.length * 100;
  nimmRaus(d);
  d.x = +klemme(p.x, 1, max - 1).toFixed(1);
  const boden = bodenY(S.ort, d.x);
  let y = p.y;
  if (istKlein(d) || k.art === "tier") { const a = ablage(d, d.x, y); if (a) { d.auf = a; ort.push(d); ton("pop"); return; } }
  if (k.wand) y = klemme(y, 14, boden - 2);
  else if (y < boden + 3) { d._von = {x:d.x, y}; y = boden + rnd(3, 8); }
  d.y = +klemme(y, 8, 99.5).toFixed(1);
  ort.push(d); ton("pop");
}
function ablage(d, x, y) {
  let best = null, abstand = 99;
  for (const m of S.orte[S.ort]) {
    const fl = K[m.typ] && K[m.typ].flaeche; if (!fl || m.uid === d.uid) continue;
    const L = lage(m), b = breite(m), x0 = L.x + (fl[0] - .5) * b, x1 = L.x + (fl[1] - .5) * b, sy = L.y - (1 - fl[2]) * hoeheP(m);
    if (x >= x0 && x <= x1 && y >= sy - 12 && y <= sy + 5 && Math.abs(y - sy) < abstand) { abstand = Math.abs(y - sy); best = {uid:m.uid, dx:+(x - L.x).toFixed(1)}; }
  }
  return best;
}
function nebenDing(d, t) {   // d neben t auf den Boden legen (dort, wo t gerade steht)
  const wo = finde(t.uid), ort = wo && ORT(wo.ort) ? wo.ort : S.ort, liste = S.orte[ort];
  nimmRaus(d); const L = lage(t, liste);
  d.x = +(L.x + breite(t) * .55 + 1).toFixed(1); d.y = +Math.max(L.y, bodenY(ort, L.x) + 4).toFixed(1);
  if (L.m && t.auf) { d.y = L.y; d.auf = {uid:L.m.uid, dx:+(t.auf.dx + breite(t) * .7).toFixed(1)}; }
  liste.push(d);
}
function zuOrt(d, ortId) {
  const f = finde(d.uid); const alteListe = f.ort !== "tasche" && f.liste === S.orte[f.ort] ? S.orte[f.ort] : null;
  const mit = alteListe ? angehaengt(d, alteListe) : [];
  nimmRaus(d); mit.forEach(m => alteListe.splice(alteListe.indexOf(m), 1));
  const blick = S.blick[ortId]; d.x = blick + rnd(25, 75);
  d.y = (K[d.typ] || {}).wand ? 24 : bodenY(ortId, d.x) + rnd(30, 50);
  S.orte[ortId].push(d, ...mit);
  const o = ORT(ortId);
  sag(`${istFigur(d) ? d.f.name : (K[d.typ].e || "") + " " + K[d.typ].n} ist jetzt hier: ${o.e} ${o.n}`);
  if (istFigur(d)) fortschritt("umziehen");
  ton("pop");
}
function zuRaum(d, i) {
  const f = finde(d.uid);
  if (f.liste !== S.orte[S.ort]) { nimmRaus(d); S.orte[S.ort].push(d); } else { d.sitz = null; d.auf = null; d.schlaeft = false; }
  d.x = i * 100 + rnd(25, 75); d.y = (K[d.typ] || {}).wand ? 24 : bodenY(S.ort, d.x) + rnd(30, 50);
  setzeBlick(i * 100, true); ton("pop");
}
function inTasche(d) {
  if (istFigur(d)) return sag("Figuren passen nicht in die Tasche 😄 Zieh sie oben auf einen Ort.");
  if ((K[d.typ] || {}).fest) return;
  if (S.tasche.length >= TASCHE_MAX) return sag("Die Tasche ist voll! Pack erst etwas aus.");
  const f = finde(d.uid);
  if (f.liste === S.orte[f.ort]) angehaengt(d, f.liste).forEach(m => { festhalten(m); m.sitz = null; m.auf = null; m.schlaeft = false; });
  nimmRaus(d); delete d.offen; S.tasche.push(d); ton("pop");
}

// ---------------------------------------------------------------- Was passiert beim Ablegen auf etwas?
function interaktion(d, t, anker) {
  const da = artVon(d), ta = artVon(t), k = K[d.typ] || {}, tk = K[t.typ] || {};
  if (t.uid === d.uid) return false;
  if (ta === "figur") {
    if (da === "medizin") return verarzten(d, t);
    if (istKlein(d)) { geben(d, t); return true; }
    return false;
  }
  if (ta === "tier") {
    if (da === "essen" || da === "trinken") {
      nimmRaus(d); ton("herz"); later(() => herzen(t.uid, "❤️"));
      sag(`${K[t.typ].der} ${K[t.typ].n} sagt danke für ${k.n}! ❤️`); fortschritt("tier_fuettern"); return true;
    }
    if (da === "spielzeug") { nebenDing(d, t); ton("tada"); later(() => herzen(t.uid, "🎉")); sag("Juhu, spielen! 🎉"); return true; }
    if (da === "medizin") return verarzten(d, t);
  }
  if (tk.sitz && (da === "figur" || da === "tier")) {
    const i = freierPlatz(t, d, anker ? anker.zeigerX : null);
    if (i >= 0) { setzen(d, t, i); return true; }
  }
  if (tk.fach && istKlein(d)) {
    t.inhalt = t.inhalt || [];
    if (t.inhalt.length >= tk.fach.plaetze.length) { sag("Da ist kein Platz mehr!"); return false; }
    nimmRaus(d); delete d.offen; t.inhalt.push(d); if (tk.fach.tuer) t.offen = true; ton("pop"); return true;
  }
  switch (t.typ) {
    case "herd":
      if (!k.zutat) { if (da === "essen") sag("Für den Topf brauchst Du Gemüse oder Käse: 🥕🍅🧅🥔🥦🫑🧀"); return false; }
      t.topf = t.topf || [];
      if (t.topf.length >= 3) { sag("Der Topf ist voll! Tipp den Herd an zum Kochen 🔥"); return false; }
      nimmRaus(d); t.topf.push(d.typ); ton("platsch");
      if (t.topf.length >= 3) { if (t.an) kochen(t); else sag("Jetzt den Herd antippen zum Kochen! 🔥"); }
      else sag(`Noch ${3 - t.topf.length} ${3 - t.topf.length === 1 ? "Zutat" : "Zutaten"} in den Topf!`);
      return true;
    case "toaster":
      if (d.typ !== "brot" || t.toast) return false;
      nimmRaus(d); t.toast = true; ton("klick"); sag("Der Toaster röstet … 🔥");
      setTimeout(() => { t.toast = false; const n = neu("toast", 0, 0); nebenDing(n, t); ton("pop"); sag("Plopp! Fertig 🍞"); fortschritt("toasten"); fertig(); }, 2200);
      return true;
    case "ofen":
      if (!k.backzutat || t.backt) return false;
      t.zutaten = t.zutaten || [];
      nimmRaus(d); t.zutaten.push(d.typ); ton("pop");
      if (t.zutaten.length >= 2) {
        t.backt = true; sag("Der Ofen backt … 🔥");
        setTimeout(() => { t.backt = false; t.zutaten = []; const n = neu(pick(["kuchen","muffin","keks","croissant","muffin","kuchen","torte"]), 0, 0); nebenDing(n, t); ton("tada"); sag(`Mmh, ${K[n.typ].n} ist fertig! ${K[n.typ].e}`); fortschritt("backen"); fertig(); }, 2600);
      } else sag("Noch 1 Backzutat in den Ofen! 🥚🥛🧈🌾🍫🍓");
      return true;
    case "waschmaschine":
      if (da !== "unordnung") return false;
      nimmRaus(d); t.waescht = true; ton("platsch"); sag("Die Waschmaschine wäscht … 🫧"); fortschritt("aufraeumen");
      setTimeout(() => { t.waescht = false; fertig(); }, 2200); return true;
    case "futtertrog": {
      if (da !== "essen" && da !== "trinken") return false;
      nimmRaus(d); ton("lecker"); const r = Math.floor(t.x / 100);
      S.orte[S.ort].filter(x => artVon(x) === "tier" && Math.floor(lage(x).x / 100) === r).forEach(x => later(() => herzen(x.uid, "❤️"), 80));
      sag("Mampf! Die Tiere freuen sich 🐄🐖🐑"); fortschritt("tier_fuettern"); return true; }
    case "muelltrennung":
      if (!["essen", "trinken", "unordnung"].includes(da)) return false;
      nimmRaus(d); ton("spuelen"); sag("Richtig getrennt! ♻️"); fortschritt("trennen"); return true;
    case "muelleimer":
      if (!istKlein(d) || da === "tier") return false;
      nimmRaus(d); ton("spuelen"); sag("Weg damit! 🗑️"); return true;
    case "basketballkorb":
      if (!k.ball) return false;
      nimmRaus(d); t.treffer = true; ton("tada"); sag("Treffer! 🏀"); fortschritt("korbwurf");
      setTimeout(() => { t.treffer = false; nebenDing(d, t); d.x = t.x + rnd(-3, 3); fertig(); }, 700);
      return true;
  }
  return false;
}
function nebenwirkung(d, t) {   // nach dem Hinlegen (Ding bleibt liegen)
  const da = artVon(d);
  if (t.typ === "blumenbeet" && d.typ === "eimer") { t.gegossen = heute(); ton("platsch"); sag("Die Blumen blühen! 🌷🌼"); fortschritt("giessen"); }
  if (t.typ === "spiegel" && da === "figur") later(() => oeffneBaukasten(d.uid, "haare"), 150);
  if (t.typ === "kleiderstange" && da === "figur") later(() => oeffneBaukasten(d.uid, "kleidung"), 150);
}
const later = (fn, ms) => setTimeout(fn, ms || 60);
function geben(d, fig) {
  nimmRaus(d);
  if (fig.hand) { const alt = fig.hand; fig.hand = null; const L = lage(fig); alt.x = +(L.x + breite(fig) * .6).toFixed(1); alt.y = +Math.max(L.y, bodenY(S.ort, L.x) + 4).toFixed(1); S.orte[S.ort].push(alt); }
  fig.hand = d; delete d.offen; ton("pop");
  const a = artVon(d);
  if ((a === "essen" || a === "trinken") && !K[d.typ].nichtEssbar) sag(`Tipp ${fig.f.name} an zum ${a === "trinken" ? "Trinken" : "Essen"} 😋`);
}
function verarzten(d, t) {
  const name = istFigur(t) ? t.f.name : `${K[t.typ].der} ${K[t.typ].n}`;
  if (d.typ === "pflaster") { nimmRaus(d); t.pflaster = heute(); ton("herz"); later(() => herzen(t.uid, "💚")); sag(`Gute Besserung, ${name}! 🩹`); fortschritt("verarzten"); return true; }
  nebenDing(d, t);
  if (d.typ === "thermometer") { later(() => sprechblase(t.uid, "37 °C – alles gesund! 💚")); ton("klick"); }
  if (d.typ === "stethoskop") { later(() => sprechblase(t.uid, "Bum-bum, bum-bum ❤️")); ton("herz"); }
  return true;
}
function freierPlatz(t, d, zeigerX) {
  const plaetze = K[t.typ].sitz || [], liste = S.orte[S.ort], L = lage(t), b = breite(t);
  let best = -1, abst = 1e9;
  plaetze.forEach((p, i) => {
    const passt = istFigur(d) ? p[2] !== "tier" : ["tier","sitzt","liegt"].includes(p[2]);
    if (!passt || liste.some(x => x !== d && x.sitz && x.sitz.uid === t.uid && x.sitz.i === i)) return;
    const a = zeigerX == null ? i : Math.abs(L.x + (p[0] - .5) * b - zeigerX);
    if (a < abst) { abst = a; best = i; }
  });
  return best;
}
function setzen(d, t, i) {
  nimmRaus(d); d.sitz = {uid:t.uid, i}; S.orte[S.ort].push(d); festhalten(d);
  const pose = K[t.typ].sitz[i][2];
  d.schlaeft = pose === "liegt" && istFigur(d) && ["bett", "krankenbett"].includes(t.typ);
  ton("pop");
  if (!istFigur(d)) { later(() => herzen(d.uid, "💤")); return; }
  const n = d.f.name;
  switch (t.typ) {
    case "bett": sag(`Gute Nacht, ${n}! 🌙 (Antippen weckt auf)`); fortschritt("schlafen"); break;
    case "krankenbett": sag(`Gute Besserung, ${n}! 💐`); fortschritt("schlafen"); break;
    case "dusche": if (t.an) { duschen(d); } else sag("Tipp die Dusche an, dann kommt Wasser 🚿"); break;
    case "badewanne": fortschritt("baden"); sag(t.an ? "Herrlich, Schaum! 🫧" : "Tipp die Wanne an für Schaum 🫧"); break;
    case "roentgen": ton("klick"); sag(`Röntgenbild von ${n}: alles gesund! ✓`); fortschritt("roentgen"); break;
    case "friseurstuhl": later(() => oeffneBaukasten(d.uid, "haare"), 250); break;
    case "becken": ton("platsch"); later(() => herzen(d.uid, "💦")); sag(`Platsch! ${n} schwimmt 🏊`); break;
    case "sprungbrett": sag("Tipp die Figur an zum Springen! 🏊"); break;
    case "liegestuhl": sag(`${n} macht es sich gemütlich 😎`); break;
    case "traktor": sag("Tipp die Figur an zum Fahren! 🚜"); break;
    case "kinositz": if (S.orte[S.ort].some(x => x.typ === "leinwand" && x.film)) fortschritt("kino"); else sag("Tipp die Leinwand an, dann läuft der Film 🎬"); break;
    case "schaukel": sag("Tipp die Figur an zum Schaukeln!"); break;
    case "rutsche": sag("Tipp die Figur an zum Rutschen! 🛝"); break;
    case "toilette": sag("Psst … 🚽"); break;
    case "sofa": case "sessel": if (fernseherAn(t)) fortschritt("fernsehen"); break;
  }
}
function fernseherAn(t) { const r = Math.floor(t.x / 100); return S.orte[S.ort].some(x => x.typ === "fernseher" && x.an && Math.floor(x.x / 100) === r); }
function duschen(d) { ton("platsch"); later(() => herzen(d.uid, "🫧")); sag(`${d.f.name} ist jetzt schön sauber! 🫧`); fortschritt("duschen"); }
function kochen(t) {
  sag("Es brodelt … 🔥"); t.kocht = true;
  setTimeout(() => {
    t.kocht = false; t.topf = [];
    const n = neu(pick(["suppe","suppe","nudeln"]), 0, 0); nebenDing(n, t);
    ton("tada"); sag(`${K[n.typ].n} ist fertig! ${K[n.typ].e} Gib sie einer Figur.`); fortschritt("kochen"); fertig();
  }, 1800);
}

// ---------------------------------------------------------------- Antippen
const SAETZE = ["Hallo! 👋", "Juhu!", "Ich hab Hunger! 🍕", "Spielen wir was?", "Hihi, das kitzelt!", "Was machen wir heute?", "Ich mag Dich! 💖", "Lass uns tanzen! 💃", "Ich bin müde … 😴", "Hast Du Kakao? ☕"];
function tippen(uid) {
  const f = finde(uid); if (!f) return;
  const d = f.d, a = artVon(d), k = K[d.typ] || {};
  if (f.inHand) { if (istEssbar(d)) return beissen(f.besitzer); animiere(f.besitzer.uid, "huepft", 500); ton("klick"); return zeichne(); }
  if (f.besitzer) { sag(`${k.e || ""} ${k.n}`, 1500); ton("klick"); return; }
  if (f.ort === "tasche") return;
  if (a === "figur") {
    if (d.hand && istEssbar(d.hand)) return beissen(d);
    if (d.schlaeft) { d.schlaeft = false; const L = lage(d); d.sitz = null; d.x = +(L.x + 4).toFixed(1); d.y = +Math.max(L.y + 6, bodenY(S.ort, L.x) + 6).toFixed(1); sag(`Guten Morgen, ${d.f.name}! ☀️`); return fertig(); }
    const L = lage(d);
    if (L.m && L.m.typ === "schaukel") { animiere(d.uid, "schaukelt", 3000); L.m.schwingt = true; setTimeout(() => { L.m.schwingt = false; zeichne(); }, 3000); ton("lied"); fortschritt("schaukeln"); return zeichne(); }
    if (L.m && L.m.typ === "rutsche") {
      const m = L.m; d.sitz = null; d._von = {x:L.x, y:L.y}; d.x = +(m.x + .45 * breite(m)).toFixed(1); d.y = +Math.min(99.5, m.y + 1).toFixed(1);
      ton("tada"); sag("Wiiieee! 🛝"); fortschritt("rutschen"); return fertig();
    }
    if (L.m && L.m.typ === "friseurstuhl") return oeffneBaukasten(uid, "haare");
    if (L.m && L.m.typ === "sprungbrett") return springen(d, L);
    if (L.m && L.m.typ === "traktor") return traktorFahren(L.m, d);
    d._lacht = Date.now() + 1400; animiere(uid, "huepft", 600); ton("herz"); zeichne(); setTimeout(zeichne, 1500);
    return later(() => sprechblase(uid, `${d.f.name}: ${pick(SAETZE)}`, true));
  }
  if (a === "tier") { ton("herz"); herzen(uid, "❤️"); return; }
  if (d.laden) return oeffneLaden(d.laden, uid);
  switch (d.typ) {
    case "adoption": return oeffneTierheim(uid);
    case "tafel": return oeffneTafel(uid);
    case "kaffeemaschine":
      if (d.macht) return;
      d.macht = true; ton("klick"); zeichne(); sag("Die Maschine brummt … ☕");
      return setTimeout(() => { d.macht = false; const n = neu("kakao", 0, 0); nebenDing(n, d); ton("pop"); sag("Ein Kakao! ☕"); fortschritt("kakao"); fertig(); }, 1300);
    case "toilette": ton("spuelen"); return sag("Wusch! 🚽💨");
    case "getraenkeautomat":
      if (d.macht) return;
      d.macht = true; ton("klick"); zeichne(); sag("Klonk … 🥤");
      return setTimeout(() => { d.macht = false; const n = neu(pick(["saft", "limonade"]), 0, 0); nebenDing(n, d); ton("pop"); sag(`${K[n.typ].e} ${K[n.typ].n}!`); fertig(); }, 1000);
    case "leinwand":
      d.film = !d.film; ton(d.film ? "lied" : "klick");
      if (d.film) { if (S.orte[S.ort].some(x => istFigur(x) && x.sitz && (S.orte[S.ort].find(m => m.uid === x.sitz.uid) || {}).typ === "kinositz")) fortschritt("kino");
        else sag("Setz Figuren in die Kinosessel! 🍿"); setTimeout(() => { if (d.film) { d.film = false; zeichne(); } }, 15000); }
      return fertig();
    case "huehnerstall":
      if (d.eierTag !== heute()) { d.eierTag = heute(); d.eier = 0; }
      if (d.eier >= 3) return sag("Die Hühner brauchen eine Pause. Morgen gibt es neue Eier 🐔");
      d.eier++; { const n = neu("ei", 0, 0); nebenDing(n, d); }
      ton("pop"); sag("Ein frisches Ei! 🥚"); fortschritt("eier"); return fertig();
    case "traktor": return traktorFahren(d, S.orte[S.ort].find(x => istFigur(x) && x.sitz && x.sitz.uid === d.uid));
    case "sandburg": animiere(uid, "wackelt", 450); ton("tada"); fortschritt("sandburg"); return sag("Was für eine tolle Sandburg! 🏰");
    case "sprungbrett": return sag("Stell eine Figur ganz vorne aufs Sprungbrett und tipp sie an 🏊");
    case "becken": return sag("Zieh Figuren ins Wasser oder lass sie vom Sprungbrett springen 💦");
    case "futtertrog": return sag("Zieh Futter in den Trog, dann freuen sich die Tiere 🌾");
    case "muelltrennung": return sag("Zieh Essensreste und Sachen hinein ♻️");
    case "uhr": { const t = new Date(); return sag(`Es ist ${t.getHours()}:${String(t.getMinutes()).padStart(2, "0")} Uhr 🕰️`); }
    case "glocke": ton("klingel"); return sag("Rrring! Die Pause ist um 🔔");
    case "spiegel": return sag("Zieh eine Figur zum Spiegel für eine neue Frisur ✨");
    case "kleiderstange": { const fig = naechsteFigur(d); return fig ? oeffneBaukasten(fig.uid, "kleidung") : sag("Bring eine Figur hierher, dann kann sie sich umziehen 👗"); }
    case "ofen": return sag(d.backt ? "Gleich fertig …" : `Zieh 2 Backzutaten in den Ofen: 🥚🥛🧈🌾🍫🍓${(d.zutaten || []).length ? " (1 ist schon drin)" : ""}`);
    case "toaster": return sag("Zieh ein Brot 🍞 in den Toaster");
    case "waschmaschine": return sag("Zieh herumliegende Sachen 🧦👕👖👟 in die Waschmaschine");
    case "muelleimer": return sag("Zieh Sachen hinein, die Du nicht mehr brauchst 🗑️");
    case "basketballkorb": return sag("Zieh einen Ball auf den Korb! 🏀");
    case "blumenbeet": return sag(d.gegossen === heute() ? "Die Blumen sind heute schon gegossen 🌷" : "Zieh den Wassereimer 🪣 auf das Beet");
  }
  if (k.schalter) {
    d.an = !d.an; ton("klick");
    if (d.typ === "fernseher" && d.an && S.orte[S.ort].some(x => istFigur(x) && x.sitz && ["sofa","sessel"].includes((S.orte[S.ort].find(m => m.uid === x.sitz.uid) || {}).typ) && Math.floor(lage(x).x / 100) === Math.floor(d.x / 100))) fortschritt("fernsehen");
    if (d.typ === "radio" && d.an) ton("lied");
    if (d.typ === "herd" && d.an && (d.topf || []).length >= 3) kochen(d);
    if (d.typ === "herd" && d.an && (d.topf || []).length < 3) sag("Zieh 3 Zutaten auf den Herd 🥕🍅🧅");
    if (d.typ === "dusche" && d.an) { const drin = S.orte[S.ort].find(x => x.sitz && x.sitz.uid === d.uid && istFigur(x)); if (drin) duschen(drin); }
    if (d.typ === "badewanne" && d.an) ton("platsch");
    return fertig();
  }
  if (k.fach && k.fach.tuer) { d.offen = !d.offen; ton("klick"); return fertig(); }
  animiere(uid, "wackelt", 450); ton("pop"); zeichne();
  if (d.typ === "ball" || d.typ === "basketball") sag("Boing! 🏀", 1200);
  else sag(`${k.e || ""} ${k.n}`, 1500);
}
function springen(d, L) {
  const r = Math.floor(L.x / 100), pool = S.orte[S.ort].find(x => x.typ === "becken" && Math.floor(x.x / 100) === r);
  if (!pool) return sag("Hier ist kein Schwimmbecken.");
  const i = freierPlatz(pool, d, null);
  if (i < 0) return sag("Das Becken ist gerade voll!");
  d.sitz = {uid:pool.uid, i}; d._von = {x:L.x, y:L.y - 6};
  ton("platsch"); fortschritt("schwimmen"); sag(`${d.f.name} springt: Platsch! 💦`);
  fertig(); later(() => herzen(d.uid, "💦"), 650);
}
function traktorFahren(t, fahrer) {
  animiere(t.uid, "wackelt", 600); if (fahrer) animiere(fahrer.uid, "wackelt", 600); ton("brumm");
  if (fahrer) { fortschritt("traktor"); sag(`Brumm, brumm! ${fahrer.f.name} fährt Traktor 🚜`); } else sag("Setz eine Figur auf den Traktor! 🚜");
}
const istEssbar = d => ["essen", "trinken"].includes(artVon(d)) && !K[d.typ].nichtEssbar;
function beissen(fig) {
  const h = fig.hand; h.bissen = (h.bissen || 0) + 1;
  fig._lacht = Date.now() + 900; ton("lecker"); setTimeout(zeichne, 1000);
  if (h.bissen >= 3) { fig.hand = null; fortschritt("essen_geben"); later(() => sprechblase(fig.uid, `${fig.f.name}: Lecker! 😋`)); }
  else later(() => sprechblase(fig.uid, artVon(h) === "trinken" ? "Schlürf! 🥤" : "Mampf! 😋"));
  fertig();
}
function naechsteFigur(d) {
  let best = null, a = 1e9;
  for (const x of S.orte[S.ort]) if (istFigur(x)) { const v = Math.abs(lage(x).x - d.x); if (v < a && v < 60) { a = v; best = x; } }
  return best;
}

// ---------------------------------------------------------------- Aufgaben
function neueAufgabe() {
  const aktiv = S.aufgaben.map(a => a.id);
  const id = pick(Object.keys(AUFGABEN).filter(x => !aktiv.includes(x)));
  if (id === "aufraeumen") sorgeFuerUnordnung(3);
  return {id, n:0, fertig:false};
}
function sorgeFuerUnordnung(n) {
  const haus = S.orte.haus, da = haus.filter(d => artVon(d) === "unordnung").length;
  for (let i = da; i < n; i++) haus.push(neu(pick(["socke","shirt","hose","schuh"]), 200 + rnd(30, 90), rnd(86, 98)));
}
function fortschritt(id) {
  for (const a of S.aufgaben) {
    if (a.id !== id || a.fertig) continue;
    a.n++;
    if (a.n >= AUFGABEN[id].z) { a.fertig = true; setTimeout(() => { ton("tada"); sag("🎉 Aufgabe geschafft! Hol Dir Deine Sterne bei 📋 Aufgaben ab."); zeichneKopf(); }, 1000); }
  }
}
function zeigeAufgaben() {
  oeffne(`<button class="zu" onclick="schliesse()">✖</button><h2>📋 Deine Aufgaben</h2>
    ${S.aufgaben.map((a, i) => { const def = AUFGABEN[a.id]; return `<div class="aufgabe"><div class="text">${def.t}
      <div class="balken"><div style="width:${Math.min(100, a.n / def.z * 100)}%"></div></div></div>
      ${a.fertig ? `<button class="gruen" onclick="abholen(${i})">Abholen +${def.l} ⭐</button>` : `<span class="lohn">${a.n}/${def.z} · ${def.l} ⭐</span>`}</div>`; }).join("")}
    <p class="hinweis">Abgeholte Aufgaben werden sofort durch neue ersetzt. Sterne gibt es auch für 🧠 Wissensfragen (${LOHN_FRAGE} ⭐ je richtige Antwort) und jeden Tag ein 🎁 Tagesgeschenk.</p>`);
}
function abholen(i) {
  const a = S.aufgaben[i]; if (!a || !a.fertig) return;
  sterne(AUFGABEN[a.id].l); S.erledigt++;
  S.aufgaben[i] = neueAufgabe();
  speichern(); zeichne(); zeigeAufgaben();
}

// ---------------------------------------------------------------- Dialoge
function oeffne(html) { $("#karte").innerHTML = html; $("#schleier").style.display = "flex"; }
function schliesse() { $("#schleier").style.display = "none"; if (bk) schliesseBaukasten(true); }

// Läden
let ladenStand = {id:"obst", quelle:null};
function oeffneLaden(id, quelle) { ladenStand = {id, quelle:quelle || ladenStand.quelle}; zeigeLaden(); }
function warenListe(id) { return LAEDEN[id].waren.map(w => Array.isArray(w) ? {typ:w[0], props:w[1], zusatz:w[2]} : {typ:w, props:{}, zusatz:""}); }
function zeigeLaden() {
  const gruppe = ORT(S.ort).raeume.length && S.orte[S.ort].filter(d => d.laden).map(d => d.laden);
  const reiter = [...new Set(gruppe)];
  const waren = warenListe(ladenStand.id);
  oeffne(`<button class="zu" onclick="schliesse()">✖</button><h2>${LAEDEN[ladenStand.id].n} <span class="klein">– Du hast ${S.sterne} ⭐</span></h2>
    ${reiter.length > 1 ? `<div class="reiter">${reiter.map(id => `<button class="${id === ladenStand.id ? "aktiv" : ""}" onclick="oeffneLaden('${id}')">${LAEDEN[id].n}</button>`).join("")}</div>` : ""}
    <div class="waren">${waren.map((w, i) => { const k = K[w.typ], d = Object.assign({typ:w.typ}, w.props), kann = S.sterne >= k.preis;
      const bild = k.e ? `<div class="gross">${k.e}</div>` : `<div class="bildchen">${svgVon(GRAFIK[w.typ].vb, GRAFIK[w.typ].z(d, {}))}</div>`;
      return `<div class="ware">${bild}<div>${k.n}${w.zusatz ? ` (${w.zusatz})` : ""}</div>
        <button class="${kann ? "gruen" : ""}" ${kann ? "" : "disabled"} onclick="kaufe(${i})">${kann ? `Kaufen: ${k.preis} ⭐` : `${k.preis} ⭐ (noch ${k.preis - S.sterne})`}</button></div>`; }).join("")}</div>
    <p class="hinweis">Gekauftes steht danach hier im Laden. Zieh es in die 🎒 Tasche oder oben auf „🏠 Zuhause“, um es mitzunehmen.</p>`);
}
function kaufe(i) {
  const w = warenListe(ladenStand.id)[i], k = K[w.typ];
  if (S.sterne < k.preis) return;
  sterne(-k.preis);
  const n = neu(w.typ, 0, 0, Object.assign({}, w.props));
  const q = ladenStand.quelle && finde(ladenStand.quelle);
  if (q && q.ort === S.ort) {
    const t = q.d, fl = K[t.typ].flaeche;
    if (fl && istKlein(n)) { n.auf = {uid:t.uid, dx:+((fl[0] + Math.random() * (fl[1] - fl[0]) - .5) * breite(t) * .9).toFixed(1)}; n.x = t.x; n.y = t.y; S.orte[S.ort].push(n); }
    else { n.x = +(t.x + rnd(-6, 6)).toFixed(1); n.y = istKlein(n) ? 97 : 99.5; if (k.wand) n.y = 40; S.orte[S.ort].push(n); }
  } else { n.x = S.blick[S.ort] + 50; n.y = 97; S.orte[S.ort].push(n); }
  if (!k.e) fortschritt("moebel");
  if (ladenStand.id === "eis") fortschritt("eis");
  if (ladenStand.id === "kantine") fortschritt("kantine");
  if (S.ort === "markt") fortschritt("einkaufen");
  speichern(); zeichne(); zeigeLaden();
  sag(`${k.e || "🛍️"} ${k.n} gekauft!`);
}
function oeffneTierheim(quelle) {
  const tiere = Object.keys(K).filter(t => K[t].art === "tier");
  oeffne(`<button class="zu" onclick="schliesse()">✖</button><h2>🐾 Tierheim <span class="klein">– Du hast ${S.sterne} ⭐</span></h2>
    <p>Diese Tiere suchen ein Zuhause. Sie freuen sich über Futter, Spielzeug und ein Körbchen!</p>
    <div class="waren">${tiere.map(t => { const k = K[t], kann = S.sterne >= k.preis; return `<div class="ware"><div class="gross">${k.e}</div><div>${k.n}</div>
      <button class="${kann ? "gruen" : ""}" ${kann ? "" : "disabled"} onclick="adoptiere('${t}',${quelle})">${kann ? `Aufnehmen: ${k.preis} ⭐` : `${k.preis} ⭐ (noch ${k.preis - S.sterne})`}</button></div>`; }).join("")}</div>`);
}
function adoptiere(typ, quelle) {
  const k = K[typ]; if (S.sterne < k.preis) return;
  sterne(-k.preis);
  const q = finde(quelle), n = neu(typ, 0, 0);
  n.x = q ? +(q.d.x + rnd(-14, -4)).toFixed(1) : S.blick[S.ort] + 50; n.y = 97; S.orte[S.ort].push(n);
  schliesse(); speichern(); zeichne();
  sag(`${k.e} Willkommen! ${k.der} ${k.n} wartet vor dem Schalter auf Dich.`);
  later(() => herzen(n.uid, "❤️"), 200);
}

// Tafel
function oeffneTafel(uid) {
  const d = finde(uid).d;
  oeffne(`<button class="zu" onclick="schliesse()">✖</button><h2>🖍️ Tafel</h2>
    <canvas id="malflaeche" width="648" height="248"></canvas>
    <div class="malleiste">${["#ffffff","#ffd84d","#ff8fbf","#7fd0ff","#9fe08f","#ff9a3c"].map((c, i) => `<button class="farbknopf ${i === 0 ? "an" : ""}" style="background:${c}" onclick="malFarbe(this,'${c}')"></button>`).join("")}
      <button onclick="malDicke(this)">✏️ Dick</button><button onclick="malLeeren()">🧽 Alles wegwischen</button><button class="bunt" onclick="malFertig(${uid})">✔ Fertig</button></div>`);
  const c = $("#malflaeche"), g = c.getContext("2d");
  g.fillStyle = "#2f5d4a"; g.fillRect(0, 0, c.width, c.height);
  if (d.bild) { const img = new Image(); img.onload = () => g.drawImage(img, 0, 0, c.width, c.height); img.src = d.bild; }
  mal = {farbe:"#ffffff", dicke:6, an:false, gemalt:false};
  const punkt = e => { const r = c.getBoundingClientRect(); return [(e.clientX - r.left) * c.width / r.width, (e.clientY - r.top) * c.height / r.height]; };
  c.addEventListener("pointerdown", e => { mal.an = true; c.setPointerCapture(e.pointerId); const [x, y] = punkt(e); g.beginPath(); g.moveTo(x, y); g.lineTo(x + .1, y + .1); g.strokeStyle = mal.farbe; g.lineWidth = mal.dicke; g.lineCap = "round"; g.lineJoin = "round"; g.stroke(); mal.gemalt = true; });
  c.addEventListener("pointermove", e => { if (!mal.an) return; const [x, y] = punkt(e); g.lineTo(x, y); g.stroke(); });
  c.addEventListener("pointerup", () => { mal.an = false; });
}
let mal = null;
function malFarbe(btn, c) { mal.farbe = c; document.querySelectorAll(".farbknopf").forEach(b => b.classList.remove("an")); btn.classList.add("an"); }
function malDicke(btn) { mal.dicke = mal.dicke === 6 ? 14 : 6; btn.textContent = mal.dicke === 6 ? "✏️ Dick" : "✏️ Dünn"; }
function malLeeren() { const c = $("#malflaeche"), g = c.getContext("2d"); g.fillStyle = "#2f5d4a"; g.fillRect(0, 0, c.width, c.height); mal.gemalt = true; }
function malFertig(uid) {
  const d = finde(uid).d; d.bild = $("#malflaeche").toDataURL("image/png");
  if (mal.gemalt) fortschritt("malen");
  schliesse(); fertig(); sag("Schönes Bild! 🎨");
}

// Figuren-Baukasten
let bk = null;
function oeffneBaukasten(uid, tab) {
  document.querySelectorAll(".blase").forEach(b => b.remove());
  bk = {uid, tab:tab || "koerper", frage:null, vorher:JSON.stringify(finde(uid).d.f)};
  zeigeBaukasten();
}
const besitzSchluessel = (g, w) => (["obenfarbe","untenfarbe","schuhfarbe"].includes(g) ? "farbe" : g) + ":" + w;
function zeigeBaukasten() {
  const f = finde(bk.uid); if (!f) { bk = null; return schliesse(); }
  const fig = Object.assign({}, FIGUR_STANDARD, f.d.f), imLaden = f.ort === "mode";
  const tab = BAUKASTEN.find(t => t.id === bk.tab);
  let h = `<button class="zu" onclick="schliesse()">✖</button><h2>✨ ${esc(fig.name)} gestalten <span class="klein">– Du hast ${S.sterne} ⭐</span></h2>
    <div class="baukasten"><div class="vorschau">${figurSVG(fig)}<input type="text" maxlength="14" value="${esc(fig.name)}" oninput="nameAendern(this.value)" aria-label="Name">
      <button onclick="zufallsLook()">🎲 Zufall</button></div><div>
    <div class="reiter">${BAUKASTEN.map(t => `<button class="${t.id === bk.tab ? "aktiv" : ""}" onclick="bk.tab='${t.id}';bk.frage=null;zeigeBaukasten()">${t.n}</button>`).join("")}</div>`;
  for (const [g, titel, opts, farbe] of tab.gruppen) {
    h += `<div class="gruppe"><b>${titel}</b>` + opts.map(([w, n, preis]) => {
      const gesperrt = preis > 0 && !S.besitz.includes(besitzSchluessel(g, w)), frage = bk.frage === g + ":" + w;
      const bild = farbe ? `<span class="farbe" style="background:${g === "haut" ? HAUT[w] : w}"></span>${n ? " " + n : ""}` : n;
      return `<button class="opt ${String(fig[g]) === String(w) ? "an" : ""} ${frage ? "frage" : ""}" data-g="${g}" data-w="${esc(String(w))}" data-zahl="${typeof w === "number" ? 1 : 0}">${frage ? `Kaufen für ${preis} ⭐?` : bild + (gesperrt ? ` 🔒${preis}` : "")}</button>`;
    }).join("") + `</div>`;
  }
  h += imLaden ? `<p class="hinweis">💇 Du bist im Friseur & Modeladen: Sachen mit 🔒 kannst Du hier mit Sternen kaufen. Einmal gekauft, gehören sie allen Figuren.</p>`
               : `<p class="hinweis">🔒 Sachen mit Schloss gibt es im Friseur & Modeladen. Zieh ${esc(fig.name)} oben auf „💇 Friseur & Mode“!</p>`;
  oeffne(h + `</div></div>`);
}
document.addEventListener("click", e => {
  const b = e.target.closest(".opt[data-g]"); if (!b || !bk) return;
  waehle(b.dataset.g, b.dataset.zahl === "1" ? +b.dataset.w : b.dataset.w);
});
function waehle(g, w) {
  const f = finde(bk.uid); if (!f) return;
  const gruppe = BAUKASTEN.flatMap(t => t.gruppen).find(x => x[0] === g);
  const preis = gruppe[2].find(o => String(o[0]) === String(w))[2], schl = besitzSchluessel(g, w);
  if (preis > 0 && !S.besitz.includes(schl)) {
    if (f.ort !== "mode") { sag("Das gibt es im Friseur & Modeladen 💇 – bring die Figur dorthin!"); return; }
    if (bk.frage !== g + ":" + w) { bk.frage = g + ":" + w; return zeigeBaukasten(); }
    bk.frage = null;
    if (S.sterne < preis) { sag(`Dafür brauchst Du noch ${preis - S.sterne} Sterne. Erledige Aufgaben! 📋`); return zeigeBaukasten(); }
    sterne(-preis); S.besitz.push(schl);
  }
  bk.frage = null; f.d.f[g] = w; ton("klick"); speichern(); zeichne(); zeigeBaukasten();
}
function nameAendern(v) { const f = finde(bk.uid); if (!f) return; f.d.f.name = v.trim() || "Ohne Namen"; speichern(); zeichne(); }
function zufallsLook() {
  const f = finde(bk.uid); if (!f) return;
  for (const t of BAUKASTEN) for (const [g, , opts] of t.gruppen) {
    if (g === "groesse") continue;
    const frei = opts.filter(o => o[2] === 0 || S.besitz.includes(besitzSchluessel(g, o[0])));
    f.d.f[g] = pick(frei)[0];
  }
  ton("tada"); speichern(); zeichne(); zeigeBaukasten();
}
function schliesseBaukasten(still) {
  const f = finde(bk.uid);
  if (f && JSON.stringify(Object.assign({}, f.d.f, {name:""})) !== JSON.stringify(Object.assign(JSON.parse(bk.vorher), {name:""}))) fortschritt("stylen");
  bk = null; speichern(); zeichne();
}

// Figurenliste
function zeigeFiguren() {
  const alle = []; for (const o of ORTE) S.orte[o.id].forEach(d => { if (istFigur(d)) alle.push([d, o]); });
  oeffne(`<button class="zu" onclick="schliesse()">✖</button><h2>👤 Deine Figuren (${alle.length})</h2>
    <div class="figurenliste">${alle.map(([d, o]) => `<div class="ware"><div class="mini">${figurSVG(d.f)}</div><b>${esc(d.f.name)}</b><div class="klein">${o.e} ${o.n}</div>
      <button onclick="oeffneBaukasten(${d.uid})">✨ Gestalten</button>${o.id !== S.ort ? `<button onclick="holeFigur(${d.uid})">Hierher holen</button>` : ""}</div>`).join("")}</div>
    <p style="margin-top:14px">${alle.length >= MAX_FIGUREN ? "Mehr Figuren passen nicht." : S.sterne >= PREIS_FIGUR
      ? `<button class="gruen" onclick="neueFigur()">➕ Neue Figur bauen (${PREIS_FIGUR} ⭐)</button>` : `Eine neue Figur kostet ${PREIS_FIGUR} ⭐ – Dir fehlen noch ${PREIS_FIGUR - S.sterne} ⭐.`}</p>`);
}
function holeFigur(uid) { const d = finde(uid).d; zuOrt(d, S.ort); schliesse(); fertig(); }
function neueFigur() {
  if (S.sterne < PREIS_FIGUR) return;
  sterne(-PREIS_FIGUR);
  const d = neu("figur", S.blick[S.ort] + rnd(35, 65), 96, {f:Object.assign({}, FIGUR_STANDARD, {name:"Neu"})});
  S.orte[S.ort].push(d); bk = null; zeichne(); oeffneBaukasten(d.uid, "koerper"); zufallsLook();
}

// Zimmer einrichten
let einr = null;
function oeffneEinrichten() { einr = {frage:null}; zeigeEinrichten(); }
function zeigeEinrichten() {
  const i = aktiverRaum(), r = ORT(S.ort).raeume[i], st = S.raeume[S.ort][i];
  const liste = (art, tab) => Object.entries(tab).map(([id, [n, css, preis]]) => {
    const gesperrt = preis > 0 && !S.besitz.includes(art + ":" + id), frage = einr.frage === art + ":" + id;
    return `<button class="muster ${st[art] === id ? "an" : ""} ${frage ? "frage" : ""}" onclick="waehleRaum('${art}','${id}')"><span class="probe" style="background:${esc(css)}"></span>${frage ? `Kaufen für ${preis} ⭐?` : n + (gesperrt ? ` 🔒${preis}` : "")}</button>`;
  }).join("");
  oeffne(`<button class="zu" onclick="schliesse()">✖</button><h2>🎨 ${esc(r.n)} einrichten <span class="klein">– Du hast ${S.sterne} ⭐</span></h2>
    <p>Möbel kaufst Du im 🛒 Möbelhaus. Hier wählst Du Tapete und Boden für das Zimmer, das gerade zu sehen ist.</p>
    <div class="gruppe"><b>Tapete</b><div class="musterliste">${liste("wand", TAPETEN)}</div></div>
    <div class="gruppe"><b>Boden</b><div class="musterliste">${liste("boden", Object.fromEntries(Object.entries(BOEDEN).filter(([id]) => !["gras","asphalt"].includes(id))))}</div></div>`);
}
function waehleRaum(art, id) {
  const tab = art === "wand" ? TAPETEN : BOEDEN, preis = tab[id][2], schl = art + ":" + id;
  if (preis > 0 && !S.besitz.includes(schl)) {
    if (einr.frage !== schl) { einr.frage = schl; return zeigeEinrichten(); }
    einr.frage = null;
    if (S.sterne < preis) { sag(`Dafür brauchst Du noch ${preis - S.sterne} Sterne.`); return zeigeEinrichten(); }
    sterne(-preis); S.besitz.push(schl);
  }
  einr.frage = null;
  const st = S.raeume[S.ort][aktiverRaum()];
  if (st[art] !== id) { st[art] = id; fortschritt("einrichten"); }
  ton("klick"); speichern(); zeichne(); zeigeEinrichten();
}

// Wissensfragen
let quiz = null;
function neueFrage() {
  const englisch = Array.isArray(window.VOKABELN) && window.VOKABELN.length > 8 && Math.random() < .5;
  quiz = englisch ? englischFrage() : rechenFrage();
  zeigeQuiz();
}
function rechenFrage() {
  const art = pick(["mal", "mal", "plus", "minus", "geteilt"]);
  let a, b, r, t;
  if (art === "mal") { a = rnd(2, 12); b = rnd(2, 12); r = a * b; t = `${a} · ${b} = ?`; }
  if (art === "plus") { a = rnd(100, 899); b = rnd(11, 99); r = a + b; t = `${a} + ${b} = ?`; }
  if (art === "minus") { a = rnd(200, 999); b = rnd(11, 99); r = a - b; t = `${a} − ${b} = ?`; }
  if (art === "geteilt") { b = rnd(2, 10); r = rnd(2, 12); a = b * r; t = `${a} : ${b} = ?`; }
  const falsch = new Set();
  for (const v of mische([r + 1, r - 1, r + 10, r - 10, r + 2, r - 2, art === "mal" ? r + a : r + 5, art === "mal" ? r - b : r - 5]))
    if (v >= 0 && v !== r && falsch.size < 3) falsch.add(v);
  return {art:"Rechnen 🔢", frage:t, richtig:String(r), optionen:mische([r, ...falsch].map(String)), antwort:null};
}
function englischFrage() {
  const liste = window.VOKABELN.filter(w => w.en && w.de), w = pick(liste);
  const andere = [...new Set(mische(liste.filter(x => x.en !== w.en && x.de !== w.de)).map(x => x.en))].slice(0, 3);
  return {art:"Englisch 🇬🇧", frage:`Was heißt „${w.de}“ auf Englisch?`, richtig:w.en, optionen:mische([w.en, ...andere]), antwort:null};
}
const LOB = ["Super! 🌟", "Klasse gemacht! 🎉", "Richtig! Du bist schlau! 🧠", "Wow, genau! ✨", "Spitze! 🏆"];
function zeigeQuiz() {
  const q = quiz, fertigBeantwortet = q.antwort !== null;
  let rueck = "";
  if (fertigBeantwortet) rueck = q.antwort === q.richtig ? `${pick(LOB)} +${LOHN_FRAGE} ⭐` : `Knapp daneben! Richtig ist: <b>${esc(q.richtig)}</b>. Beim nächsten Mal klappt's! 💪`;
  oeffne(`<button class="zu" onclick="schliesse()">✖</button><h2>🧠 Wissensfrage <span class="klein">· ${q.art}</span></h2>
    <div class="frage-text">${esc(q.frage)}</div>
    <div class="antworten">${q.optionen.map((o, i) => { let c = ""; if (fertigBeantwortet) { if (o === q.richtig) c = "richtig"; else if (o === q.antwort) c = "falsch"; }
      return `<button class="${c}" ${fertigBeantwortet ? "disabled" : ""} onclick="beantworte(${i})">${esc(o)}</button>`; }).join("")}</div>
    <div class="rueckmeldung">${rueck}</div>
    ${fertigBeantwortet ? `<p style="text-align:center"><button class="bunt" onclick="neueFrage()">Nächste Frage ➜</button> <button onclick="schliesse()">Weiterspielen</button></p>` : ""}`);
}
function beantworte(i) {
  if (quiz.antwort !== null) return;
  quiz.antwort = quiz.optionen[i];
  if (quiz.antwort === quiz.richtig) { sterne(LOHN_FRAGE); fortschritt("quiz"); speichern(); }
  else ton("fehler");
  zeigeQuiz();
}

function zeigeHilfe() {
  oeffne(`<button class="zu" onclick="schliesse()">✖</button><h2>❓ So geht SoCla</h2>
    <ul class="hilfe">
      <li>🖱️ <b>Ziehen:</b> Figuren, Tiere, Möbel und Sachen mit dem Finger oder der Maus anfassen und woanders hinziehen.</li>
      <li>↔️ <b>Räume:</b> Mit ◀ ▶, den Raum-Knöpfen oder durch Ziehen auf einer leeren Stelle zum nächsten Zimmer.</li>
      <li>🚶 <b>Andere Orte:</b> Etwas oben auf einen Ort ziehen. Oder in die 🎒 Tasche stecken und später auspacken.</li>
      <li>✋ <b>In die Hand:</b> Sachen auf eine Figur ziehen. Essen in der Hand: Figur antippen zum Essen.</li>
      <li>🛋️ <b>Sitzen und Liegen:</b> Figur auf Sofa, Stuhl, Bett, Schaukel, Rutsche, Badewanne oder Dusche ziehen.</li>
      <li>📺 <b>Antippen:</b> Fernseher, Lampen, Radio, Dusche, Herd an/aus. Kühlschrank, Schränke und Kisten auf/zu.</li>
      <li>🍲 <b>Kochen und Backen:</b> 3 Zutaten auf den Herd (dann anschalten). 2 Backzutaten in den Ofen der Backstube.</li>
      <li>✨ <b>Figuren gestalten:</b> Figur antippen → „Anpassen“, oder 👤 Figuren. Besondere Sachen 🔒 gibt es im Friseur & Modeladen.</li>
      <li>🎨 <b>Einrichten:</b> Im Zuhause Tapete und Boden ändern. Möbel gibt es im Möbelhaus im Markt.</li>
      <li>⭐ <b>Sterne:</b> für 📋 Aufgaben, 🧠 Wissensfragen und jeden Tag ein 🎁 Tagesgeschenk. Echtes Geld gibt es hier nicht.</li>
    </ul>
    <div class="hinweis"><b>💾 Spielstand</b><br>Der Spielstand wird automatisch gespeichert. Zur Sicherheit kannst Du ihn als Datei sichern und später wieder laden.<br>
      <button onclick="spielstandSichern()">💾 Spielstand sichern</button>
      <label class="dateiknopf">📂 Sicherung laden (ersetzt den jetzigen Spielstand)<input type="file" accept=".json,application/json" onchange="spielstandLaden(this)"></label></div>`);
}
function spielstandSichern() {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([alsText()], {type:"application/json"}));
  a.download = "SoCla-Spielstand-" + heute() + ".json";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  sag("Die Sicherung ist gespeichert 💾");
}
function spielstandLaden(input) {
  const datei = input.files && input.files[0]; if (!datei) return;
  const leser = new FileReader();
  leser.onload = () => {
    try {
      const s = JSON.parse(leser.result);
      if (!s || s.version !== 3 || !s.orte) throw new Error("kein Spielstand");
      S = s; ergaenze(); speichern(); schliesse(); zeichne(); sag("Spielstand geladen! ✅");
    } catch (e) { sag("Diese Datei ist kein SoCla-Spielstand."); }
  };
  leser.readAsText(datei);
}

// ---------------------------------------------------------------- Start
document.addEventListener("wheel", e => {
  if (dialogOffen() || !e.target.closest("#szene")) return;
  e.preventDefault(); setzeBlick(S.blick[S.ort] + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * .08, false);
  clearTimeout(speicherTimer); speicherTimer = setTimeout(speichern, 600);
}, {passive:false});
(async function start() {
  passeAn();
  const neuStart = await laden();
  zeichne(); passeAn();
  window.addEventListener("resize", passeAn);
  if (!TABLET && location.protocol === "file:") warne("Bitte das Spiel über „SoCla starten“ öffnen – sonst wird nichts gespeichert.");
  if (TABLET) {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  if (neuStart) {
    speichern();
    oeffne(`<h2>🌈 Willkommen bei SoCla!</h2><p class="gross-text">Hier wohnen Anna, Mia, Leo und Baby Ben. In der Stadt gibt es eine neue Wohnung, einen Markt, einen Friseur, einen Park, eine Schule mit Kantine, ein Café, ein Krankenhaus, ein Schwimmbad mit Strand, einen Bauernhof und ein Kino mit Eisdiele.</p>
      <p class="gross-text">Du darfst alles anfassen, verschieben und ausprobieren! Zum Start bekommst Du <b>${START_STERNE} ⭐</b>.</p>
      <button class="bunt" onclick="schliesse()">Los geht's! 🚀</button> <button onclick="zeigeHilfe()">❓ Wie geht das?</button>`);
  } else if (S.tag !== heute()) {
    S.tag = heute(); S.sterne += TAGESGESCHENK; sorgeFuerUnordnung(2); speichern(); zeichne();
    oeffne(`<h2>🎁 Dein Tagesgeschenk!</h2><p class="gross-text">Schön, dass Du wieder da bist! Hier sind <b>${TAGESGESCHENK} ⭐</b> für Dich.</p>
      <button class="bunt" onclick="schliesse();ton('stern')">Danke! 😊</button>`);
  }
})();
