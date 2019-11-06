'use strict';

module.exports = {
  // token middleware
  'tokenMiddleware.missingToken': 'missing token',
  'tokenMiddleware.expiredToken': 'token expired',
  'tokenMiddleware.invalidToken': 'invalid token',

  // LoginController
  'LoginController.unexistUser': 'unexist user',
  'LoginController.inactiveUser': 'inactive user',
  'LoginController.incorrectAccountOrPwd': 'incorrect account or password',

  // loginService
  'loginService.expiredRefreshToken': 'refresh_token expired',
  'loginService.invalidRefreshToken': 'invalid refresh_token',
};
