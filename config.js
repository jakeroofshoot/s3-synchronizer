
module.exports = {

  uploadDir: './content2/',

  aws: {
    credentials: require('./aws-creds.js'),

    buckets: [
      'jake-test-int',
      'jake-test-stg',
      'jake-test-prod'
    ]
  }

};