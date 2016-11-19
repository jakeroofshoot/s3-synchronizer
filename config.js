
module.exports = {

  uploadDir: './content/',

  aws: {
    credentials: require('./aws-creds.js'),

    buckets: [
      'jake-test-int',
      'test-stg',
      'test-prod'
    ]
  }

};