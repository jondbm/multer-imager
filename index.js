var S3FS = require('s3fs');
var crypto = require('crypto');
var gm = require('graphicsmagick-stream');

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
  //this.s3fs2 = new S3FS(opts.bucket, opts);
  this.convert = gm(opts.gm);
  // this.convertx = gmx(opts.gm);
  //this.convert2 = gm(opts.gm2);
}

function getFilename(req, file, cb) {
  crypto.pseudoRandomBytes(16, function(err, raw) {
    cb(err, err ? undefined : raw.toString('hex'));
  });
}

S3Storage.prototype._handleFile = function(req, file, cb) {
  console.log('FFFILE=')
  console.log(file)
  var self = this;
  //var file2 = file
  self.options.filename(req, file, function(err, filename) {
    if (err) {
      console.log('CB ERROR!')
      return cb(err);
    }
    var filePath = self.options.dirname + '' + filename;
    console.log('OPTIONSELF=')
    console.log(self.options.dirname)
    console.log('FILEPATH=='+filePath)
    //var filePath2 = self.options.dirname + '/thumb_' + filename;
    var outStream = self.s3fs.createWriteStream(filePath);
    console.log('OT==')
    console.log(outStream)
    console.log('FSTRSMA:')
    console.log(file.stream)
    //var outStream2 = self.s3fs2.createWriteStream(filePath2);
    file.stream
      //.pipe(self.convert())
      .pipe(outStream);
    /*file.stream
      .pipe(self.convert2())
      .pipe(outStream2);*/
    outStream.on('error', cb);
    //outStream.on('finish', function() {
      outStream.on('finish', function() {
        cb(null, {
          size: outStream.bytesWritten,
          key: filePath,
          location: 'https://' + self.options.bucket + '.s3.amazonaws.com/' + filePath
        });
      });
      /*outStream2.on('finish', function() {
        /*cb(null, {
          size: outStream2.bytesWritten,
          key: filePath2,
          location: 'https://' + self.options.bucket + '.s3.amazonaws.com/' + filePath2
        });*/
      //});
    //});
    //outStream2.on('error', cb);
    
  });
};

S3Storage.prototype._removeFile = function(req, file, cb) {
  this.s3fs.unlink(file.key, cb);
};

module.exports = function(opts) {
  return new S3Storage(opts);
};
