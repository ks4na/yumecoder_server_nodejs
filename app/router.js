'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  // 测试用router，可删除
  router.get('/', controller.home.index);
  router.get('/api/home', controller.home.index);
  router.get('/api/token/generate/:userId', controller.home.getToken);

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
  router.post('/api/login/github', controller.loginController.githubLogin);

  // 练习信息相关的router
  router.get('/api/tests/menu', controller.testController.index);
  router.post('/api/tests/generate', controller.testController.makePaper);
  router.get('/api/tests/count', controller.testController.getTestCount);
  router.get('/api/tests/done', controller.testController.getDoneTestList);
  router.get(
    '/api/tests/:userId/done',
    controller.testController.getDoneTestListByUserId
  );
  router.get('/api/tests/:testId', controller.testController.getPaper);
  router.post(
    '/api/tests/saveUncompleted',
    controller.testController.saveUncompletedTest
  );
  router.post(
    '/api/tests/submit',
    controller.testController.handleCommittedTest
  );
  router.get(
    '/api/tests/:testId/result',
    controller.testController.getTestResult
  );
  router.get(
    '/api/tests/:testId/analysis',
    controller.testController.getTestAnalysis
  );
  router.get('/api/tests/:testId/clone', controller.testController.cloneTest);
  router.post('/api/tests/saveTemp', controller.testController.saveTemp);

  // 评论相关的router
  router.post('/api/remarks', controller.remarkController.addRemark);
  router.get('/api/remarks/:remarkId', controller.remarkController.getRemark);
  router.put(
    '/api/remarks/:remarkId/addZan',
    controller.remarkController.addZan
  );
  router.put(
    '/api/remarks/:remarkId/removeZan',
    controller.remarkController.removeZan
  );
  router.post(
    '/api/remarks/:remarkId/reply',
    controller.remarkController.addReply
  );

  // 题目相关的router
  router.put(
    '/api/questions/:questionId/collect',
    controller.questionController.addToCollection
  );
  router.put(
    '/api/questions/:questionId/cancelCollect',
    controller.questionController.removeFromCollection
  );
  router.get(
    '/api/questions/:questionId/remarks',
    controller.questionController.getQuestionRemarks
  );
  router.get(
    '/api/questions/:userId/:categoryId/collect',
    controller.questionController.getCollectedQuestionsByCategoryId
  );
  router.get(
    '/api/questions/:categoryId/collect',
    controller.questionController.getCollectionsByCategoryId
  );
  router.get(
    '/api/questions/:categoryId/mistakes',
    controller.questionController.gitMistakes
  );
  router.get(
    '/api/questions/count',
    controller.questionController.getQuestionCountByCondition
  );

  // 题目分类相关的router
  router.get(
    '/api/questionCategories',
    controller.questionCategoryController.getQuestionCategories
  );

  // 用户相关的router
  router.get('/api/users/self', controller.userController.getCurrentUserInfo);
  router.get('/api/users/:userId', controller.userController.getUserInfo);
  router.put(
    '/api/users/self',
    controller.userController.updateCurrentUserInfo
  );
  router.put('/api/users/resetPwd', controller.userController.resetPwd);
  router.put('/api/users/logout', controller.userController.handleLogout);
  router.post(
    '/api/users/uploadAvatar',
    controller.userController.uploadAvatar
  );
};
