'use strict';

module.exports = {
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

};
