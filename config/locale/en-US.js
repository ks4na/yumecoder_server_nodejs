'use strict';

module.exports = {
  // appName
  appName: 'YumeCoder',

  // get current language
  currentLanguage: 'en-US',

  // token middleware
  'tokenMiddleware.missingToken': 'missing token',
  'tokenMiddleware.expiredToken': 'token expired',
  'tokenMiddleware.invalidToken': 'invalid token',

  // loginController
  'loginController.unexistUser': 'unexist user',
  'loginController.inactiveUser': 'inactive user',
  'loginController.incorrectAccountOrPwd': 'incorrect account or password',

  // loginService
  'loginService.expiredRefreshToken': 'refresh_token expired',
  'loginService.invalidRefreshToken': 'invalid refresh_token',

  // registController
  'registController.invalidCaptcha': 'invalid captcha',
  'registController.usedEmail': 'email address has been used',
  'registController.unexistUser': 'unexist user',
  'registController.activedUser': 'user has been actived',
  'registController.activeCodeIsWrongOrExpired':
    'active code is wrong or expired',

  // registService
  'registService.registEmailSubject': 'Regist Info Validate',
  'registService.No.{0}': '{0}',
  'registService.registEmailTitle': 'User Regist Mail',

  // basicController
  'basicController.invalidCaptcha': 'invalid captcha',
  'basicController.unexistUser': 'unexist user',
  'basicController.inactiveUser': 'user has not been actived',
  'basicController.activeCodeIsWrongOrExpired':
    'active code is wrong or expired',

  // basicService
  'basicService.resetPwdEmailSubject': 'Password Reset',
};
