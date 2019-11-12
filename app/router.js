'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  // 测试用router，可删除
  router.get('/', controller.home.index);
  router.get('/api/home', controller.home.index);
  router.get('/api/gettoken', controller.home.getToken);

  // 登录注册相关的router
  router.post('/api/login', controller.loginController.login);
  router.post('/api/refreshToken', controller.loginController.refreshToken);
  router.get(
    '/api/regist/isUsedEmail',
    controller.registController.isUsedEmail
  );
  router.post(
    '/api/regist/validate',
    controller.registController.registValidate
  );
  router.post('/api/regist/active', controller.registController.active);
  router.post(
    '/api/pwd/resetValidate',
    controller.basicController.resetPwdValidate
  );
  router.post('/api/pwd/reset', controller.basicController.resetPwd);
  router.post('/api/login/qq', controller.loginController.qqLogin);
};
