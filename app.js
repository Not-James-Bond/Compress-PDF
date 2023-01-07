const express = require('express');
const app = express();
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');
const { exec } = require('child_process');
const fs = require('fs');

const dir = __dirname;

app.use(express.urlencoded({extended: false})); 
app.use(express.static(path.join(dir, 'public/'))); 
app.use(express.static(path.join(dir, 'image/'))); 
app.set('view engine', 'ejs');
app.use('/static/compacted', express.static('compactedFiles'));
app.use('/static/original', express.static('originalFiles'));

let count = 0;

// get and adjust the original filename 
function getOriginalFileName(filename) {
    filename = filename.replace(/[- ]+/g, '_');
    const index = filename.lastIndexOf('.pdf');
    if (index == -1) {
        return filename + '.pdf';
    }
    return filename;
}

// get and adjust the compacted filename 
function getCompactedFileName(filename) {
    const index = filename.lastIndexOf('.pdf');
    if (index != -1) {
        return filename.substring(0, index) + '-' + 'compacted.pdf';
    }
    return filename + '-' + 'compacted.pdf';
}

// The disk storage engine gives you full control on storing files to disk.
const storage = multer.diskStorage({
    // destination is used to determine within which folder the uploaded files should be stored.
    destination: function(req, file, cb) {
        cb(null, path.join(dir, 'originalFiles'));
    },

    // filename is used to determine what the file should be named inside the folder.
    filename: function(req, file, cb) {
        console.log(file);
        let filename = getOriginalFileName(file.originalname);
        req.filename = filename;
        cb(null, filename);
    }
})

//  A function to control which files should be uploaded and which should be skipped. In our project, a pdf file should be uploaded.
const fileFilter = function(req, file, cb) {
    // if (!file) {
    //     req.error = 'Error: File not exists';
    //     console.log(req.error);
    //     cb();

    // }
    console.log(file);
    const type = file.mimetype;

    if (type === 'application/pdf') {

        cb(null, true);
    }
    else {
        req.error = 'Error: This is not a pdf file.';
        console.log(req.error);
        cb();
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter, limits: {fileSize: 30*1024*1000}}); // use limits to limit the uploaded file size, which can not be greater than 30 mb

//  main page response, report how many files the compress-pdf has already processed
app.get('/', function(req, res) {
    res.render('index', {count: count});
});

//  /upload page response, report the error or the name of uploaded filename
app.post('/upload', upload.single('pdf'), function(req, res) {
    if (req.error) {
        res.render('error', {error: req.error});
        return;
    }

    res.render('uploaded', {filename: req.filename});
});

//  /compact page response, execute compression, report whether the compression was successful or not and report the compacted file name, original file size, compacted file size
app.post('/compact', function(req, res) {
    const originalFile = req.body.filename;
    let stats = fs.statSync(path.join(dir, "originalFiles/" + originalFile));
    console.log(stats.size);
    const compactedFile = getCompactedFileName(originalFile);

    const resolution = req.body.resolution;

    const quality = req.body.level;
    var command = `./shrinkpdf.sh ./originalFiles/${originalFile} ./compactedFiles/${compactedFile}`;
    if (quality == 300 || quality == 144 || quality == 60) {
        command = `./shrinkpdf.sh ./originalFiles/${originalFile} ./compactedFiles/${compactedFile} ${quality}`;
    }
    else {
        command = `./shrinkpdf.sh ./originalFiles/${originalFile} ./compactedFiles/${compactedFile} ${resolution}`;

    }
    console.log(command);
    exec(command, (err, stdout, stderr) => {  //execute
      if (err) {
          console.log('Error: Compacting error');
          res.render('error', {error: err});
      } else {
          console.log('Compacting successfully');

          let statsCompress = fs.statSync(path.join(dir, "compactedFiles/" + compactedFile));
          console.log(statsCompress.size);
          res.render('compacted', {compactedFile: compactedFile, stats: Math.floor(stats.size / 1000), statsCompress: Math.floor(statsCompress.size / 1000)});

      }

    });
    count++;
})

//  /history page response, report a array which include all the uploaded pdf files
app.get('/history', async function(req, res) {
    const files = await fs.promises.readdir('./originalFiles');
    const PDFfiles = [];
    for (const file of files) {
        if (file.endsWith('.pdf')) {
            PDFfiles.push([file, getCompactedFileName(file)]);
        }
    }
    console.log(PDFfiles);
    res.render('history', {pdfFiles: PDFfiles});
})

//  /delete page response, delete the given pdf files in originalFiles folder and compactedFiles folder, report that the delete operation was successful
app.get('/delete', function(req, res) {
    console.log(req.query.fileName);
    const fileName = req.query.fileName;
    fs.unlinkSync('originalFiles/' + fileName);
    fs.unlinkSync('compactedFiles/' + getCompactedFileName(fileName));
    res.json({status: 'success'});
});

// server Listenining on port 3000
app.listen(3000, function() {
    console.log("Server Listenining on port 3000");
});

module.exports = {
    getOriginalFileName: getOriginalFileName,
    getCompactedFileName: getCompactedFileName
    
};
