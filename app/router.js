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

  // 登录注册相关router
  router.post('/api/login', controller.loginController.login);
  router.post('/api/refreshtoken', controller.loginController.refreshToken);
};
