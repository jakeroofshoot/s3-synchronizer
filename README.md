
### Overview

This is a simple command line tool for syncing a local directory with any number of s3 buckets. Currently it's used to keep the four `portal-content-*` buckets in sync with each other, and to keep the files in those buckets under version control. 

In addition to the basic syncing functionality, the tool automatically optimizes any images in the local directory before uploading them, and allows you to add headers (such as cache control) to the uploaded files. 

### Installation

1. create a user on AWS who has permission to manipulate the buckets you want to sync. This policy will confer the necessary permissions:

  ```
  {
      "Version": "2012-10-17",
      "Statement": [
          {
              "Sid": "1",
              "Effect": "Allow",
              "Action": "s3:*",
              "Resource": [
                  "arn:aws:s3:::portal-content-*",
                  "arn:aws:s3:::portal-content-*/*"
              ]
          }
      ]
  }
  ```
  (This allows manipulation of the `portal-content-*` buckets, as well as all of the files within them.)

2. put the credentials for that user in a file called `aws-creds.js` in the root of this repo. The file should look like this:

  ```
  module.exports = {
    accessKeyId: '[ access key id from AWS ]',
    secretAccessKey: '[ secret access key from AWS ]'
  };
  ```

3. install node and npm, and then run `npm install` to install the dependencies.

4. install gulp globally (`npm install -g gulp`)

5. create a folder for the content you want to sync. It can be inside this repo, or anywhere on your machine. 

6. adjust the `config.js` file as desired. More info in that file.

### Commands

1. `gulp sync` -- sync a local directory with any number of s3 buckets. 

  This command will upload all of the files in the local directory to the s3 buckets, overwriting any existing files in the buckets that have the same filename as the files in the local directory. In addition, if the `deleteRemoved` option is set to `true` (in the config), this command will delete any files in the buckets that don't exist in the local directory.  

  The local directory is identified in `config.uploadOpts.localDir` and the buckets are listed in `config.buckets`.

  A subtle point to be aware of -- merely changing a header on an existing file (without changing the filename or contents) won't cause an overwrite. So if you need to change a header for a file that already exists in the buckets, you'll have to delete the file, sync, re-add the file, change the header in the config, and sync again. 

2. `gulp empty` -- this command deletes all of the files in the buckets listed in `config.buckets`
