
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
const EMPTY_DIR = './empty';
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

// syncs a single s3 bucket
function syncToS3(creds, uploadOpts, bucket, color, strLength) {
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

// syncs all the s3 buckets listed in the config
function syncAll(creds, uploadOpts, buckets) {
  let strLength = maxLength(buckets);
  return Q.all(buckets.map(function(bucket, index) {
    let color = BAR_COLORS[index % BAR_COLORS.length];
    return syncToS3(creds, uploadOpts, bucket, color, strLength);
  }));
}

//////////////////// SUB-TASKS ////////////////////////

gulp.task('clean', function() {
  return gulp.src(DIST_DIR, { read: false })
    .pipe(clean());
});

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

gulp.task('upload', function(cb) {
  let uploadOpts = _.clone(config.uploadOpts);
  uploadOpts.localDir = DIST_DIR;
  return syncAll(config.awsCredentials, uploadOpts, config.buckets);
});

gulp.task('mkEmpty', function() {
  fs.mkdirSync(EMPTY_DIR);
  return Q.resolve();
});

gulp.task('uploadEmpty', function(cb) {
  let uploadOpts = _.clone(config.uploadOpts);
  uploadOpts.localDir = EMPTY_DIR;
  return syncAll(config.awsCredentials, uploadOpts, config.buckets);
});

gulp.task('rmEmpty', function() {
  fs.rmdirSync(EMPTY_DIR);
  return Q.resolve(); 
});

////////////////////// CLI TASKS ////////////////////////

gulp.task('config', function() {
  console.log(config);
});

gulp.task('sync', function(cb) {
  runSequence('clean', 'prep', 'upload', cb);
});

gulp.task('empty', function(cb) {
  runSequence('mkEmpty', 'uploadEmpty', 'rmEmpty', cb);
});


