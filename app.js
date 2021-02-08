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
  "Description": "Pekarska, poslastičarska, ugostiteljska, rashladna, neutralna oprema i rezervni delovi za Vaše preduzeće. Delilice, mikseri, pekarske peći, sokovnici, mikrotalasne i mnogi drugi proizvodi."
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

var app = express();

app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

preuzmiArtikle();
setInterval(preuzmiArtikle, 60000);

var port = '4444';
app.set('port', port);

app.get(/\.(js|css|map|ico|jpg|png|gif|svg)$/, express.static(path.resolve(__dirname, './build')));

app.use('*', (req, res) => {

  var ruta = req.originalUrl.substr(1);
  ruta = decode(ruta);
  var metasStr = "";

  if (artikli[ruta] != null) {
    console.log(ruta + " jeste artikal");
    var ogs = {};

    if (artikli[ruta].images.length > 0) ogs["image"] = "https://api.pinoutlet.geasoft.net/products/" + artikli[ruta].images[0];
    ogs["description"] = artikli[ruta].description;
    ogs["title"] = artikli[ruta].displayTitle;

    metasStr = formMetas() + formOgMetas(ogs);
  } else {
    console.log(ruta + " nije artikal");
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