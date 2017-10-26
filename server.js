//parts of code for file upload are modified from source: https://code.msdn.microsoft.com/Upload-Files-Or-To-Server-15f69aaa
var Express = require('express');
var multer = require('multer');
var bodyParser = require('body-parser');
var fs = require('fs-extra');
var config = require('./config.js')
var AWS = require('aws-sdk');
var uuid = require('node-uuid');
var fs = require('fs-extra');
var path = require('path');

var app = Express();
AWS.config.region = config.region;
app.use(bodyParser.json());

var upload = multer({ dest: 'uploads/' })

app.get("/", function (req, res) {
    res.sendFile(__dirname + "/index.html");
});

app.post('/api/Upload', upload.array("imgUploader", 3), function (req, res, next) {
    console.log(req.files[0].path); // req.files is array of `photos` files 
    
    function AnalyzeImage () {
        return new Promise(function (resolve, reject) {
            app.use(Express.static('public'));
            var rekognition = new AWS.Rekognition({region: config.region});
            var bitmap = fs.readFileSync(req.files[0].path);

            rekognition.searchFacesByImage({
                 "CollectionId": config.collectionName,
                 "FaceMatchThreshold": 70,
                 "Image": { 
                     "Bytes": bitmap,
                 },
                 "MaxFaces": 3
            }, function(err, data) {
                 if (err) {
                     res.send(err);
                     reject()
                 } else {
                    if(data.FaceMatches && data.FaceMatches.length > 0 && data.FaceMatches[0].Face)
                    {
                         //console.log (data.FaceMatches[0].Face);	
                         resolve(data.FaceMatches[0].Face);
                    } else {
                        resolve("No matching faces found");
                    }
                }
            });
        })
    }

    AnalyzeImage().then(function (result) {
        console.log ("inside .then")
        console.log (result)
        return res.end("Matching face detected! Image ID is .. " + result.ExternalImageId); 
    }).catch(function () {
        console.log("Promise Rejected");
   });
})

app.listen(2000, function (a) {
    console.log("Listening to port 2000");
});