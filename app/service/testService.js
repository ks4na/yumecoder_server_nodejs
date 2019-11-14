'use strict';

const Service = require('egg').Service;
const _ = require('lodash');
const sqls = require('../../config/sql/testService.js');

class TestService extends Service {
  async getDoneQuestionAmountAndRightQuestionAmount(
    userId,
    questionCategoryTree
  ) {
    const childCategoryIdList = [];
    questionCategoryTree.forEach(item => {
      if (item.children) {
        item.children.forEach(childItem => {
          childCategoryIdList.push(childItem.id);
        });
      }
    });
    const sql_done = sqls.getDoneQuestionAmountByUserIdAndCategoryId;
    const userDoneQuestionAmountList = await this.app.mysql.query(sql_done, [
      userId,
      childCategoryIdList,
    ]);
    const sql_right = sqls.getRightQuestionAmountByUserIdAndCategoryId;
    const userRightQuestionAmountList = await this.app.mysql.query(
      sql_right,
      userId,
      childCategoryIdList
    );
    return {
      userDoneQuestionAmountList,
      userRightQuestionAmountList,
    };
  }

  async makePaper(userId, category, onlyMistakeFlag) {
    const user = await this.service.userService.getUserById(userId);

    let list = []; // 保存符合组卷条件的题目
    // 判断是否有足够的题目来组卷
    const testRange = onlyMistakeFlag ? 1 : user.test_range;
    switch (testRange) {
      case 0: {
        list = await this.getNewQuestionIdList(userId, category.id);
        break;
      }
      case 1: {
        list = await this.getMistokenQuestionIdList(userId, category.id);
        break;
      }
      case 2: {
        list = await this.getNewAndMistokenQuestionIdList(userId, category.id);
        break;
      }
      case 3: {
        list = await this.getAllQuestionIdList(category.id);
        break;
      }
      default: {
        list = [];
      }
    }
    if (list.length === 0 || list.length < user.question_number_per_time) {
      return {
        code: 2,
        msg: this.ctx.__('testService.notEnoughQuestionToMakePaper'),
      };
    }

    // 题目数量足够组卷，则随机抽取组卷的题目id
    const paperQuestionIdList = _.sampleSize(
      list,
      user.question_number_per_time
    );

    // 开启事务，添加 试卷、 试卷-试题 到数据库， 返回试卷id
    const testId = await this.app.mysql.beginTransactionScope(async conn => {
      // 添加试卷记录
      const testRow = {
        test_name:
          category.category_name + this.ctx.__('testService.specialExercise'),
        question_amount: user.question_number_per_time,
        create_user: user.id,
        create_time: this.ctx.helper.convertDateToString(new Date()),
      };
      const addTestResult = await conn.insert('t_test', testRow);
      if (addTestResult.affectedRows !== 1) {
        throw new Error('add test failed: ' + JSON.stringify(testRow));
      }
      const testId = addTestResult.insertId;

      // 添加 试卷-题目 记录到数据库
      const testQuestionRows = [];
      paperQuestionIdList.forEach((item, index) => {
        const testQuestion = {
          test_id: testId,
          question_id: item,
          question_sort: index + 1,
        };
        testQuestionRows.push(testQuestion);
      });
      const addTestQuestionResult = await conn.insert(
        't_test_question',
        testQuestionRows
      );
      if (
        addTestQuestionResult.affectedRows !== user.question_number_per_time
      ) {
        throw new Error(
          'add test_question record failed: ' + JSON.stringify(testQuestionRows)
        );
      }

      return testId;
    }, this.ctx);

    return {
      code: 0,
      msg: { testId },
    };
  }

  async getNewQuestionIdList(userId, categoryId) {
    const sql = sqls.getNewQuestionIdList;
    const results = await this.app.mysql.query(sql, [userId, categoryId]);
    return results.map(item => item.id);
  }

  async getMistokenQuestionIdList(userId, categoryId) {
    const sql = sqls.getMistokenQuestionIdList;
    const results = await this.app.mysql.query(sql, [userId, categoryId]);
    return results.map(item => item.id);
  }

  async getNewAndMistokenQuestionIdList(userId, categoryId) {
    const sql = sqls.getNewAndMistokenQuestionIdList;
    const results = await this.app.mysql.query(sql, [userId, categoryId]);
    return results.map(item => item.id);
  }

  async getAllQuestionIdList(categoryId) {
    const sql = sqls.getAllQuestionIdList;
    const results = await this.app.mysql.query(sql, categoryId);
    return results.map(item => item.id);
  }

  async getTestById(testId) {
    const test = await this.app.mysql.get('t_test', { id: testId });
    return test;
  }

  async getQuestionsAndOptionsByTestId(testId) {
    const sql_getQuestions = sqls.getQuestionsByTestId;
    const questionList = await this.app.mysql.query(sql_getQuestions, testId);

    const sql_getOptions = sqls.getOptionsByTestId;
    const optionList = await this.app.mysql.query(sql_getOptions, testId);

    // 将options挂在到所属的question的options属性上
    questionList.forEach(item => {
      const options = optionList.filter(
        option => option.question_id === item.id
      );
      item.options = options;
    });

    return questionList;
  }

  async getUserAnswersByTestId(testId) {
    const results = await this.app.mysql.select('t_test_question', {
      where: { test_id: testId },
      columns: ['question_id', 'personal_answer'],
      orders: [['question_sort', 'asc']],
    });
    // 按照空格拆分personal_answer为数组，如 'A B' ==> ['A', 'B'] ; '' ==> []
    results.forEach(item => {
      const personalAnswer = item.personal_answer;
      item.personal_answer = personalAnswer ? personalAnswer.split(' ') : [];
    });
    return results;
  }

  async saveUncompletedTest(testId, spentTime, userAnswers, testQuestionList) {
    // 开启事务
    const result = await this.app.mysql.beginTransactionScope(async conn => {
      // 更新 t_test表的 spend_time 字段
      const testRow = {
        id: testId,
        spend_time: spentTime,
      };
      const updateTestResult = await conn.update('t_test', testRow);
      if (updateTestResult.affectedRows !== 1) {
        throw new Error(
          'update test spend_time failed: ' + JSON.stringify(testRow)
        );
      }

      // 更新 t_test_question 表的 personal_answer 字段
      const testQuestionUpdateRows = userAnswers.map(item => {
        const testQuestionObj = testQuestionList.find(
          answer => answer.question_id === item.questionId
        );
        return {
          id: testQuestionObj.id,
          personal_answer: item.answer.join(' '),
        };
      });

      const promise_updateUserAnswers = testQuestionUpdateRows.map(item =>
        conn.update('t_test_question', item)
      );
      const results = await Promise.all(promise_updateUserAnswers);
      results.forEach((item, index) => {
        if (item.affectedRows !== 1) {
          throw new Error(
            'update userAnswer failed: ' +
              JSON.stringify(testQuestionUpdateRows[index])
          );
        }
      });
      return true;
    }, this.ctx);
    return result;
  }

  async getTestQuestionsByTestId(testId) {
    const testQuestionList = await this.app.mysql.select('t_test_question', {
      where: {
        test_id: testId,
      },
    });
    return testQuestionList;
  }

  async handleCommittedTest(
    testId,
    spentTime,
    userAnswers,
    testQuestionList,
    userId
  ) {
    const result = await this.app.mysql.beginTransactionScope(async conn => {
      // 保存用户的回答（更新 t_test_question 表的 personal_answer 字段）
      const testQuestionUpdateRows = userAnswers.map(item => {
        const testQuestionObj = testQuestionList.find(
          answer => answer.question_id === item.questionId
        );
        return {
          id: testQuestionObj.id,
          personal_answer: item.answer.join(' '),
        };
      });
      const promise_updateUserAnswers = testQuestionUpdateRows.map(item =>
        conn.update('t_test_question', item)
      );
      const results = await Promise.all(promise_updateUserAnswers);
      results.forEach((item, index) => {
        if (item.affectedRows !== 1) {
          throw new Error(
            'update userAnswer failed: ' +
              JSON.stringify(testQuestionUpdateRows[index])
          );
        }
      });

      // 获取正确答案集合
      const sql_getRightAnswers = sqls.getRightAnswersByTestId;
      const rightAnswers = await conn.query(sql_getRightAnswers, testId);

      // 与用户回答进行比较，生成 已做题目集合
      let correctAnswerCount = 0; // 记录该试卷用户答对的总题数
      const doneQuestionList = rightAnswers.map(item => {
        const userAnswerObj = userAnswers.find(ua => ua.questionId === item.id);
        const isRight = item.answer === userAnswerObj.answer.join(' ');
        isRight ? correctAnswerCount++ : undefined;
        return {
          question_id: item.id,
          create_user: userId,
          create_time: this.ctx.helper.convertDateToString(new Date()),
          is_right: isRight,
        };
      });

      // 更新试卷表
      const testRow = {
        id: testId,
        spend_time: spentTime,
        is_completed: 1,
        correct_amount: correctAnswerCount,
      };
      const updateTestResult = await conn.update('t_test', testRow);
      if (updateTestResult.affectedRows !== 1) {
        throw new Error('update test info failed: ' + JSON.stringify(testRow));
      }

      // 遍历已做题目集合，如果某条题目的id已经存在于该用户的已做题目集合中，则只更新is_right字段，否则添加到已做题目表中
      let newDoneQuestionCount = 0; // 记录第一次做到的题目的数量
      const userAllDoneQuestionIdList = await conn.select('t_donequestion', {
        where: {
          create_user: userId,
        },
        columns: ['question_id'],
      });
      const promise_updateOrInsertDoneQuestions = doneQuestionList.map(item => {
        const hasExisted = userAllDoneQuestionIdList.some(
          dq => dq.question_id === item.question_id
        );
        if (hasExisted) {
          // 已存在，则只更新is_right字段
          const updateRow = {
            is_right: item.is_right,
          };
          const updateOption = {
            where: {
              question_id: item.question_id,
              create_user: userId,
            },
          };
          return conn.update('t_donequestion', updateRow, updateOption);
        }
        // 不存在，则添加该记录到表中
        newDoneQuestionCount++;
        return conn.insert('t_donequestion', item);
      });
      const updateOrInsertResults = await Promise.all(
        promise_updateOrInsertDoneQuestions
      );
      updateOrInsertResults.forEach((item, index) => {
        if (item.affectedRows !== 1) {
          throw new Error(
            'update or insert doneQuestion record failed: ' +
              JSON.stringify(doneQuestionList[index])
          );
        }
      });

      // 更新该用户的 done_question_number 字段
      await this.service.userService.updateDoneQuestionNumberById(
        userId,
        newDoneQuestionCount
      );

      return true;
    }, this.ctx);

    return result;
  }

  async getRightAnswersByTestId(testId) {
    // 获取正确答案集合
    const sql_getRightAnswers = sqls.getRightAnswersByTestId;
    const rightAnswers = await this.app.mysql.query(
      sql_getRightAnswers,
      testId
    );
    // 按照空格拆分answer为数组，如 'A B' ==> ['A', 'B'] ; '' ==> []
    rightAnswers.forEach(item => {
      item.answer = item.answer ? item.answer.split(' ') : [];
    });
    return rightAnswers;
  }

  async combineAnswersToTest(test, userAnswers, rightAnswers) {
    const questions = rightAnswers.map(item => {
      const userAnswerObj = userAnswers.find(ua => ua.question_id === item.id);
      return {
        sort: item.question_sort,
        id: item.id,
        right_answer: item.answer,
        personal_answer: userAnswerObj.personal_answer,
      };
    });
    const combinedTest = Object.assign({}, test);
    combinedTest.questions = questions;
    return combinedTest;
  }

  async getCollectInfoByTestIdAndUserId(testId, userId) {
    const sql = sqls.getCollectInfoByTestIdAndUserId;
    const results = await this.app.mysql.query(sql, [testId, userId]);
    return results;
  }

  async cloneTest(test, userId) {
    // 开启事务
    const clonedTestId = await this.app.mysql.beginTransactionScope(
      async conn => {
        // 将 test 对象添加到 t_test 表
        const clonedTest = {
          test_name: test.test_name,
          question_amount: test.question_amount,
          create_user: userId,
          create_time: this.ctx.helper.convertDateToString(new Date()),
        };
        const insertTestResult = await conn.insert('t_test', clonedTest);
        if (insertTestResult.affectedRows !== 1) {
          throw new Error(
            'insert cloned test failed: ' + JSON.stringify(clonedTest)
          );
        }
        const clonedTestId = insertTestResult.insertId; // 添加成功后的克隆试卷的id

        // 将 test_question 对象添加到 t_test_question 表
        const originalTestQuestions = await conn.select('t_test_question', {
          where: {
            test_id: test.id,
          },
        });
        const clonedTestQuestionRows = originalTestQuestions.map(item => {
          return {
            test_id: clonedTestId,
            question_id: item.question_id,
            question_sort: item.question_sort,
          };
        });
        const insertTestQuestionsResult = await conn.insert(
          't_test_question',
          clonedTestQuestionRows
        );
        if (
          insertTestQuestionsResult.affectedRows !==
          clonedTestQuestionRows.length
        ) {
          throw new Error(
            'insert clonedTestQuestions falied: ' +
              JSON.stringify(clonedTestQuestionRows)
          );
        }
        return clonedTestId;
      },
      this.ctx
    );

    return clonedTestId;
  }
}

module.exports = TestService;
