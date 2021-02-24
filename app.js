var express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const {
  setInterval
} = require('timers');
const {
  decode
} = require("url-encode-decode");

var metas = {
  "description": "Pekarska, poslastičarska, ugostiteljska, rashladna, neutralna oprema i rezervni delovi za Vaše preduzeće. Delilice, mikseri, pekarske peći, sokovnici, mikrotalasne i mnogi drugi proizvodi.",
  "keywords": "pekarska,oprema,ugostiteljska,rashladna,neutralna,delovi,rezervni,pekare,picerije,delilice,mikseri,pizza,peci"
}
var ogMetas = {
  "title": "PEKARSKA I UGOSTITELJSKA OPREMA PIN OUTLET &#8211; UVOZ – PRODAJA – ISPORUKA – SERVIS I MONTAŽA OPREME Tel: +381 65 550 60 11",
  "description": "Pekarska, poslastičarska, ugostiteljska, rashladna, neutralna oprema i rezervni delovi za Vaše preduzeće. Delilice, mikseri, pekarske peći, sokovnici, mikrotalasne i mnogi drugi proizvodi.",
  "url": "https://pekarskemasine.com/",
  "site_name": "PEKARSKA I UGOSTITELJSKA OPREMA PIN OUTLET &#8211; UVOZ – PRODAJA – ISPORUKA – SERVIS I MONTAŽA OPREME Tel: +381 65 550 60 11",
  "image": "https://www.pekarskemasine.com/logo.ico"
}

formMetas = (values = {}) => {
  for (m in metas) {
    if (values[m] == null) values[m] = metas[m];
  }
  var metasHtml = "";
  for (m in values) {
    metasHtml += `<meta name="${m}" content="${values[m]}" />\n`;
  }
  return metasHtml;
}

formOgMetas = (values = {}) => {
  for (m in ogMetas) {
    if (values[m] == null) values[m] = ogMetas[m];
  }
  var metasHtml = "";
  for (m in values) {
    metasHtml += `<meta property="og:${m}" content="${values[m]}" />\n`;
  }
  return metasHtml;
}

var artikli = {};
var blogovi = {};

var app = express();

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

preuzmiArtikle();
setInterval(preuzmiArtikle, 1000 * 60 * 10); // jednom u 10min
preuzmiBlogove();
setInterval(preuzmiBlogove, 1000 * 60 * 60 * 24); // jednom dnevno

var port = '4444';
app.set('port', port);

app.get(/\.(js|css|map|ico|jpg|png|gif|svg|txt|xml)$/, express.static(path.resolve(__dirname, './build')));

app.use('*', (req, res) => {

  var ruta = req.originalUrl.substr(1);
  ruta = decode(ruta);
  var metasStr = "";

  if (artikli[ruta] != null) {
    console.log("Artikal: " + ruta);
    var ogs = {};

    if (artikli[ruta].images.length > 0) ogs["image"] = "https://api.pinoutlet.geasoft.net/products/" + artikli[ruta].images[0];
    ogs["description"] = artikli[ruta].description;
    ogs["title"] = artikli[ruta].displayTitle;

    var metas = {};
    metas["description"] = artikli[ruta].description;
    var tagovi = [];
    for(var tag of artikli[ruta].tags) {
      tagovi.push(tag.title);
    }
      
    var strTagovi = tagovi.join(",");
    metas["keywords"] = strTagovi;

    metasStr = formMetas(metas) + formOgMetas(ogs);
  } else if(ruta.includes("blog/")) {
    var nazivBloga = ruta.substr(ruta.indexOf("blog/") + 5);
    console.log("Blog: " + nazivBloga);
    var blog = blogovi[nazivBloga];

    var ogs = {};
    if (blog.cover != null) ogs["image"] = "https://api.pinoutlet.geasoft.net/blog/" + blog.cover;
    ogs["description"] = blog.preview;
    ogs["title"] = nazivBloga;

    var metas = {};
    metas["description"] =  blog.preview;
    metas["keywords"] = blog.tags;

    metasStr = formMetas(metas) + formOgMetas(ogs);
  }
  else {
    metasStr = formMetas() + formOgMetas();
  }

  let indexHTML = fs.readFileSync(path.resolve(__dirname, './build/index.html'), {
    encoding: 'utf8',
  }).replace(`<link rel="canonical" href="http://pekarskemasine.com/"/>`, metasStr);

  res.contentType('text/html');
  res.status(200);

  return res.send(indexHTML);
});

app.listen('4444', () => {
  console.log("PinOutlet SSR na 4444")
})


function preuzmiArtikle() {
  fetch("http://localhost:4000/api/v1/products")
    .then(res => res.json())
    .then(res => {
      for (var art of res) {
        artikli[art.title] = art;
      }
    })
}

function preuzmiBlogove() {
  fetch("http://localhost:4000/api/v1/blog")
    .then(res => res.json())
    .then(res => {
      for (var blog of res) {
        blogovi[blog.title] = blog;
      }
    })
}