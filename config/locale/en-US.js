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

  // testController
  'testController.unexistCategory': 'unexist category',
  'testController.unexistTest': 'unexist test',
  'testController.cannotAccessThisPaper': 'cannot access this test',
  'testController.paperHasBeenDone': 'test has been done',
  'testController.invalidUserAnswers': 'field `userAnswers` has error',
  'testController.paperHasNotBeenDone': 'test has not been done',
  'testController.cannotCopySelfPaper': 'cannot copy self paper',

  // testService
  'testService.notEnoughQuestionToMakePaper': 'not enough questions',
  'testService.specialExercise': ' Special Exercise',

  // remarkController
  'remarkController.unexistQuestion': 'unexist question',
  'remarkController.deletedQuestion':
    'question has been deleted, cannot add remark',
  'remarkController.unexistRemark': 'unexist remark',
  'remarkController.deletedRemark': 'deleted remark',
  'remarkController.hasGivenZan': 'has given a like to this remark',
  'remarkController.hasNotGivenZan': 'has not given a like to this remark',
  'remarkController.unexistReplyToUser': 'unexist replyTo user',

  // remarkService
  'remarkService.deletedReply': '[this remark has been deleted]',

  // questionController
  'questionController.notInDoneQuestion':
    'not practiced question or unexist question',
  'questionController.hasCollected': 'question has been collected',
  'questionController.notInCollection': 'question not in collection',
  'questionController.unexistQuestion': 'unexist question',
  'questionController.invalidCategoryId': 'invalid category id',
  'questionController.unexistUser': 'invalid user id',

  // userController
  'userController.noUpdateField': 'lack of udpate field',
  'userController.cannotBeSamePassword':
    'new password and old password cannot be the same',
  'userController.wrongPassword': 'wrong password',
  'userController.invalidAvatarFormat': 'invalid avatar format',
};
