// SoCla – Daten: Dinge, Läden, Orte mit Räumen, Figuren-Baukasten, Aufgaben.
// Ansicht: leicht von oben. Die Wand reicht bis BODEN (in % der Bildhöhe), darunter liegt der Fußboden.
// Koordinaten: x in cqw innerhalb eines Ortes (jeder Raum ist 100 breit, Raum 2 beginnt bei 100),
// y in Prozent der Bildhöhe (Fußpunkt des Dings). Ein Raum ist 100 breit und HOEHE hoch (16:9).
"use strict";
const HOEHE = 56.25;
const BODEN = 40;          // ab hier (in %) beginnt der Fußboden
const DRAUSSEN_BODEN = 40;
const SCHOSS = .31;        // Anteil der Figurenhöhe vom Fuß bis zum Schoß (beim Sitzen)

// ---------------------------------------------------------------- Dinge
// art: essen, trinken, spielzeug, medizin, werkzeug, pflanze, unordnung, tier, moebel, geraet
// e = Emoji-Bild (kleine Sachen), sonst gezeichnet (grafik.js). b = Breite in cqw.
// sitz: Plätze [fx, fy, Haltung] als Anteil der Bildbreite/-höhe. Haltung "sitzt": fy = Sitzfläche;
//   "liegt": fy = Mitte der Liegefläche; "steht"/"tier": fy = Standfläche.
// flaeche: [fx von, fx bis, fy] = Ablage. fach: Behälter mit Plätzen; tuer = muss erst geöffnet werden.
// schalter = an/aus beim Antippen. fest = lässt sich nicht verschieben. wand = hängt an der Wand. boden = liegt flach.
const K = {
  // Essen
  apfel:{n:"Apfel",e:"🍎",art:"essen",preis:2}, banane:{n:"Banane",e:"🍌",art:"essen",preis:2},
  erdbeere:{n:"Erdbeeren",e:"🍓",art:"essen",preis:2,backzutat:1}, trauben:{n:"Trauben",e:"🍇",art:"essen",preis:3},
  wassermelone:{n:"Wassermelone",e:"🍉",art:"essen",preis:4},
  karotte:{n:"Karotte",e:"🥕",art:"essen",preis:1,zutat:1}, tomate:{n:"Tomate",e:"🍅",art:"essen",preis:1,zutat:1},
  zwiebel:{n:"Zwiebel",e:"🧅",art:"essen",preis:1,zutat:1}, kartoffel:{n:"Kartoffel",e:"🥔",art:"essen",preis:1,zutat:1},
  brokkoli:{n:"Brokkoli",e:"🥦",art:"essen",preis:1,zutat:1}, paprika:{n:"Paprika",e:"🫑",art:"essen",preis:1,zutat:1},
  kaese:{n:"Käse",e:"🧀",art:"essen",preis:3,zutat:1}, brot:{n:"Brot",e:"🍞",art:"essen",preis:3},
  toast:{n:"Toast",e:"🍞",art:"essen",preis:0,filter:"sepia(.6) brightness(.8) saturate(1.6)"},
  ei:{n:"Ei",e:"🥚",art:"essen",preis:2,backzutat:1}, mehl:{n:"Mehl",e:"🌾",art:"essen",preis:2,backzutat:1,nichtEssbar:1},
  butter:{n:"Butter",e:"🧈",art:"essen",preis:2,backzutat:1}, schoko:{n:"Schokolade",e:"🍫",art:"essen",preis:3,backzutat:1},
  pizza:{n:"Pizza",e:"🍕",art:"essen",preis:6}, suppe:{n:"Gemüsesuppe",e:"🍲",art:"essen",preis:3},
  nudeln:{n:"Nudeln",e:"🍝",art:"essen",preis:4}, kuchen:{n:"Kuchen",e:"🍰",art:"essen",preis:5},
  torte:{n:"Torte",e:"🎂",art:"essen",preis:12,b:5}, muffin:{n:"Muffin",e:"🧁",art:"essen",preis:4},
  keks:{n:"Kekse",e:"🍪",art:"essen",preis:2}, croissant:{n:"Croissant",e:"🥐",art:"essen",preis:3},
  donut:{n:"Donut",e:"🍩",art:"essen",preis:4}, eis:{n:"Eistüte",e:"🍦",art:"essen",preis:3},
  eisbecher:{n:"Eisbecher",e:"🍨",art:"essen",preis:5}, wassereis:{n:"Wassereis",e:"🍧",art:"essen",preis:2},
  waffel:{n:"Waffel",e:"🧇",art:"essen",preis:3},
  lolli:{n:"Lolli",e:"🍭",art:"essen",preis:2}, popcorn:{n:"Popcorn",e:"🍿",art:"essen",preis:3},
  taco:{n:"Taco",e:"🌮",art:"essen",preis:4}, sandwich:{n:"Sandwich",e:"🥪",art:"essen",preis:3},
  salat:{n:"Salat",e:"🥗",art:"essen",preis:3}, burger:{n:"Burger",e:"🍔",art:"essen",preis:4},
  fisch:{n:"Fisch",e:"🐟",art:"essen",preis:3,tierfutter:1}, knochen:{n:"Knochen",e:"🦴",art:"essen",preis:3,tierfutter:1,nichtEssbar:1},
  futter:{n:"Tierfutter",e:"🥫",art:"essen",preis:3,tierfutter:1,nichtEssbar:1},
  heu:{n:"Heu",e:"🌾",art:"essen",preis:1,tierfutter:1,nichtEssbar:1,filter:"hue-rotate(-15deg) saturate(1.3)"},
  // Trinken
  milch:{n:"Milch",e:"🥛",art:"trinken",preis:2,backzutat:1}, kakao:{n:"Kakao",e:"☕",art:"trinken",preis:3},
  saft:{n:"Saft",e:"🧃",art:"trinken",preis:2}, limonade:{n:"Limonade",e:"🥤",art:"trinken",preis:3},
  // Spielzeug und Sachen
  teddy:{n:"Teddy",e:"🧸",art:"spielzeug",preis:10}, puppe:{n:"Puppe",e:"🪆",art:"spielzeug",preis:8},
  robot:{n:"Roboter",e:"🤖",art:"spielzeug",preis:12}, ball:{n:"Ball",e:"⚽",art:"spielzeug",preis:5,ball:1},
  basketball:{n:"Basketball",e:"🏀",art:"spielzeug",preis:6,ball:1}, wasserball:{n:"Wasserball",e:"🏐",art:"spielzeug",preis:5,ball:1},
  wolle:{n:"Wollknäuel",e:"🧶",art:"spielzeug",preis:3}, drachen:{n:"Drachen",e:"🪁",art:"spielzeug",preis:8},
  ballon:{n:"Luftballon",e:"🎈",art:"spielzeug",preis:2}, wuerfel:{n:"Würfel",e:"🎲",art:"spielzeug",preis:2},
  malkasten:{n:"Malkasten",e:"🎨",art:"spielzeug",preis:6}, buch:{n:"Buch",e:"📕",art:"spielzeug",preis:4},
  gitarre:{n:"Gitarre",e:"🎸",art:"spielzeug",preis:20,b:5.5}, trompete:{n:"Trompete",e:"🎺",art:"spielzeug",preis:12},
  roller:{n:"Roller",e:"🛴",art:"spielzeug",preis:15,b:5.5}, globus:{n:"Globus",e:"🌍",art:"spielzeug",preis:8},
  glocke:{n:"Glocke",e:"🔔",art:"spielzeug",preis:5}, ranzen:{n:"Schulranzen",e:"🎒",art:"spielzeug",preis:8},
  stift:{n:"Stift",e:"✏️",art:"spielzeug",preis:1}, schwimmring:{n:"Schwimmring",e:"🛟",art:"spielzeug",preis:6},
  muschel:{n:"Muschel",e:"🐚",art:"spielzeug",preis:2},
  // Medizin
  pflaster:{n:"Pflaster",e:"🩹",art:"medizin",preis:2}, thermometer:{n:"Thermometer",e:"🌡️",art:"medizin",preis:4},
  stethoskop:{n:"Stethoskop",e:"🩺",art:"medizin",preis:6},
  // Garten
  eimer:{n:"Wassereimer",e:"🪣",art:"werkzeug",preis:4}, blume:{n:"Tulpe",e:"🌷",art:"pflanze",preis:3},
  sonnenblume:{n:"Sonnenblume",e:"🌻",art:"pflanze",preis:4}, rose:{n:"Rose",e:"🌹",art:"pflanze",preis:4},
  kaktus:{n:"Kaktus",e:"🌵",art:"pflanze",preis:5},
  // Unordnung (kommt in die Waschmaschine oder in die Mülltrennung)
  socke:{n:"Socke",e:"🧦",art:"unordnung"}, shirt:{n:"T-Shirt",e:"👕",art:"unordnung"},
  hose:{n:"Hose",e:"👖",art:"unordnung"}, schuh:{n:"Turnschuh",e:"👟",art:"unordnung"},
  // Tiere
  katze:{n:"Katze",der:"Die",e:"🐈",art:"tier",preis:40,b:7}, hund:{n:"Hund",der:"Der",e:"🐕",art:"tier",preis:45,b:8},
  hase:{n:"Hase",der:"Der",e:"🐇",art:"tier",preis:30,b:6}, hamster:{n:"Hamster",der:"Der",e:"🐹",art:"tier",preis:20,b:4.5},
  igel:{n:"Igel",der:"Der",e:"🦔",art:"tier",preis:30,b:5.5}, schildkroete:{n:"Schildkröte",der:"Die",e:"🐢",art:"tier",preis:25,b:6},
  papagei:{n:"Papagei",der:"Der",e:"🦜",art:"tier",preis:35,b:5.5}, kueken:{n:"Küken",der:"Das",e:"🐥",art:"tier",preis:15,b:4},
  pinguin:{n:"Pinguin",der:"Der",e:"🐧",art:"tier",preis:50,b:6.5}, einhorn:{n:"Einhorn",der:"Das",e:"🦄",art:"tier",preis:150,b:10},
  kuh:{n:"Kuh",der:"Die",e:"🐄",art:"tier",b:13,hof:1}, schwein:{n:"Schwein",der:"Das",e:"🐖",art:"tier",b:9,hof:1},
  schaf:{n:"Schaf",der:"Das",e:"🐑",art:"tier",b:8,hof:1}, huhn:{n:"Huhn",der:"Das",e:"🐔",art:"tier",b:5,hof:1},
  pferd:{n:"Pferd",der:"Das",e:"🐎",art:"tier",b:13,hof:1}, krabbe:{n:"Krabbe",der:"Die",e:"🦀",art:"tier",b:5,hof:1},
  ente:{n:"Ente",der:"Die",e:"🦆",art:"tier",b:5,hof:1},

  // Möbel und Geräte (gezeichnet)
  kuehlschrank:{n:"Kühlschrank",art:"geraet",b:10.5,preis:40,fach:{tuer:1,plaetze:[[.3,.3],[.7,.3],[.3,.58],[.7,.58],[.3,.86],[.7,.86]]}},
  herd:{n:"Herd",art:"geraet",b:13,preis:40,schalter:1},
  spuele:{n:"Spüle",art:"geraet",b:16,preis:30,schalter:1,flaeche:[.04,.42,.24]},
  toaster:{n:"Toaster",art:"geraet",b:5.5,preis:12},
  muelleimer:{n:"Mülleimer",art:"geraet",b:5.5,preis:8},
  tisch:{n:"Tisch",art:"moebel",b:22,preis:20,flaeche:[.05,.95,.22],farbe:"#e8b98c"},
  couchtisch:{n:"Couchtisch",art:"moebel",b:15,preis:15,flaeche:[.08,.92,.3],farbe:"#f3d7b0"},
  stuhl:{n:"Stuhl",art:"moebel",b:8,preis:10,sitz:[[.5,.52,"sitzt"]],farbe:"#f2b880"},
  sofa:{n:"Sofa",art:"moebel",b:30,preis:45,sitz:[[.25,.56,"sitzt"],[.5,.56,"sitzt"],[.75,.56,"sitzt"]],farbe:"#ff9fc4"},
  sessel:{n:"Sessel",art:"moebel",b:14,preis:25,sitz:[[.5,.58,"sitzt"]],farbe:"#b79cff"},
  sitzsack:{n:"Sitzsack",art:"moebel",b:10,preis:15,sitz:[[.5,.5,"sitzt"]],farbe:"#ffd86b"},
  fernseher:{n:"Fernseher",art:"geraet",b:17,preis:40,schalter:1},
  stehlampe:{n:"Stehlampe",art:"geraet",b:6,preis:15,schalter:1},
  tischlampe:{n:"Tischlampe",art:"geraet",b:4.5,preis:10,schalter:1},
  teppich:{n:"Teppich",art:"moebel",b:36,preis:20,boden:1,farbe:"#9fc8ff"},
  bild:{n:"Bild",art:"moebel",b:11,preis:12,wand:1,motiv:"berge"},
  poster:{n:"Poster",art:"moebel",b:9,preis:8,wand:1,motiv:"regenbogen"},
  uhr:{n:"Uhr",art:"moebel",b:6,preis:10,wand:1},
  wandregal:{n:"Wandregal",art:"moebel",b:16,preis:12,wand:1,fach:{plaetze:[[.2,.5],[.5,.5],[.8,.5]]}},
  girlande:{n:"Wimpelkette",art:"moebel",b:26,preis:8,wand:1},
  lichterkette:{n:"Lichterkette",art:"geraet",b:26,preis:12,wand:1,schalter:1},
  haengepflanze:{n:"Hängepflanze",art:"pflanze",b:7,preis:10,wand:1},
  pflanze:{n:"Zimmerpflanze",art:"pflanze",b:8,preis:10},
  radio:{n:"Radio",art:"geraet",b:7,preis:15,schalter:1},
  buecherregal:{n:"Bücherregal",art:"moebel",b:14,preis:25,fach:{plaetze:[[.72,.29],[.72,.6],[.3,.91],[.72,.91]]},farbe:"#e8b98c"},
  bett:{n:"Bett",art:"moebel",b:32,preis:45,sitz:[[.64,.38,"liegt"]],vorne:1,farbe:"#9fc8ff"},
  spielzeugkiste:{n:"Spielzeugkiste",art:"moebel",b:12,preis:15,fach:{tuer:1,plaetze:[[.2,.36],[.4,.36],[.6,.36],[.8,.36]]},farbe:"#ffb86b"},
  schreibtisch:{n:"Schreibtisch",art:"moebel",b:22,preis:25,flaeche:[.04,.96,.2],farbe:"#f6d2a8"},
  kommode:{n:"Kommode",art:"moebel",b:15,preis:20,flaeche:[.05,.95,.14],farbe:"#ffffff"},
  kleiderschrank:{n:"Kleiderschrank",art:"moebel",b:16,preis:35,fach:{tuer:1,plaetze:[[.3,.52],[.7,.52],[.3,.93],[.7,.93]]},farbe:"#fbe6cc"},
  badewanne:{n:"Badewanne",art:"geraet",b:30,preis:45,schalter:1,sitz:[[.5,.72,"sitzt"]],vorne:1},
  dusche:{n:"Dusche",art:"geraet",b:13,preis:40,schalter:1,sitz:[[.5,.96,"steht"]],vorne:1},
  toilette:{n:"Toilette",art:"geraet",b:9,preis:25,sitz:[[.5,.58,"sitzt"]]},
  waschbecken:{n:"Waschbecken",art:"geraet",b:10,preis:20,schalter:1},
  spiegel:{n:"Spiegel",art:"moebel",b:8,preis:12,wand:1},
  waschmaschine:{n:"Waschmaschine",art:"geraet",b:11,preis:35},
  aquarium:{n:"Aquarium",art:"moebel",b:14,preis:35},
  tierkorb:{n:"Tierkörbchen",art:"moebel",b:11,preis:10,sitz:[[.5,.6,"tier"]],farbe:"#ff9f9f"},
  kratzbaum:{n:"Kratzbaum",art:"moebel",b:10,preis:15,sitz:[[.5,.1,"tier"]]},
  // feste Einrichtung (lässt sich nicht verschieben)
  regal:{n:"Regal",art:"moebel",b:14,fest:1},
  kasse:{n:"Kasse",art:"moebel",b:20,fest:1},
  einkaufswagen:{n:"Einkaufswagen",art:"moebel",b:11,preis:15,fach:{plaetze:[[.3,.36],[.55,.36],[.8,.36]]}},
  friseurstuhl:{n:"Friseurstuhl",art:"moebel",b:11,preis:25,sitz:[[.5,.5,"sitzt"]],farbe:"#ff8fbf"},
  kleiderstange:{n:"Kleiderstange",art:"moebel",b:22,fest:1},
  baum:{n:"Baum",art:"pflanze",b:24,preis:30},
  busch:{n:"Busch",art:"pflanze",b:12,preis:8},
  schaukel:{n:"Schaukel",art:"moebel",b:20,preis:30,sitz:[[.5,.8,"sitzt"]]},
  rutsche:{n:"Rutsche",art:"moebel",b:28,preis:40,sitz:[[.2,.25,"sitzt"]]},
  sandkasten:{n:"Sandkasten",art:"moebel",b:24,preis:20,boden:1},
  bank:{n:"Bank",art:"moebel",b:20,preis:15,sitz:[[.3,.52,"sitzt"],[.7,.52,"sitzt"]],farbe:"#7fbfe6"},
  blumenbeet:{n:"Blumenbeet",art:"pflanze",b:22,preis:10,boden:1},
  teich:{n:"Teich",art:"moebel",b:30,fest:1,boden:1},
  adoption:{n:"Tierheim-Schalter",art:"moebel",b:24,fest:1},
  tafel:{n:"Tafel",art:"moebel",b:36,fest:1,wand:1},
  schulpult:{n:"Schulpult",art:"moebel",b:14,preis:15,flaeche:[.04,.96,.2]},
  lehrerpult:{n:"Lehrerpult",art:"moebel",b:22,preis:20,flaeche:[.04,.96,.2],farbe:"#d9a774"},
  basketballkorb:{n:"Basketballkorb",art:"moebel",b:11,preis:25},
  huepfekaestchen:{n:"Hüpfekästchen",art:"moebel",b:30,fest:1,boden:1},
  essensausgabe:{n:"Essensausgabe",art:"moebel",b:38,fest:1,flaeche:[.03,.97,.4]},
  kantinentisch:{n:"Langer Tisch",art:"moebel",b:30,preis:20,flaeche:[.03,.97,.25]},
  kantinenbank:{n:"Lange Bank",art:"moebel",b:28,preis:15,sitz:[[.2,.4,"sitzt"],[.5,.4,"sitzt"],[.8,.4,"sitzt"]]},
  muelltrennung:{n:"Mülltrennung",art:"geraet",b:13,preis:15},
  getraenkeautomat:{n:"Getränkeautomat",art:"geraet",b:9,preis:30},
  theke:{n:"Café-Theke",art:"moebel",b:32,fest:1,flaeche:[.03,.97,.12]},
  kaffeemaschine:{n:"Kakaomaschine",art:"geraet",b:6.5,preis:20},
  cafetisch:{n:"Bistrotisch",art:"moebel",b:11,preis:15,flaeche:[.08,.92,.12]},
  vitrine:{n:"Kuchenvitrine",art:"moebel",b:15,preis:30,fach:{plaetze:[[.3,.36],[.7,.36],[.3,.67],[.7,.67]]}},
  ofen:{n:"Backofen",art:"geraet",b:13,preis:40},
  arbeitsplatte:{n:"Arbeitsplatte",art:"moebel",b:26,preis:25,flaeche:[.03,.97,.17]},
  krankenbett:{n:"Krankenbett",art:"moebel",b:32,preis:40,sitz:[[.64,.38,"liegt"]],vorne:1},
  arztschrank:{n:"Arztschrank",art:"moebel",b:12,preis:25,fach:{tuer:1,plaetze:[[.3,.38],[.7,.38],[.3,.76],[.7,.76]]}},
  rollstuhl:{n:"Rollstuhl",art:"moebel",b:11,preis:25,sitz:[[.45,.53,"sitzt"]]},
  roentgen:{n:"Röntgengerät",art:"geraet",b:17,fest:1,sitz:[[.5,.97,"steht"]],vorne:1},
  behandlungstisch:{n:"Behandlungstisch",art:"moebel",b:19,preis:30,sitz:[[.5,.3,"tier"]]},
  becken:{n:"Schwimmbecken",art:"moebel",b:62,fest:1,sitz:[[.17,.93,"steht"],[.35,.93,"steht"],[.53,.93,"steht"],[.71,.93,"steht"],[.87,.93,"steht"]],vorne:1},
  sprungbrett:{n:"Sprungbrett",art:"moebel",b:16,fest:1,sitz:[[.88,.2,"steht"]]},
  liegestuhl:{n:"Liegestuhl",art:"moebel",b:16,preis:15,sitz:[[.55,.42,"liegt"]],farbe:"#ff8f8f"},
  sonnenschirm:{n:"Sonnenschirm",art:"moebel",b:16,preis:12,farbe:"#ff8f8f"},
  sandburg:{n:"Sandburg",art:"moebel",b:12,preis:5},
  traktor:{n:"Traktor",art:"geraet",b:24,preis:80,sitz:[[.4,.42,"sitzt"]]},
  heuballen:{n:"Heuballen",art:"moebel",b:12,preis:5,sitz:[[.5,.3,"sitzt"]]},
  zaun:{n:"Zaun",art:"moebel",b:28,preis:8},
  futtertrog:{n:"Futtertrog",art:"moebel",b:16,preis:10},
  huehnerstall:{n:"Hühnerstall",art:"moebel",b:13,fest:1},
  eistheke:{n:"Eistheke",art:"moebel",b:30,fest:1,flaeche:[.03,.97,.3]},
  leinwand:{n:"Kinoleinwand",art:"moebel",b:56,fest:1,wand:1},
  kinositz:{n:"Kinosessel",art:"moebel",b:14,preis:20,sitz:[[.27,.48,"sitzt"],[.73,.48,"sitzt"]],farbe:"#e5566a"},
  popcornstand:{n:"Popcornstand",art:"moebel",b:13,fest:1}
};
const FARBEN_MOEBEL = [["rosa","#ff9fc4"],["blau","#9fc8ff"],["grün","#9fdcaa"],["gelb","#ffd86b"],["lila","#c3a8ff"],["grau","#c3c7d2"]];
const MOTIVE = [["berge","Berge"],["blume","Blume"],["meer","Meer"],["regenbogen","Regenbogen"],["katze","Katze"],["sterne","Sterne"],["eis","Eis"],["herz","Herz"]];

// ---------------------------------------------------------------- Läden
// Ware: "typ" oder [typ, {Eigenschaften}, Namenszusatz]
const farbig = typ => FARBEN_MOEBEL.map(([n, c]) => [typ, {farbe:c}, n]);
const LAEDEN = {
  obst:{n:"🍎 Obst & Gemüse", waren:["apfel","banane","erdbeere","trauben","wassermelone","karotte","tomate","zwiebel","kartoffel","brokkoli","paprika"]},
  backwaren:{n:"🥐 Brot & Süßes", waren:["brot","croissant","keks","donut","muffin","kuchen","lolli","popcorn","schoko"]},
  kuehl:{n:"🥛 Kühlregal & Backen", waren:["milch","kaese","butter","ei","mehl","saft","limonade","eis","pizza","nudeln"]},
  tier:{n:"🐾 Tierbedarf", waren:["futter","fisch","knochen","heu","wolle","ball"]},
  spiel:{n:"🧸 Spielzeug", waren:["teddy","puppe","robot","ball","basketball","wasserball","schwimmring","drachen","ballon","wuerfel","malkasten","buch","stift","ranzen","gitarre","trompete","roller","globus"]},
  garten:{n:"🌷 Garten", waren:["blume","sonnenblume","rose","kaktus","pflanze","haengepflanze","eimer"]},
  moebel:{n:"🛋️ Möbel", waren:[...farbig("sofa"), ...farbig("sessel"), ...farbig("sitzsack"), ...farbig("bett"), "tisch","couchtisch","stuhl","kommode","kleiderschrank","buecherregal","schreibtisch","spielzeugkiste"]},
  deko:{n:"🖼️ Deko", waren:[...farbig("teppich"), ...MOTIVE.map(([m, n]) => ["bild", {motiv:m}, n]), ...MOTIVE.map(([m, n]) => ["poster", {motiv:m}, n]),
    "wandregal","girlande","lichterkette","uhr","spiegel","stehlampe","tischlampe","pflanze","haengepflanze","aquarium", ...farbig("tierkorb"),"kratzbaum"]},
  technik:{n:"📺 Technik & Küche", waren:["fernseher","radio","toaster","kuehlschrank","herd","spuele","kaffeemaschine","ofen","muelleimer","getraenkeautomat"]},
  bad:{n:"🛁 Bad", waren:["badewanne","dusche","toilette","waschbecken","waschmaschine"]},
  draussen:{n:"🌳 Draußen", waren:["baum","busch","schaukel","rutsche","sandkasten","blumenbeet","basketballkorb", ...farbig("bank"), ...farbig("liegestuhl"), ...farbig("sonnenschirm"),"heuballen","zaun"]},
  cafe:{n:"☕ Café", waren:["kakao","saft","limonade","kuchen","torte","muffin","croissant","donut","eis","keks"]},
  eis:{n:"🍦 Eisdiele", waren:["eis","eisbecher","wassereis","waffel","limonade","milch"]},
  kino:{n:"🍿 Kino-Snacks", waren:["popcorn","limonade","lolli","schoko","taco"]},
  kantine:{n:"🍽️ Kantine", waren:["sandwich","salat","burger","nudeln","pizza","suppe","apfel","milch","saft"]}
};

// ---------------------------------------------------------------- Tapeten und Böden (Zimmer einrichten)
const svgMuster = (inhalt, w, h, grund) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>${grund ? `<rect width='100%' height='100%' fill='${grund}'/>` : ""}${inhalt}</svg>`)}")`;
const TAPETEN = {
  weiss:["Weiß","#fbf6ef",0],
  creme:["Creme","#fff1da",0],
  rosa_punkte:["Rosa Punkte",`radial-gradient(circle at 1.5cqw 1.5cqw,#ffc9de .4cqw,transparent .5cqw) 0 0/3cqw 3cqw,#ffeef4`,0],
  blau_streifen:["Blaue Streifen","repeating-linear-gradient(90deg,#e6f1fb 0 3cqw,#d8e9f8 3cqw 6cqw)",0],
  gruen_karo:["Grünes Karo","repeating-linear-gradient(0deg,#e2f4e4 0 2.5cqw,transparent 2.5cqw 5cqw),repeating-linear-gradient(90deg,#d6efda 0 2.5cqw,#ecf8ee 2.5cqw 5cqw)",0],
  gelb:["Sonnengelb","#fff3c9",0],
  lila_streifen:["Lila Streifen","repeating-linear-gradient(90deg,#f1e6fb 0 3cqw,#e8d8f8 3cqw 6cqw)",0],
  rosa_streifen:["Rosa-Mint","repeating-linear-gradient(90deg,#ffe7ef 0 2.5cqw,#e3f6ee 2.5cqw 5cqw)",0],
  fliesen:["Fliesen","linear-gradient(#0000 92%,#d7e8ee 0) 0 0/4cqw 4cqw,linear-gradient(90deg,#0000 92%,#d7e8ee 0) 0 0/4cqw 4cqw,#f4fbfd",0],
  kueche:["Küchenfliesen","linear-gradient(#0000 92%,#ecd9a0 0) 0 0/3cqw 3cqw,linear-gradient(90deg,#0000 92%,#ecd9a0 0) 0 0/3cqw 3cqw,#fff3c9",0],
  kantine:["Kantine","linear-gradient(#fdf6e8 0 50%,transparent 50%),linear-gradient(#0000 90%,#e7c95a 0) 0 0/3cqw 3cqw,linear-gradient(90deg,#0000 90%,#e7c95a 0) 0 0/3cqw 3cqw,#ffdf6b",0],
  pool:["Schwimmbad","linear-gradient(#0000 92%,#b9e2f0 0) 0 0/3cqw 3cqw,linear-gradient(90deg,#0000 92%,#b9e2f0 0) 0 0/3cqw 3cqw,#e2f5fb",0],
  scheune:["Scheune","repeating-linear-gradient(90deg,#d98a6a 0 5cqw,#cc7c5c 5cqw 5.3cqw)",0],
  kino:["Kino","repeating-linear-gradient(90deg,#6b2f4f 0 4cqw,#5e2846 4cqw 8cqw)",0],
  mint:["Mint","#e3f6f0",0],
  cafe:["Café-Streifen","repeating-linear-gradient(90deg,#fbe9d6 0 2cqw,#f6ddc2 2cqw 4cqw)",0],
  sterne:["Sternenhimmel",svgMuster("<text x='6' y='18' font-size='14' fill='#ffe680'>★</text><text x='28' y='42' font-size='9' fill='#fff'>★</text>",48,48,"#4a5794"),20],
  herzen:["Herzen",svgMuster("<text x='8' y='22' font-size='16' fill='#ff9fc7'>♥</text><text x='32' y='46' font-size='12' fill='#ffbfd9'>♥</text>",52,52,"#fff2f7"),20],
  blumen:["Blumen",svgMuster("<text x='4' y='24' font-size='18'>🌼</text><text x='32' y='52' font-size='14'>🌸</text>",58,58,"#f3fff1"),25],
  regenbogen:["Regenbogen","linear-gradient(#ffd9d9,#ffebcc,#fffacc,#dcf7cf,#d3eaff,#e8daff)",30],
  holz:["Holzwand","repeating-linear-gradient(90deg,#f0cfa6 0 6cqw,#e6c193 6cqw 6.3cqw)",15]
};
const BOEDEN = {
  holz:["Holz","repeating-linear-gradient(90deg,#efc394 0 6cqw,#e3b383 6cqw 6.25cqw)",0],
  holz_dunkel:["Dunkles Holz","repeating-linear-gradient(90deg,#c08a5e 0 6cqw,#ad7a50 6cqw 6.25cqw)",0],
  fliesen_schach:["Schachbrett","conic-gradient(#fff 25%,#d9e1ee 0 50%,#fff 0 75%,#d9e1ee 0) 0 0/8cqw 8cqw",0],
  fliesen_blau:["Blaue Fliesen","conic-gradient(#e6f3ff 25%,#d0e7fb 0 50%,#e6f3ff 0 75%,#d0e7fb 0) 0 0/7cqw 7cqw",0],
  fliesen_rosa:["Rosa Fliesen","conic-gradient(#fff 25%,#ffd9e8 0 50%,#fff 0 75%,#ffd9e8 0) 0 0/8cqw 8cqw",0],
  fliesen_pool:["Badfliesen","linear-gradient(#0000 92%,#cfe6ee 0) 0 0/5cqw 5cqw,linear-gradient(90deg,#0000 92%,#cfe6ee 0) 0 0/5cqw 5cqw,#f6fbfd",0],
  teppich_beige:["Teppich Beige","#ecdfcb",0],
  teppich_rosa:["Teppich Rosa","#f8cfe0",15],
  teppich_lila:["Teppich Lila","#d6c6f3",15],
  teppich_rot:["Kinoteppich",svgMuster("<circle cx='10' cy='10' r='2' fill='#f3c95b'/>",20,20,"#8a2f45"),0],
  parkett:["Parkett","repeating-linear-gradient(45deg,#e8bb8a 0 3cqw,#dcaa78 3cqw 6cqw)",20],
  marmor:["Marmor","linear-gradient(135deg,#f5f5f8,#e6e6ee 40%,#f8f8fb 60%,#e9e9f0)",25],
  stroh:["Stroh",svgMuster("<path d='M2 6 L14 3 M8 16 L22 12 M18 24 L30 21 M4 26 L12 28' stroke='#d9ae4a' stroke-width='1.5'/>",32,32,"#f2d47e"),0],
  gras:["Gras","radial-gradient(circle at 2cqw 2cqw,#86d37a .5cqw,transparent .6cqw) 0 0/5cqw 5cqw,#9de08b",0],
  sand:["Sand","radial-gradient(circle at 2cqw 2cqw,#ecd39a .35cqw,transparent .45cqw) 0 0/4cqw 4cqw,#f7e3b2",0],
  asphalt:["Schulhof","radial-gradient(circle at 1cqw 1cqw,#c3c6cf .2cqw,transparent .3cqw) 0 0/3cqw 3cqw,#d6d9e0",0]
};

// ---------------------------------------------------------------- Orte und Räume
// dinge: [typ, x im Raum, y, {Eigenschaften}]. inhalt = Sachen im Behälter, auf = Sachen auf der Ablage.
// Räume: draussen = Himmel und Gras; strand = Himmel, Meer und Sand.
const ORTE = [
  {id:"haus", n:"Zuhause", k:"Zuhause", e:"🏠", einrichten:1, raeume:[
    {n:"Küche", wand:"kueche", boden:"fliesen_schach", fenster:[76], dinge:[
      ["kuehlschrank",8,50,{inhalt:["milch","kaese","tomate","karotte","ei","apfel"]}], ["herd",24,52], ["spuele",43,52,{auf:["toaster"]}],
      ["wandregal",43,22,{inhalt:["kakao","apfel","brot"]}], ["pflanze",58,50], ["uhr",60,16],
      ["stuhl",62,70], ["stuhl",82,70], ["tisch",72,84,{auf:["banane","saft","brot"]}], ["muelleimer",94,56], ["katze",30,92]]},
    {n:"Wohnzimmer", wand:"blau_streifen", boden:"holz", fenster:[18], dinge:[
      ["teppich",52,94,{farbe:"#ffc9de"}], ["sofa",52,62,{farbe:"#ffd86b"}], ["couchtisch",50,84,{auf:["popcorn","kakao"]}], ["sessel",84,76,{farbe:"#9fdcaa"}],
      ["fernseher",14,60], ["stehlampe",95,52], ["bild",52,24,{motiv:"regenbogen"}], ["poster",82,24,{motiv:"blume"}], ["pflanze",32,52], ["kommode",82,52,{auf:["radio"]}],
      ["haengepflanze",34,14], ["lichterkette",52,6]]},
    {n:"Kinderzimmer", wand:"rosa_punkte", boden:"teppich_beige", fenster:[74], dinge:[
      ["bett",20,64,{farbe:"#c3a8ff"}], ["kleiderschrank",45,50], ["spielzeugkiste",60,66,{inhalt:["ball","puppe","wuerfel"]}],
      ["schreibtisch",84,58,{auf:["buch","tischlampe"]}], ["stuhl",96,64], ["bild",20,22,{motiv:"katze"}], ["poster",60,22,{motiv:"sterne"}],
      ["sitzsack",30,90,{farbe:"#9fdcaa"}], ["teppich",58,94,{farbe:"#9fc8ff"}], ["teddy",46,92], ["socke",70,96], ["shirt",86,90], ["girlande",34,6]]},
    {n:"Bad", wand:"fliesen", boden:"fliesen_blau", fenster:[], dinge:[
      ["waschmaschine",8,52], ["dusche",24,52], ["badewanne",52,74], ["toilette",74,54], ["waschbecken",90,54], ["spiegel",90,26],
      ["haengepflanze",42,12], ["pflanze",62,52], ["wandregal",62,24,{inhalt:["schwimmring"]}]]}
  ]},
  {id:"wohnung", n:"Neue Wohnung", k:"Wohnung", e:"🗝️", einrichten:1, raeume:[
    {n:"Wohnküche", wand:"creme", boden:"holz_dunkel", fenster:[50], dinge:[
      ["spuele",14,52], ["kuehlschrank",30,50,{inhalt:["milch","apfel"]}], ["tisch",68,84], ["stuhl",60,70], ["stuhl",78,70], ["pflanze",92,52]]},
    {n:"Schlafzimmer", wand:"weiss", boden:"teppich_beige", fenster:[70], dinge:[
      ["bett",30,66,{farbe:"#ffd86b"}], ["kommode",72,52], ["stehlampe",92,52]]},
    {n:"Badezimmer", wand:"fliesen", boden:"fliesen_blau", fenster:[], dinge:[
      ["dusche",18,52], ["toilette",44,54], ["waschbecken",66,54], ["spiegel",66,26]]}
  ]},
  {id:"markt", n:"Markt", k:"Markt", e:"🛒", raeume:[
    {n:"Lebensmittel", wand:"creme", boden:"fliesen_schach", fenster:[], dinge:[
      ["regal",10,54,{laden:"obst"}], ["regal",26,54,{laden:"backwaren"}], ["regal",42,54,{laden:"kuehl"}], ["regal",58,54,{laden:"tier"}],
      ["regal",74,54,{laden:"spiel"}], ["regal",90,54,{laden:"garten"}], ["kasse",80,92,{laden:"obst"}], ["einkaufswagen",22,90], ["pflanze",50,94]]},
    {n:"Möbelhaus", wand:"weiss", boden:"parkett", fenster:[50], dinge:[
      ["regal",12,54,{laden:"moebel"}], ["regal",30,54,{laden:"deko"}], ["regal",70,54,{laden:"technik"}], ["regal",88,54,{laden:"bad"}],
      ["kasse",50,92,{laden:"draussen"}], ["teppich",50,80,{farbe:"#c3a8ff"}], ["pflanze",50,52]]}
  ]},
  {id:"mode", n:"Friseur & Mode", k:"Mode", e:"💇", raeume:[
    {n:"Friseur", wand:"lila_streifen", boden:"fliesen_rosa", fenster:[], dinge:[
      ["spiegel",22,26], ["friseurstuhl",22,66], ["spiegel",52,26], ["friseurstuhl",52,66,{farbe:"#9fc8ff"}], ["waschbecken",82,54], ["pflanze",95,52],
      ["poster",82,24,{motiv:"herz"}], ["girlande",37,6]]},
    {n:"Modeladen", wand:"herzen", boden:"holz", fenster:[], dinge:[
      ["kleiderstange",22,56,{variante:0}], ["kleiderstange",76,56,{variante:1}], ["spiegel",48,26], ["teppich",48,92,{farbe:"#ffc9de"}],
      ["sessel",48,82,{farbe:"#ff9fc4"}], ["pflanze",96,52], ["pflanze",4,52]]}
  ]},
  {id:"park", n:"Park & Tierheim", k:"Park", e:"🌳", raeume:[
    {n:"Spielplatz", draussen:1, dinge:[["baum",10,64], ["schaukel",34,66], ["rutsche",68,68], ["sandkasten",44,92], ["ball",88,92], ["busch",92,56]]},
    {n:"Wiese", draussen:1, dinge:[["teich",30,86], ["blumenbeet",68,94], ["baum",84,62], ["bank",56,64], ["eimer",80,98], ["blume",8,90], ["busch",12,56], ["ente",36,80]]},
    {n:"Tierheim", wand:"gruen_karo", boden:"holz", fenster:[20], dinge:[
      ["adoption",64,62], ["tierkorb",18,90,{farbe:"#ff9f9f"}], ["kratzbaum",36,56], ["futter",50,92], ["poster",42,22,{motiv:"katze"}], ["pflanze",92,52]]}
  ]},
  {id:"schule", n:"Schule", k:"Schule", e:"🏫", raeume:[
    {n:"Klassenzimmer", wand:"creme", boden:"holz", fenster:[90], dinge:[
      ["tafel",50,34], ["lehrerpult",14,60,{auf:["globus","glocke"]}], ["stuhl",40,72], ["schulpult",40,84,{auf:["stift"]}],
      ["stuhl",64,72], ["schulpult",64,84,{auf:["buch"]}], ["stuhl",88,72], ["schulpult",88,84], ["ranzen",8,94], ["poster",14,22,{motiv:"sterne"}], ["pflanze",76,52]]},
    {n:"Kantine", wand:"kantine", boden:"fliesen_blau", fenster:[], dinge:[
      ["getraenkeautomat",9,52], ["muelltrennung",24,56], ["essensausgabe",66,58,{laden:"kantine"}], ["bild",30,22,{motiv:"eis"}],
      ["kantinenbank",44,66], ["kantinentisch",44,92,{auf:["apfel","milch"]}], ["pflanze",96,52]]},
    {n:"Pausenhof", draussen:1, boden:"asphalt", dinge:[["baum",16,62], ["huepfekaestchen",40,94], ["bank",42,62], ["basketballkorb",80,66], ["basketball",68,94]]}
  ]},
  {id:"cafe", n:"Café", k:"Café", e:"☕", raeume:[
    {n:"Café", wand:"cafe", boden:"fliesen_schach", fenster:[88], dinge:[
      ["theke",22,62,{laden:"cafe", auf:["kaffeemaschine"]}], ["vitrine",50,52,{inhalt:["kuchen","muffin","croissant","donut"]}],
      ["stuhl",70,72], ["stuhl",90,72], ["cafetisch",80,86,{auf:["kakao"]}], ["pflanze",62,52], ["bild",50,20,{motiv:"blume"}], ["lichterkette",22,6]]},
    {n:"Backstube", wand:"fliesen", boden:"fliesen_schach", fenster:[50], dinge:[
      ["ofen",14,52], ["arbeitsplatte",50,64,{auf:["mehl","ei","milch","schoko"]}], ["kuehlschrank",88,50,{inhalt:["butter","milch","ei","erdbeere"]}],
      ["wandregal",50,22,{inhalt:["keks","croissant"]}]]}
  ]},
  {id:"klinik", n:"Krankenhaus & Tierarzt", k:"Klinik", e:"🏥", raeume:[
    {n:"Krankenhaus", wand:"mint", boden:"fliesen_blau", fenster:[44], dinge:[
      ["krankenbett",22,68], ["arztschrank",52,50,{inhalt:["pflaster","pflaster","thermometer","stethoskop"]}], ["roentgen",74,56],
      ["rollstuhl",92,80], ["pflanze",62,52], ["poster",92,22,{motiv:"herz"}]]},
    {n:"Tierarzt", wand:"mint", boden:"marmor", fenster:[80], dinge:[
      ["arztschrank",12,50,{inhalt:["pflaster","thermometer","stethoskop"]}], ["behandlungstisch",42,72], ["tierkorb",72,90,{farbe:"#9fc8ff"}],
      ["futter",86,92], ["poster",42,22,{motiv:"katze"}], ["hamster",44,62]]}
  ]},
  {id:"baden", n:"Schwimmbad & Strand", k:"Baden", e:"🏊", raeume:[
    {n:"Schwimmbad", wand:"pool", boden:"fliesen_pool", fenster:[20, 80], dinge:[
      ["becken",50,94], ["sprungbrett",14,66], ["dusche",94,52], ["liegestuhl",88,96,{farbe:"#7fbfe6"}], ["schwimmring",40,56], ["wasserball",62,56], ["pflanze",4,52]]},
    {n:"Strand", strand:1, boden:"sand", dinge:[
      ["sonnenschirm",28,70,{farbe:"#ff8f8f"}], ["liegestuhl",30,84,{farbe:"#ffd86b"}], ["sandburg",62,86], ["eimer",70,92], ["muschel",80,96],
      ["krabbe",88,88], ["wasserball",50,96], ["liegestuhl",80,70,{farbe:"#9fdcaa"}]]}
  ]},
  {id:"hof", n:"Bauernhof", k:"Bauernhof", e:"🚜", raeume:[
    {n:"Hof", draussen:1, dinge:[["zaun",24,56], ["zaun",66,56], ["baum",86,60], ["traktor",30,80], ["heuballen",64,72], ["heuballen",74,84], ["huhn",54,96], ["pferd",86,92]]},
    {n:"Stall", wand:"scheune", boden:"stroh", fenster:[50], dinge:[
      ["huehnerstall",84,56], ["futtertrog",44,74], ["kuh",18,76], ["schwein",56,92], ["schaf",70,78], ["huhn",88,90], ["heuballen",10,94], ["heu",30,96]]}
  ]},
  {id:"kino", n:"Kino & Eisdiele", k:"Kino", e:"🎬", raeume:[
    {n:"Eisdiele", wand:"rosa_streifen", boden:"fliesen_rosa", fenster:[86], dinge:[
      ["eistheke",30,62,{laden:"eis"}], ["stuhl",62,72], ["stuhl",80,72], ["cafetisch",71,86,{auf:["eisbecher"]}], ["poster",62,22,{motiv:"eis"}],
      ["pflanze",96,52], ["girlande",30,6]]},
    {n:"Kinosaal", wand:"kino", boden:"teppich_rot", fenster:[], dinge:[
      ["leinwand",54,36], ["popcornstand",9,56,{laden:"kino"}], ["kinositz",32,74], ["kinositz",54,74], ["kinositz",76,74],
      ["kinositz",32,92], ["kinositz",54,92], ["kinositz",76,92]]}
  ]}
];
// Figuren beim Spielstart: [Ort, Raum, x, y, Figur]
const START_FIGUREN = [
  ["haus",0,46,94,{name:"Anna", groesse:"erwachsen", haut:2, frisur:"pferd", haarfarbe:"#5a3a22", oberteil:"jacke", obenfarbe:"#2ad4c8", unterteil:"jeans", untenfarbe:"#4a78c8", schuhe:"turnschuh", schuhfarbe:"#ffffff"}],
  ["haus",1,30,94,{name:"Mia", groesse:"kind", haut:0, frisur:"zoepfe", haarfarbe:"#c8552b", oberteil:"kleid", obenfarbe:"#ff9fd0", muster:"punkte", unterteil:"leggings", untenfarbe:"#a26bff", schuhe:"ballerina", schuhfarbe:"#ff5f7e", sommersprossen:1}],
  ["haus",1,72,96,{name:"Baby Ben", groesse:"baby", haut:1, frisur:"kurz", haarfarbe:"#f2c94c", oberteil:"pulli", obenfarbe:"#ffd84d", unterteil:"shorts", untenfarbe:"#5fd38a", schuhe:"turnschuh", schuhfarbe:"#4aa8ff"}],
  ["haus",2,72,86,{name:"Leo", groesse:"kind", haut:3, frisur:"locken", haarfarbe:"#222222", oberteil:"hoodie", obenfarbe:"#4aa8ff", unterteil:"jeans", untenfarbe:"#4a78c8", schuhe:"turnschuh", schuhfarbe:"#ff5f7e"}],
  ["park",1,44,90,{name:"Oma Rosi", groesse:"erwachsen", haut:1, frisur:"dutt", haarfarbe:"#b9b9c4", oberteil:"pulli", obenfarbe:"#a26bff", unterteil:"rock", untenfarbe:"#4a78c8", schuhe:"stiefel", schuhfarbe:"#8a5a3c", brille:"brille"}],
  ["schule",0,26,92,{name:"Frau Klee", groesse:"erwachsen", haut:0, frisur:"bob", haarfarbe:"#f2c94c", oberteil:"kleid", obenfarbe:"#5fd38a", muster:"streifen", unterteil:"leggings", untenfarbe:"#333a4d", schuhe:"ballerina", schuhfarbe:"#333a4d", brille:"brille"}],
  ["cafe",0,36,94,{name:"Herr Bohne", groesse:"erwachsen", haut:4, frisur:"kurz", haarfarbe:"#222222", oberteil:"shirt", obenfarbe:"#ffffff", unterteil:"hose", untenfarbe:"#333a4d", schuhe:"turnschuh", schuhfarbe:"#333a4d", hut:"koch"}],
  ["klinik",0,48,94,{name:"Dr. Sonne", groesse:"erwachsen", haut:2, frisur:"lang", haarfarbe:"#222222", oberteil:"kittel", obenfarbe:"#ffffff", unterteil:"hose", untenfarbe:"#4aa8ff", schuhe:"turnschuh", schuhfarbe:"#ffffff"}],
  ["mode",0,74,94,{name:"Lilli", groesse:"erwachsen", haut:0, frisur:"zweidutt", haarfarbe:"#ff6fb5", oberteil:"top", obenfarbe:"#333a4d", muster:"sterne", unterteil:"rock", untenfarbe:"#ff9fd0", schuhe:"stiefel", schuhfarbe:"#333a4d", brille:"herz"}],
  ["markt",0,62,90,{name:"Herr Korn", groesse:"erwachsen", haut:1, frisur:"glatze", haarfarbe:"#8a6a4a", oberteil:"latzhose", obenfarbe:"#5fd38a", unterteil:"hose", untenfarbe:"#5fd38a", schuhe:"stiefel", schuhfarbe:"#8a5a3c", bart:"voll"}],
  ["baden",0,8,94,{name:"Kim", groesse:"erwachsen", haut:3, frisur:"seite", haarfarbe:"#222222", oberteil:"top", obenfarbe:"#ff5f7e", unterteil:"shorts", untenfarbe:"#ff5f7e", schuhe:"sandale", schuhfarbe:"#ffd84d", brille:"sonne"}],
  ["hof",0,52,94,{name:"Bauer Hans", groesse:"erwachsen", haut:1, frisur:"kurz", haarfarbe:"#c8552b", oberteil:"latzhose", obenfarbe:"#4a78c8", unterteil:"hose", untenfarbe:"#4a78c8", schuhe:"stiefel", schuhfarbe:"#5fd38a", hut:"sonnenhut", bart:"schnurr"}],
  ["kino",0,22,94,{name:"Frau Kugel", groesse:"erwachsen", haut:2, frisur:"locken", haarfarbe:"#a26bff", oberteil:"shirt", obenfarbe:"#ff9fd0", muster:"punkte", unterteil:"rock", untenfarbe:"#2ad4c8", schuhe:"ballerina", schuhfarbe:"#ff9fd0", hut:"schleife"}],
  ["schule",1,84,94,{name:"Paul", groesse:"kind", haut:4, frisur:"stachel", haarfarbe:"#222222", oberteil:"shirt", obenfarbe:"#ff9a3c", unterteil:"shorts", untenfarbe:"#4a78c8", schuhe:"turnschuh", schuhfarbe:"#ffffff"}]
];

// ---------------------------------------------------------------- Figuren-Baukasten
// Jede Option: [Wert, Name, Preis in Sternen]. Gekauft wird im Friseur & Modeladen.
const HAUT = ["#ffe0c7","#f6c9a0","#d9a173","#a86e45","#6b4429","#c9e8ff"];
const FARBEN = [["#ff5f7e","Rot",0],["#4aa8ff","Blau",0],["#ffd84d","Gelb",0],["#5fd38a","Grün",0],["#ffffff","Weiß",0],["#333a4d","Schwarz",0],
  ["#ff9fd0","Rosa",5],["#a26bff","Lila",5],["#ff9a3c","Orange",5],["#2ad4c8","Türkis",5],["#4a78c8","Jeansblau",5],["#8a5a3c","Braun",5],["#ffd23f","Gold",15]];
const BAUKASTEN = [
  {id:"koerper", n:"🧍 Körper", gruppen:[
    ["groesse","Größe",[["baby","Baby",0],["kind","Kind",0],["erwachsen","Erwachsen",0]]],
    ["haut","Hautfarbe",HAUT.map((c, i) => [i, "", i === 5 ? 20 : 0]),1]]},
  {id:"gesicht", n:"😊 Gesicht", gruppen:[
    ["augen","Augen",[["rund","Rund",0],["gross","Groß",0],["muede","Verschlafen",0],["wimpern","Wimpern",0],["sterne","Sternchen",15],["herz","Herzchen",15]]],
    ["augenfarbe","Augenfarbe",[["#5a3a22","Braun",0],["#3b7dd8","Blau",0],["#3aa35b","Grün",0],["#7a5ac8","Lila",10]],1],
    ["brauen","Augenbrauen",[["normal","Normal",0],["dick","Dick",0],["keine","Keine",0]]],
    ["mund","Mund",[["laecheln","Lächeln",0],["lachen","Lachen",0],["zunge","Zunge",0],["oh","Oh!",0],["grinsen","Grinsen",0]]],
    ["wangen","Rote Bäckchen",[[1,"Ja",0],[0,"Nein",0]]],
    ["sommersprossen","Sommersprossen",[[0,"Nein",0],[1,"Ja",0]]],
    ["bart","Bart",[["","Keiner",0],["schnurr","Schnurrbart",10],["voll","Vollbart",10]]]]},
  {id:"haare", n:"💇 Haare", gruppen:[
    ["frisur","Frisur",[["kurz","Kurz",0],["bob","Bob",0],["lang","Lang",0],["glatze","Glatze",0],["stachel","Stachelig",10],["pferd","Pferdeschwanz",10],
      ["zoepfe","Zöpfe",15],["dutt","Dutt",15],["zweidutt","Zwei Dutts",20],["locken","Locken",20],["afro","Afro",20],["seite","Seitenscheitel",10]]],
    ["haarfarbe","Haarfarbe",[["#5a3a22","Braun",0],["#222222","Schwarz",0],["#f2c94c","Blond",0],["#c8552b","Rot",0],["#b9b9c4","Grau",0],
      ["#ff6fb5","Pink",10],["#4aa8ff","Blau",10],["#a26bff","Lila",10],["#3ccf7a","Grün",10],["#ffffff","Weiß",10],["#ff9a3c","Orange",10]],1]]},
  {id:"kleidung", n:"👕 Kleidung", gruppen:[
    ["oberteil","Oberteil",[["shirt","T-Shirt",0],["top","Top",0],["pulli","Pulli",0],["hoodie","Hoodie",15],["jacke","Jacke",15],["kleid","Kleid",15],
      ["latzhose","Latzhose",15],["kittel","Kittel",10],["superheld","Heldenanzug",30]]],
    ["obenfarbe","Farbe oben",FARBEN,1],
    ["muster","Muster",[["uni","Ohne",0],["streifen","Streifen",5],["punkte","Punkte",5],["sterne","Sterne",10],["herzen","Herzen",10]]],
    ["unterteil","Unterteil",[["hose","Hose",0],["jeans","Jeans",0],["shorts","Shorts",0],["rock","Rock",10],["leggings","Leggings",5],["tutu","Tütü",20]]],
    ["untenfarbe","Farbe unten",FARBEN,1]]},
  {id:"schuhe", n:"👟 Schuhe", gruppen:[
    ["schuhe","Schuhe",[["turnschuh","Turnschuhe",0],["stiefel","Stiefel",10],["ballerina","Ballerinas",10],["sandale","Sandalen",5],["barfuss","Barfuß",0]]],
    ["schuhfarbe","Schuhfarbe",FARBEN,1]]},
  {id:"extras", n:"🎩 Extras", gruppen:[
    ["hut","Auf dem Kopf",[["","Nichts",0],["schleife","Schleife",5],["kappe","Kappe",10],["muetze","Mütze",10],["sonnenhut","Sonnenhut",15],["koch","Kochmütze",15],
      ["krone","Krone",40],["katzenohren","Katzenohren",25],["blumen","Blumenkranz",20]]],
    ["brille","Brille",[["","Keine",0],["brille","Brille",10],["sonne","Sonnenbrille",15],["herz","Herzbrille",20],["stern","Sternbrille",20]]],
    ["extra","Dazu",[["","Nichts",0],["kette","Kette",10],["schal","Schal",10],["fluegel","Feenflügel",40],["umhang","Umhang",30]]]]}
];
const FIGUR_STANDARD = {name:"Neu", groesse:"kind", haut:0, augen:"rund", augenfarbe:"#5a3a22", brauen:"normal", mund:"laecheln", wangen:1, sommersprossen:0,
  bart:"", frisur:"kurz", haarfarbe:"#5a3a22", oberteil:"shirt", obenfarbe:"#ff5f7e", muster:"uni", unterteil:"hose", untenfarbe:"#4aa8ff",
  schuhe:"turnschuh", schuhfarbe:"#ffffff", hut:"", brille:"", extra:""};
const BREITE_FIGUR = {baby:6.5, kind:9, erwachsen:11};

// ---------------------------------------------------------------- Aufgaben
// t = Text, z = wie oft, l = Lohn in Sternen
const AUFGABEN = {
  essen_geben:{t:"Gib einer Figur etwas zu essen: Essen auf die Figur ziehen, dann die Figur antippen 🍎", z:1, l:10},
  tier_fuettern:{t:"Füttere ein Tier 🐈", z:1, l:10},
  kochen:{t:"Koche etwas: 3 Zutaten auf den Herd in der Küche ziehen 🍲", z:1, l:20},
  backen:{t:"Backe etwas: 2 Backzutaten in den Ofen in der Café-Backstube 🧁", z:1, l:20},
  toasten:{t:"Toaste ein Brot in der Küche 🍞", z:1, l:10},
  kakao:{t:"Mach einen Kakao an der Kakaomaschine im Café ☕", z:1, l:5},
  aufraeumen:{t:"Steck 3 Sachen in die Waschmaschine im Bad 🧦", z:3, l:15},
  duschen:{t:"Stell eine Figur unter die laufende Dusche 🚿", z:1, l:10},
  baden:{t:"Setz eine Figur in die Badewanne 🛁", z:1, l:10},
  schlafen:{t:"Bring eine Figur ins Bett 🛏️", z:1, l:10},
  fernsehen:{t:"Setz eine Figur aufs Sofa und schalte den Fernseher an 📺", z:1, l:10},
  giessen:{t:"Gieße das Blumenbeet auf der Wiese mit dem Eimer 🪣", z:1, l:10},
  schaukeln:{t:"Setz eine Figur auf die Schaukel und tipp sie an", z:1, l:10},
  rutschen:{t:"Setz eine Figur oben auf die Rutsche und tipp sie an", z:1, l:10},
  korbwurf:{t:"Wirf 2 Bälle in den Basketballkorb im Pausenhof 🏀", z:2, l:15},
  malen:{t:"Male ein Bild an die Tafel in der Schule 🖍️", z:1, l:15},
  kantine:{t:"Hol Dir ein Essen an der Essensausgabe in der Schulkantine 🍽️", z:1, l:10},
  trennen:{t:"Wirf 2 Sachen in die Mülltrennung der Kantine ♻️", z:2, l:10},
  verarzten:{t:"Klebe einer Figur oder einem Tier ein Pflaster auf 🩹", z:1, l:10},
  roentgen:{t:"Stell eine Figur ins Röntgengerät im Krankenhaus 🦴", z:1, l:10},
  schwimmen:{t:"Stell eine Figur aufs Sprungbrett im Schwimmbad und tipp sie an 🏊", z:1, l:15},
  sandburg:{t:"Geh an den Strand und tipp die Sandburg an 🏖️", z:1, l:5},
  eier:{t:"Sammle 2 Eier: Tipp den Hühnerstall im Bauernhof-Stall an 🥚", z:2, l:15},
  traktor:{t:"Setz eine Figur auf den Traktor und tipp sie an 🚜", z:1, l:10},
  kino:{t:"Setz eine Figur in einen Kinosessel und tipp die Leinwand an 🎬", z:1, l:15},
  eis:{t:"Kaufe ein Eis in der Eisdiele 🍦", z:1, l:10},
  stylen:{t:"Gib einer Figur einen neuen Look ✨", z:1, l:10},
  einkaufen:{t:"Kaufe etwas im Markt 🛒", z:1, l:10},
  moebel:{t:"Kaufe ein Möbelstück im Möbelhaus 🛋️", z:1, l:15},
  einrichten:{t:"Gib einem Zimmer eine neue Tapete oder einen neuen Boden 🎨", z:1, l:10},
  umziehen:{t:"Bring eine Figur an einen anderen Ort (oben auf einen Ort ziehen) 🚶", z:1, l:5},
  quiz:{t:"Beantworte 3 Wissensfragen richtig 🧠", z:3, l:20}
};
const START_AUFGABEN = ["essen_geben", "schwimmen", "kino", "eier"];
const TAGESGESCHENK = 20, PREIS_FIGUR = 25, MAX_FIGUREN = 30, LOHN_FRAGE = 5, START_STERNE = 50, TASCHE_MAX = 40;
