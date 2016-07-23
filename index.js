var S3FS = require('s3fs');
var crypto = require('crypto');
var fs = require('fs');
// var gm = require('graphicsmagick-stream');

gm = require('gm');
var ffmpeg = require('fluent-ffmpeg');

function S3Storage(opts) {
  if (!opts.bucket) {
    throw new Error('bucket is required');
  }
  if (!opts.secretAccessKey) {
    throw new Error('secretAccessKey is required');
  }
  if (!opts.accessKeyId) {
    throw new Error('accessKeyId is required');
  }
  if (!opts.region) {
    throw new Error('region is required');
  }
  if (!opts.dirname) {
    throw new Error('dirname is required');
  }
  if (!opts.gm) {
    throw new Error('gm is required');
  }
  this.options = opts;
  this.options.filename = (opts.filename || getFilename);
  this.s3fs = new S3FS(opts.bucket, opts);
  this.s3fs2 = new S3FS(opts.bucket, opts);
  this.s3fs3 = new S3FS(opts.bucket, opts);
  //this.convert = gm(opts.gm);
  //this.convert2 = gm(opts.gm2);
}

function getFilename(req, file, cb) {
  crypto.pseudoRandomBytes(16, function(err, raw) {
    cb(err, err ? undefined : raw.toString('hex'));
  });
}

S3Storage.prototype._handleFile = function(req, file, cb) {
  var self = this;
  //var file2 = file
  self.options.filename(req, file, function(err, filename) {
    if (err) {
      return cb(err);
    }
    var filePath = self.options.dirname + '/' + filename;
    var filePath_thumb = self.options.dirname + '/thumb_' + filename;
    var outStream = self.s3fs.createWriteStream(filePath);
    var outStream_thumb = self.s3fs2.createWriteStream(filePath_thumb);

    
    

    var ext = filename.slice(-4)
    if (ext !== ".mp4") {
      var readStream = file.stream
      gm(readStream)
      .resize('200', '200')
      .stream(function (err, stdout, stderr) {
        var writeStream = outStream_thumb
        stdout.pipe(writeStream);
      });
    }
    else {

    }

    file.stream.pipe(outStream);

    outStream.on('error', cb);
      outStream.on('finish', function() {
        var myloc = 'https://' + self.options.bucket + '.s3.amazonaws.com/' + filePath
        myloc = myloc.replace("///","/")
        console.log('OUTGOT: ' + myloc)
        cb(null, {
          size: outStream.bytesWritten,
          key: filePath,
          location: myloc
          // generate thumb
        });

       var ext = myloc.slice(-4)
       console.log('EXT='+ext)
        if (ext === ".mp4") {  
         var proc = ffmpeg(myloc)
          .takeScreenshots({
                count: 1,
                timemarks: [ '10' ], // number of seconds
                filename: 'screenshot_%b'
              }, 'tmp/my-uploads/thumbnail-folder')
          .on('end', function(files) {
            console.log(files)
    console.log('Screenshots taken');
      console.log('screenshots were saved');
filename_png = filename.replace(".mp4",".png")
var screenurl = 'tmp/my-uploads/thumbnail-folder/screenshot_' + filename_png;
console.log('SCCC:' + screenurl)

//  })




var outStream_vidthumb = self.s3fs3.createWriteStream(self.options.dirname + '/screenshot_' + filename_png);

gm(screenurl)
.resize(200, 200)
.stream(function (err, stdout, stderr) {
        var writeStream = outStream_vidthumb
        stdout.pipe(writeStream);
      });



/*
readStreamvid = fs.readFile(screenurl, function (err, data) {
   gm(readStreamvid)
                    .resize('200', '200')
                    .stream(function (err, stdout, stderr) {
                      var writeStream = outStream_vidthumb
                      stdout.pipe(writeStream);
                    });
   if (err) {
       return console.error(err);
   }
   console.log("Asynchronous read: " + data.toString());
});

*/


            });
        }
      });
    
  });
};

S3Storage.prototype._removeFile = function(req, file, cb) {
  this.s3fs.unlink(file.key, cb);
};

module.exports = function(opts) {
  return new S3Storage(opts);
};
