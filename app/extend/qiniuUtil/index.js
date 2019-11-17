'use strict';

const qiniu = require('qiniu');

class ImgUpload {
  constructor(EggHelper) {
    this.helper = EggHelper;
  }

  setHelper(helper) {
    this.helper = helper;
    return this;
  }

  getConfig() {
    return this.helper ? this.helper.app.config.qiniuConfig : {};
  }

  static getInstance() {
    return ImgUpload.instance;
  }

  async uploadByteArray(uploadBytes, filename) {
    const {
      accessKey,
      secretKey,
      zone,
      bucket,
      domain,
      imgStyle,
    } = this.getConfig();
    if (!accessKey || !secretKey || !zone || !bucket || !domain || !imgStyle) {
      throw new Error(
        'missing qiniu oss upload config info:: currentConfig: ' +
          JSON.stringify(this.getConfig())
      );
    }
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const options = {
      scope: bucket,
      returnBody:
        '{"key":"$(key)","hash":"$(etag)","fsize":$(fsize),"bucket":"$(bucket)","name":"$(x:name)"}',
    };
    const putPolicy = new qiniu.rs.PutPolicy(options);
    const uploadToken = putPolicy.uploadToken(mac);
    const config = new qiniu.conf.Config();
    config.zone = qiniu.zone[zone]; // 空间对应的机房
    const formUploader = new qiniu.form_up.FormUploader(config);
    const putExtra = new qiniu.form_up.PutExtra();
    const result = await new Promise((resolve, reject) => {
      formUploader.put(uploadToken, filename, uploadBytes, putExtra, function(
        respErr,
        respBody,
        respInfo
      ) {
        if (respErr) {
          reject(respErr);
          return;
        }
        resolve({ respBody, respInfo });
        return;
      });
    });
    if (result.respInfo.status !== 200) {
      throw new Error(JSON.stringify(result));
    }
    const src = domain + '/' + result.respBody.key + '?' + imgStyle;
    return src;
  }

  async deleteFile(filename) {
    const { accessKey, secretKey, zone, bucket, domain } = this.getConfig();
    if (!accessKey || !secretKey || !zone || !bucket || !domain) {
      throw new Error(
        'missing qiniu oss upload config info:: currentConfig: ' +
          JSON.stringify(this.getConfig())
      );
    }
    const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    const config = new qiniu.conf.Config();
    config.zone = qiniu.zone[zone]; // 空间对应的机房
    const bucketManager = new qiniu.rs.BucketManager(mac, config);
    const result = await new Promise((resolve, reject) => {
      bucketManager.delete(bucket, filename, function(err, respBody, respInfo) {
        if (err) {
          reject(err);
          return;
        }
        resolve({ respBody, respInfo });
        return;
      });
    });
    if (result.respInfo.status !== 200) {
      throw new Error(JSON.stringify(result.respBody));
    }
    return true;
  }
}

ImgUpload.instance = new ImgUpload();

module.exports = ImgUpload;
