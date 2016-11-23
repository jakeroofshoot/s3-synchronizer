
module.exports = {

  uploadDir: './content/',

  aws: {
    credentials: require('./aws-creds.js'),

    buckets: [
      'jake-test-int',
      'jake-test-stg',
      'jake-test-prod'
    ]
  }

};