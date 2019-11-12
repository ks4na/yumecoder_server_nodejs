'use strict';

const moment = require('moment');
const CaptchaUtil = require('./captchaUtil/index.js');
const MailUtil = require('./mailUtil/index.js');

module.exports = {
  /**
   * @param {Date} date Date type param
   * convert Date to String with format ('YYYY-MM-DD HH:mm:ss')
   */
  convertDateToString: date => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  },

  /**
   * 获取captchaUtil实例
   */
  get captchaUtil() {
    return CaptchaUtil.getInstance().setHelper(this);
  },

  /**
   * 获取mailUtil实例
   */
  get mailUtil() {
    return MailUtil.getInstance().setHelper(this);
  },

  /**
   * 生成激活码，格式： 长度为6为的包含0-9的随机字符串
   */
  generateActiveCode() {
    return Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');
  },

  /**
   * 获取当前请求使用的言语
   */
  get currentLanguage() {
    const defaultLocale = this.config.i18n.defaultLocale;
    let curLanguage = this.ctx.__('currentLanguage');
    if (curLanguage === 'currentLanguage') {
      curLanguage = defaultLocale;
    }
    return curLanguage;
  },
};
