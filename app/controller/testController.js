'use strict';

const Controller = require('egg').Controller;

class TestController extends Controller {
  async index() {
    const { ctx, service } = this;
    const { userId } = ctx;
    // 获取用户信息
    const user = await service.userService.getUserById(userId);
    const filteredUserInfo = ctx.helper.removeKey(user, [
      'password',
      'active_code',
      'expire_time',
      'refresh_token',
    ]);
    // 获取用户已练习的题目数
    const doneQuestionAmount = await service.questionService.getDoneQuestionAmountByUserId(
      userId
    );
    // 获取答对的题目数
    const rightAmount = await service.questionService.getRightAmountByUserId(
      userId
    );
    // 获取题目分类树以及每个分类的题目数量
    const questionCategoryTree = await service.questionCategoryService.getCategoryTree();
    // 获取二级分类各类别题目中，当前用户已经做过的题目数量和作对的题目数量
    const {
      userDoneQuestionAmountList,
      userRightQuestionAmountList,
    } = await service.testService.getDoneQuestionAmountAndRightQuestionAmount(
      userId,
      questionCategoryTree
    );
    ctx.body = {
      user: filteredUserInfo,
      doneQuestionAmount,
      rightAmount,
      questionCategoryTree,
      userDoneQuestionAmountList,
      userRightQuestionAmountList,
    };
  }

  async makePaper() {
    const { ctx, service } = this;
    const { categoryId, onlyMistakeFlag } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        categoryId: 'int',
        onlyMistakeFlag: {
          type: 'boolean',
          required: false,
        },
      },
      { categoryId, onlyMistakeFlag }
    );

    // 检测categoryId是否存在
    const category = await service.questionCategoryService.getQuestionCategoryById(
      categoryId
    );
    if (category === null) {
      ctx.body = {
        code: 1,
        msg: ctx.__('testController.unexistCategory'),
      };
      return;
    }

    const { code, msg } = await service.testService.makePaper(
      ctx.userId,
      category,
      onlyMistakeFlag
    );

    if (code !== 0) {
      ctx.body = {
        code,
        msg,
      };
    } else {
      ctx.body = msg.testId;
    }
  }

  async getPaper() {
    const { ctx, service } = this;
    let { testId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        testId: {
          type: 'id',
        },
      },
      { testId }
    );

    // 校验testId是否存在，以及是否是该用户创建的
    testId = parseInt(testId);
    const { userId } = ctx;
    const test = await service.testService.getTestById(testId);
    let errCode = 0,
      errMsg;
    if (test === null) {
      errCode = 1;
      errMsg = ctx.__('testController.unexistTest');
    } else if (test.create_user !== userId) {
      errCode = 2;
      errMsg = ctx.__('testController.cannotAccessThisPaper');
    } else if (test.is_completed === 1) {
      errCode = 3;
      errMsg = ctx.__('testController.paperHasBeenDone');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 获取题目信息(包含选项信息)
    const testQuestions = await service.testService.getQuestionsAndOptionsByTestId(
      test.id
    );
    // 移除答案、分析字段
    testQuestions.forEach(item => {
      delete item.answer;
      delete item.analysis;
    });
    // 挂载到test对象的questions属性上
    test.questions = testQuestions;
    // 获取用户的回答信息
    const userAnswers = await service.testService.getUserAnswersByTestId(
      test.id
    );

    ctx.body = {
      test,
      userAnswers,
    };
  }

  async saveUncompletedTest() {
    const { ctx, service } = this;
    const { testId, spentTime, userAnswers } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        testId: {
          type: 'int',
          format: /^\d+$/,
        },
        spentTime: {
          type: 'string',
          format: /^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/,
        },
        userAnswers: {
          type: 'array',
          itemType: 'object',
          rule: {
            questionId: {
              type: 'int',
              format: /^\d+$/,
            },
            answer: {
              type: 'array',
              itemType: 'string',
              rule: {
                format: /^[A-Z]$/,
              },
            },
          },
        },
      },
      { testId, spentTime, userAnswers }
    );

    // 校验testId是否存在，以及是否是该用户创建的
    const { userId } = ctx;
    const test = await service.testService.getTestById(testId);
    let errCode = 0,
      errMsg;
    if (test === null) {
      errCode = 1;
      errMsg = ctx.__('testController.unexistTest');
    } else if (test.create_user !== userId) {
      errCode = 2;
      errMsg = ctx.__('testController.cannotAccessThisPaper');
    } else if (test.is_completed === 1) {
      errCode = 3;
      errMsg = ctx.__('testController.paperHasBeenDone');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 校验userAnswers所有questionId是否与该试卷所有题目的questionId对应
    const testQuestionList = await service.testService.getTestQuestionsByTestId(
      testId
    );
    let isMatchedFlag = true;
    if (userAnswers.length !== testQuestionList.length) {
      isMatchedFlag = false;
    } else {
      const isAllContainedInUserAnswers = testQuestionList.every(item => {
        const isContainedInUserAnswers = userAnswers.some(
          answer => answer.questionId === item.question_id
        );
        return isContainedInUserAnswers;
      });
      if (!isAllContainedInUserAnswers) {
        isMatchedFlag = false;
      }
    }
    if (!isMatchedFlag) {
      ctx.body = {
        code: 4,
        msg: ctx.__('testController.invalidUserAnswers'),
      };
      return;
    }

    // 保存未完成的试卷信息，返回true
    const result = await service.testService.saveUncompletedTest(
      testId,
      spentTime,
      userAnswers,
      testQuestionList
    );

    ctx.body = result;
  }

  async handleCommittedTest() {
    const { ctx, service } = this;
    const { testId, spentTime, userAnswers } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        testId: {
          type: 'int',
          format: /^\d+$/,
        },
        spentTime: {
          type: 'string',
          format: /^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/,
        },
        userAnswers: {
          type: 'array',
          itemType: 'object',
          rule: {
            questionId: {
              type: 'int',
              format: /^\d+$/,
            },
            answer: {
              type: 'array',
              itemType: 'string',
              rule: {
                format: /^[A-Z]$/,
              },
            },
          },
        },
      },
      { testId, spentTime, userAnswers }
    );

    // 校验testId是否存在，以及是否是该用户创建的
    const { userId } = ctx;
    const test = await service.testService.getTestById(testId);
    let errCode = 0,
      errMsg;
    if (test === null) {
      errCode = 1;
      errMsg = ctx.__('testController.unexistTest');
    } else if (test.create_user !== userId) {
      errCode = 2;
      errMsg = ctx.__('testController.cannotAccessThisPaper');
    } else if (test.is_completed === 1) {
      errCode = 3;
      errMsg = ctx.__('testController.paperHasBeenDone');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 校验userAnswers所有questionId是否与该试卷所有题目的questionId对应
    const testQuestionList = await service.testService.getTestQuestionsByTestId(
      testId
    );
    let isMatchedFlag = true;
    if (userAnswers.length !== testQuestionList.length) {
      isMatchedFlag = false;
    } else {
      const isAllContainedInUserAnswers = testQuestionList.every(item => {
        const isContainedInUserAnswers = userAnswers.some(
          answer => answer.questionId === item.question_id
        );
        return isContainedInUserAnswers;
      });
      if (!isAllContainedInUserAnswers) {
        isMatchedFlag = false;
      }
    }
    if (!isMatchedFlag) {
      ctx.body = {
        code: 4,
        msg: ctx.__('testController.invalidUserAnswers'),
      };
      return;
    }

    // 处理提交的试卷信息，返回true
    const result = await service.testService.handleCommittedTest(
      testId,
      spentTime,
      userAnswers,
      testQuestionList,
      userId
    );

    ctx.body = result;
  }

  async getTestResult() {
    const { ctx, service } = this;
    let { testId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        testId: {
          type: 'id',
        },
      },
      { testId }
    );

    // 校验testId是否存在，以及是否是该用户创建的
    testId = parseInt(testId);
    const { userId } = ctx;
    const test = await service.testService.getTestById(testId);
    let errCode = 0,
      errMsg;
    if (test === null) {
      errCode = 1;
      errMsg = ctx.__('testController.unexistTest');
    } else if (test.create_user !== userId) {
      errCode = 2;
      errMsg = ctx.__('testController.cannotAccessThisPaper');
    } else if (test.is_completed === 0) {
      errCode = 3;
      errMsg = ctx.__('testController.paperHasNotBeenDone');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 获取用户答案和正确答案
    const userAnswers = await service.testService.getUserAnswersByTestId(
      testId
    );
    const rightAnswers = await service.testService.getRightAnswersByTestId(
      testId
    );

    // 根据题目id整合用户答案和正确答案，并将其挂载到test对象的questions属性上
    const combinedTest = await service.testService.combineAnswersToTest(
      test,
      userAnswers,
      rightAnswers
    );

    ctx.body = {
      test: combinedTest,
    };
  }

  async getTestAnalysis() {
    const { ctx, service } = this;
    let { testId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        testId: {
          type: 'id',
        },
      },
      { testId }
    );

    // 校验testId是否存在，以及是否是该用户创建的
    testId = parseInt(testId);
    const { userId } = ctx;
    const test = await service.testService.getTestById(testId);
    let errCode = 0,
      errMsg;
    if (test === null) {
      errCode = 1;
      errMsg = ctx.__('testController.unexistTest');
    } else if (test.create_user !== userId) {
      errCode = 2;
      errMsg = ctx.__('testController.cannotAccessThisPaper');
    } else if (test.is_completed === 0) {
      errCode = 3;
      errMsg = ctx.__('testController.paperHasNotBeenDone');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 获取题目信息(包含选项信息)
    const testQuestions = await service.testService.getQuestionsAndOptionsByTestId(
      test.id
    );
    // 按照空格拆分题目答案字段为数组，如 'A B' ==> ['A', 'B'] ; '' ==> []
    testQuestions.forEach(item => {
      item.answer = item.answer ? item.answer.split(' ') : [];
    });
    // 挂载到test对象的questions属性上
    test.questions = testQuestions;
    // 获取用户的回答信息
    const userAnswers = await service.testService.getUserAnswersByTestId(
      test.id
    );
    // 获取用户是否收藏题目
    const collectInfo = await service.testService.getCollectInfoByTestIdAndUserId(
      test.id,
      userId
    );

    // 将用户回答信息和收藏信息挂载到test.questions各个对象上
    test.questions.forEach(item => {
      const questionId = item.id;
      const userAnswerObj = userAnswers.find(
        ua => ua.question_id === questionId
      );
      const collectInfoObj = collectInfo.find(
        ci => ci.question_id === questionId
      );
      // 添加 user_answer 和 is_collected 字段， 分别记录 用户回答 和 用户是否收藏
      item.user_answer = userAnswerObj.personal_answer;
      item.is_collected = collectInfoObj.is_collected;
    });
    ctx.body = {
      test,
    };
  }

  async cloneTest() {
    const { ctx, service } = this;
    let { testId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        testId: {
          type: 'id',
        },
      },
      { testId }
    );

    // 校验testId是否存在
    testId = parseInt(testId);
    const { userId } = ctx;
    const test = await service.testService.getTestById(testId);
    let errCode = 0,
      errMsg;
    if (test === null) {
      errCode = 1;
      errMsg = ctx.__('testController.unexistTest');
    } else if (test.create_user === userId) {
      errCode = 2;
      errMsg = ctx.__('testController.cannotCopySelfPaper');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 复制试卷
    const clonedTestId = await service.testService.cloneTest(test, userId);
    ctx.body = {
      clonedTestId,
    };
  }

  async saveTemp() {
    const { ctx, service } = this;
    const { testId, spentTime, userAnswers } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        testId: {
          type: 'int',
          format: /^\d+$/,
        },
        spentTime: {
          type: 'string',
          format: /^([0-1]?[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/,
        },
        userAnswers: {
          type: 'array',
          itemType: 'object',
          rule: {
            questionId: {
              type: 'int',
              format: /^\d+$/,
            },
            answer: {
              type: 'array',
              itemType: 'string',
              rule: {
                format: /^[A-Z]$/,
              },
            },
          },
        },
      },
      { testId, spentTime, userAnswers }
    );

    // 校验testId是否存在，以及是否是该用户创建的
    const { userId } = ctx;
    const test = await service.testService.getTestById(testId);
    let errCode = 0,
      errMsg;
    if (test === null) {
      errCode = 1;
      errMsg = ctx.__('testController.unexistTest');
    } else if (test.is_completed === 1) {
      errCode = 2;
      errMsg = ctx.__('testController.paperHasBeenDone');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 校验userAnswers所有questionId是否与该试卷所有题目的questionId对应
    const testQuestionList = await service.testService.getTestQuestionsByTestId(
      testId
    );
    let isMatchedFlag = true;
    if (userAnswers.length !== testQuestionList.length) {
      isMatchedFlag = false;
    } else {
      const isAllContainedInUserAnswers = testQuestionList.every(item => {
        const isContainedInUserAnswers = userAnswers.some(
          answer => answer.questionId === item.question_id
        );
        return isContainedInUserAnswers;
      });
      if (!isAllContainedInUserAnswers) {
        isMatchedFlag = false;
      }
    }
    if (!isMatchedFlag) {
      ctx.body = {
        code: 3,
        msg: ctx.__('testController.invalidUserAnswers'),
      };
      return;
    }

    // 保存未完成的试卷信息，返回true
    await service.testService.saveUncompletedTest(
      testId,
      spentTime,
      userAnswers,
      testQuestionList
    );

    //  判断提交的test创建者是否为当前用户
    const isTestOwner = test.create_user === userId;

    ctx.body = {
      isTestOwner,
    };
  }

  async getTestCount() {
    const { ctx, service } = this;
    const { userId } = ctx;

    const result = await service.testService.getTestCount(userId);
    ctx.body = result;
  }

  async getDoneTestList() {
    const { ctx, service } = this;
    const { userId } = ctx;

    const result = await service.testService.getDoneTestList(userId);
    ctx.body = result;
  }

  async getDoneTestListByUserId() {
    const { ctx, service } = this;
    const { userId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        userId: {
          type: 'id',
        },
      },
      { userId }
    );

    // 校验 userId 合法性
    const user = await service.userService.getUserById(userId);

    if (!user) {
      ctx.body = {
        code: 1,
        msg: ctx.__('testController.unexistUser'),
      };
      return;
    }

    const result = await service.testService.getDoneTestList(userId);
    ctx.body = result;
  }
}

module.exports = TestController;
