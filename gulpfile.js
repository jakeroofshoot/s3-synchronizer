
//////////////////// IMPORTS ///////////////////////////

const gulp          = require('gulp'),
      s3            = require('s3'),
      gutil         = require('gutil'),
      ProgressBar   = require('node-progress-bars'),
      Q             = require('q'),
      imagemin      = require('gulp-imagemin'),
      size          = require('gulp-size'),
      runSequence   = require('run-sequence'),
      clean         = require('gulp-clean'),
      fs            = require('fs'),
      _             = require('lodash');

const config = require('./config');

//////////////////// CONSTANTS /////////////////////////

const DIST_DIR = './dist';
const BAR_COLORS = ['red', 'cyan', 'green', 'yellow', 'magenta', 'blue'];

//////////////////// PURE FUNCTIONS ////////////////////

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

// sync a single s3 bucket
function syncToS3(creds, bucket, uploadOpts, color, strLength) {
  let deferred = Q.defer();

  let client = s3.createClient({ s3Options: creds });

  let uploader = (function() {
    let options = _.cloneDeep(uploadOpts);
    options.s3Params.Bucket = bucket;
    return client.uploadDir(options);
  })();

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
}

// sync an array of s3 buckets
function syncAll(creds, buckets, uploadOpts) {
  let strLength = maxLength(buckets);
  return Q.all(buckets.map(function(bucket, index) {
    let color = BAR_COLORS[index % BAR_COLORS.length];
    return syncToS3(creds, bucket, uploadOpts, color, strLength);
  }));
}

//////////////////// SUB-TASKS ////////////////////////

// empty the dist folder
gulp.task('clean', function() {
  return gulp.src(DIST_DIR + '/**/*.*', { read: false })
    .pipe(clean());
});

// copy files from localDir to dist folder; optimize images
gulp.task('prep', function() {
  let localDir = config.uploadOpts.localDir;
  return gulp.src(localDir + '**/*.*', { base: localDir })
    .pipe(imagemin())
    .pipe(size({
      showFiles: false,
      showTotal: true  
    }))
    .pipe(gulp.dest(DIST_DIR));
});

// upload from the dist folder to all s3 buckets
gulp.task('upload', function(cb) {
  config.uploadOpts.localDir = DIST_DIR;
  return syncAll(config.awsCredentials, config.buckets, config.uploadOpts);
});

////////////////////// CLI TASKS ////////////////////////

// sync all buckets with local directory
gulp.task('sync', function(cb) {
  runSequence('clean', 'prep', 'upload', cb);
});

// empty all buckets
gulp.task('empty', function(cb) {
  runSequence('clean', 'upload', cb);
});

