
module.exports = {

  awsCredentials: require('./aws-creds.js'),

  buckets: [
    'portal-content-int',
    'portal-content-qa',
    'portal-content-stg',
    'portal-content-prod'
  ],

  // use any options from here: https://www.npmjs.com/package/s3
  uploadOpts: {

    // name of the local directory you want to sync
    localDir: './portal-content/',

    // whether to delete files from the bucket 
    // if they aren't in the localDir
    deleteRemoved: true,

    // upload parameters. you can include any params from the aws docs:
    // http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
    // the name of the bucket will be included automatically
    s3Params: {},

    // determines the s3 params on a file-by-file basis
    // pass null as the second arg of callback to skip a file
    getS3Params: function(localFile, stat, callback) {
      let s3Params = { CacheControl: 'max-age=604800' };  // one week
      callback(null, s3Params);
    }
  }

};