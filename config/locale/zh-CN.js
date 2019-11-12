'use strict';

module.exports = {
  // appName
  appName: '码梦人',

  // get current language
  currentLanguage: 'zh-CN',

  // token middleware
  'tokenMiddleware.missingToken': '缺少token字段',
  'tokenMiddleware.expiredToken': 'token已过期',
  'tokenMiddleware.invalidToken': '非法的token',

  // loginController
  'loginController.unexistUser': '该用户不存在',
  'loginController.inactiveUser': '该用户尚未激活',
  'loginController.incorrectAccountOrPwd': '邮箱或密码错误',

  // loginService
  'loginService.expiredRefreshToken': 'refresh_token已过期',
  'loginService.invalidRefreshToken': '非法的refresh_token',

  // registController
  'registController.invalidCaptcha': '验证码失效',
  'registController.usedEmail': '邮箱已被使用',
  'registController.unexistUser': '该用户不存在',
  'registController.activedUser': '该用户已激活',
  'registController.activeCodeIsWrongOrExpired': '激活码错误或已过期',

  // registService
  'registService.registEmailSubject': '注册信息激活',
  'registService.No.{0}': '{0}号',
  'registService.registEmailTitle': '用户注册',

  // basicController
  'basicController.invalidCaptcha': '验证码失效',
  'basicController.unexistUser': '该用户不存在',
  'basicController.inactiveUser': '该用户尚未激活',
  'basicController.activeCodeIsWrongOrExpired': '激活码错误或已过期',

  // basicService
  'basicService.resetPwdEmailSubject': '密码重置',
};
