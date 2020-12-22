const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const { fromPath } = require('pdf2pic');
require('dotenv').config();
const libre = require('libreoffice-convert');

const port = process.env.PORT || 8089;
const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());
app.use(express.json());

const download = (url, dest, cb) => {
    const file = fs.createWriteStream(dest);
    if (url.indexOf('https') > -1) {
      const request = https.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close(cb);
        });
      });
    } else {
      const request = http.get(url, function(response) {
        response.pipe(file);
        file.on('finish', function() {
          file.close(cb);
        });
      });
    }
}

app.post('/pdf', async (req, res) => {
    const { url, fileName, savedName } = req.body;
    download(url, 'public/'+fileName,async () => {
      const options = {
  	density: 100,
  	saveFilename: savedName,
  	savePath: "public/thumbnails",
  	format: "jpeg",
        width: 649,
        height:896 
      };
      const storeAsImage = fromPath("public/"+fileName, options);
      const pageToConvertAsImage = 1;
 
      const data = await storeAsImage(pageToConvertAsImage).then((resolve) => {
     	fs.unlinkSync('public/'+fileName);
     	return resolve;
     	});
	res.json(data);
    });
});

app.post('/doc', async (req, res) => {
 const { url, fileName, savedName, ext } = req.body;
    const filePath = 'public/'+fileName+ext;
    const outputPath = 'public/'+fileName+'.pdf';
    download(url, filePath,async () => {
      const file = fs.readFileSync(filePath);
      libre.convert(file, ext, undefined, (err, done) => {
          if (err) {
              console.log(`Error converting file: ${err}`);
          }
    
          // Here in done you have pdf file which you can save or transfer in another stream
          fs.writeFileSync(outputPath, done);
          console.log('Done ');
	});
    });

});

app.listen(port, () => {
    console.log(`Server started at port ${port}`);
});

