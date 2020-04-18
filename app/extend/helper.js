'use strict';

const moment = require('moment');
const CaptchaUtil = require('./captchaUtil/index.js');
const MailUtil = require('./mailUtil/index.js');
const QiniuUtil = require('./qiniuUtil/index.js');
const GithubUtil = require('./githubUtil/index.js');
const _ = require('lodash');

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

  /**
   * 移除目标对象中指定的属性， 返回移除后的新对象
   * @param {Object} obj 目标对象
   * @param {Array} keyArr 需要移除的属性，数组
   */
  removeKey(obj, keyArr) {
    return _.omit(obj, keyArr);
  },

  /**
   * 获取qiniuUtil实例
   */
  get qiniuUploadUtil() {
    return QiniuUtil.getInstance().setHelper(this);
  },

  /**
   * 获取 githubUtil 实例
   */
  get githubUtil() {
    return GithubUtil.getInstance().setHelper(this);
  },
};
