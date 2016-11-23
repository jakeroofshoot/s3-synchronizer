
//////////////////// IMPORTS ///////////////////////////

const gulp = require('gulp');
const s3   = require('s3');
const gutil = require('gutil');
const ProgressBar = require('node-progress-bars');
const Q = require('q');

const config = require('./config');

//////////////////// CONSTANTS /////////////////////////

const BAR_COLORS = ['red', 'cyan', 'green', 'yellow', 'magenta', 'blue'];

//////////////////// UTILITIES /////////////////////////

// returns the length of the longest string in an array
function maxLength(arr) {
  return arr.reduce(function(prev, cur) {
    return cur.length > prev ? cur.length : prev;
  }, 0);
}

// add spaces to end of string so it is numChars long
function pad(str, numChars) {
  let numToAdd = Math.max(numChars - str.length, 0);
  for (var i = 0; i < numToAdd; i++)
    str += ' ';
  return str;
}

//////////////////// PREP FILES ////////////////////////

function prepFiles() {
  console.log("preparing dist folder");
  return Q.resolve();
}

//////////////////// SYNC TO S3 ////////////////////////

function syncToS3(localDir, bucket, color, strLength) {
  let deferred = Q.defer();

  let client = s3.createClient({
    s3Options: config.aws.credentials
  });

  let uploader = client.uploadDir({
    localDir: localDir,
    deleteRemoved: true,
    s3Params: {
      Bucket: bucket
    },
    getS3Params: function(localFile, stat, callback) {
      let s3Params = stat.path === 'index.html' ? 
                     { CacheControl: 'max-age=0' } :
                     { CacheControl: 'max-age=604800' }
      callback(null, s3Params);
    }
  });

  let bar = new ProgressBar({ 
    schema: pad(bucket + ':', strLength + 2) + ':bar.' + color + ' :percent'
  });

  uploader.on('error', function(err) {
    console.error("unable to sync:", err.stack);
    process.exit(1); 
  });

  uploader.on('progress', function() {
    let ratio = uploader.progressAmount / uploader.progressTotal;
    if (isNaN(ratio))
      ratio = 0;
    bar.update(ratio);
  });

  uploader.on('end', function() {
    bar.update(1);
    deferred.resolve();
  });

  return deferred.promise;
};

//////////////////////// TASKS ///////////////////////////

gulp.task('config', function() {
  console.log(config);
});

gulp.task('sync', function(cb) {
  let strLength = maxLength(config.aws.buckets);

  prepFiles()
  .then(function() {
    console.log("synching");
    return Q.all(config.aws.buckets.map(function(bucket, index) {
      let color = BAR_COLORS[index % BAR_COLORS.length];
      return syncToS3(config.uploadDir, bucket, color, strLength);
    }));
  })
  .then(function() {
    console.log("synch complete");
    cb();
  });
});

gulp.task('test', function() {
  console.log(pad('jake', 10));
});





