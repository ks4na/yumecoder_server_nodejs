'use strict';

class CaptchaUtil {
  constructor(EggHelper) {
    this.helper = EggHelper;
  }

  setHelper(helper) {
    this.helper = helper;
    return this;
  }

  getConfig() {
    return this.helper ? this.helper.app.config.captchaUtilConfig : {};
  }

  static getInstance() {
    return CaptchaUtil.instance;
  }

  async validate(captcha, skipValidate = false) {
    // 为方便测试，添加skipValidate字段，默认为false，即需要进行验证
    if (skipValidate) {
      return true;
    }
    const { targetDomain, apiKey } = this.getConfig();
    if (!targetDomain || !apiKey) {
      throw new Error(
        `missing Luosimao captcha config info :: targetDomain=${targetDomain}, apiKey=${apiKey}`
      );
    }
    const result = await this.helper.app.curl(targetDomain, {
      method: 'POST',
      data: {
        api_key: apiKey,
        response: captcha,
      },
      dataType: 'json',
    });
    if (result.data.res === 'success') {
      return true;
    }
    this.helper.ctx.logger.error('Luosimao captcha response: ', result);
    return false;
  }
}

CaptchaUtil.instance = new CaptchaUtil();

module.exports = CaptchaUtil;
