
var gulp = require('gulp');
var s3   = require('s3');
var gutil = require('gutil');

var config = require('./config');

//////////////////// SYNC TO S3 ////////////////////////

function syncToS3(localDir, bucket, cb) {
  var client = s3.createClient({
    s3Options: config.aws.credentials
  });

  var uploader = client.uploadDir({
    localDir: localDir,
    deleteRemoved: true,
    s3Params: {
      Bucket: bucket
    },
    getS3Params: function(localFile, stat, callback) {
      var s3Params = stat.path === 'index.html' ? 
                     { CacheControl: 'max-age=0' } :
                     { CacheControl: 'max-age=604800' }
      callback(null, s3Params);
    }
  });

  uploader.on('error', function(err) {
    console.error("unable to sync:", err.stack);
    process.exit(1); 
  });

  var lastProgress = 0, curProgress;
  uploader.on('progress', function() {
    curProgress = 100 * uploader.progressAmount / uploader.progressTotal;
    if (curProgress - lastProgress > 3) {
      gutil.log("upload progress: " + Math.round(curProgress) + "%");
      lastProgress = curProgress;
    }
  });

  uploader.on('end', function() {
    gutil.log("done uploading");
    cb();
  });
};

//////////////////////// TASKS ///////////////////////////

gulp.task('config', function() {
  console.log(config);
});

gulp.task('sync', function(cb) {
  syncToS3(config.uploadDir, config.aws.buckets[0], cb);
});


