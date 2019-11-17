'use strict';

const Service = require('egg').Service;
const sqls = require('../../config/sql/questionService.js');
const _ = require('lodash');

class QuestionService extends Service {
  async getDoneQuestionAmountByUserId(id) {
    const sql =
      'SELECT COUNT(*) AS `count` FROM `t_donequestion` WHERE `create_user` = ?';
    const results = await this.app.mysql.query(sql, id);
    return results[0];
  }

  async getRightAmountByUserId(id) {
    const sql =
      'SELECT IFNULL( sum( `is_right` ), 0 ) AS `count` FROM `t_donequestion` WHERE `create_user` = ?';
    const results = await this.app.mysql.query(sql, id);
    return results[0];
  }

  async getQuestionById(id) {
    const result = await this.app.mysql.get('t_question', { id });
    return result;
  }

  async getDoneQuestionByQuestionIdAndUserId(questionId, userId) {
    const options = {
      where: { question_id: questionId, create_user: userId },
    };
    const results = await this.app.mysql.select('t_donequestion', options);
    return results.length === 0 ? null : results[0];
  }

  async updateCollectFlag(doneQuestionId, isCollected) {
    const updateRow = {
      id: doneQuestionId,
      is_collected: isCollected,
      collected_time: this.ctx.helper.convertDateToString(new Date()),
    };
    const result = await this.app.mysql.update('t_donequestion', updateRow);
    if (result.affectedRows !== 1) {
      throw new Error(
        'update is_collected field failed: ' + JSON.stringify(updateRow)
      );
    }
    return true;
  }

  async getDetailedRemarksByQuestionId(questionId, userId) {
    // 获取问题的一级评论
    const sql = sqls.getTopLevelQuestionRemarksByQuestionId;
    const remarks = await this.app.mysql.query(sql, [questionId]);

    // 获取问题的一级评论的回复数
    const sql_getReplyCountList = sqls.getQuestionRemarkReplyCountByQuestionId;
    const replyCountList = await this.app.mysql.query(sql_getReplyCountList, [
      questionId,
    ]);
    // 获取各个一级评论的已点赞用户id集合
    const promises_getZanGiverIdList = remarks.map(item => {
      return this.app.mysql.select('t_zan', {
        where: { remark_id: item.id },
        columns: ['remark_id', 'create_user'],
      });
    });
    const zanGiverIdList = await Promise.all(promises_getZanGiverIdList);

    // 将回复数(reply_count)、各个一级评论的已点攒标识(added_zan_flag) 挂载到各个一级评论对象上
    remarks.forEach(item => {
      const replyCountObj = replyCountList.find(obj => obj.id === item.id);
      const zanGiverList = zanGiverIdList.find(
        obj => obj.length !== 0 && obj[0].remark_id === item.id
      );
      const addedZanFlag = !!(
        zanGiverList && zanGiverList.some(obj => obj.create_user === userId)
      );
      // 挂载到各个remark对象上
      item.reply_count = replyCountObj && replyCountObj.count;
      item.added_zan_flag = addedZanFlag;
    });

    return remarks;
  }

  async validateCategory(categoryId) {
    const sql = sqls.getValidCategoryIdList;
    const validIdList = await this.app.mysql.query(sql);
    const isValid = validIdList.some(item => item.id === categoryId);
    return isValid;
  }

  async getAllCollectedQuestionsByUserIdAndCategoryId(userId, categoryId) {
    const sql_getCollectedQuestionIdList =
      sqls.getCollectedQuestionIdListByUserIdAndCategoryId;
    const collectedQuestionIdList = await this.app.mysql.query(
      sql_getCollectedQuestionIdList,
      [userId, categoryId]
    );
    // 没有符合条件的题目
    if (collectedQuestionIdList.length === 0) {
      return [];
    }

    // 按照 collectedQuestionIdList中的 id 顺序，查询题目信息
    const collectedQuestionIds = collectedQuestionIdList.map(item => item.id);

    const sql_getQuestionsByIdList = sqls.getQuestionsByIdList;
    const promise_collectedQuestionDetails = this.app.mysql.query(
      sql_getQuestionsByIdList,
      [[collectedQuestionIds], collectedQuestionIds]
    );

    // 按照 collectedQuestionIdList中的 id 顺序，查询题目选项信息
    const sql_getOptionsByQuestionIdList = sqls.getOptionsByQuestionIdList;
    const promise_collectedQuestionOptions = this.app.mysql.query(
      sql_getOptionsByQuestionIdList,
      [[collectedQuestionIds], collectedQuestionIds]
    );

    const results = await Promise.all([
      promise_collectedQuestionDetails,
      promise_collectedQuestionOptions,
    ]);

    // 将 选项 挂载到相应的问题对象的options属性上
    const [questions, options] = results;
    questions.forEach(q => {
      const targetOptions = options.filter(
        option => option.question_id === q.id
      );
      q.options = targetOptions;
    });

    // 给每个题目对象添加 has_collected_flag 属性，标识 请求者是否已收藏该题目
    // 如果是查看的自己，则直接置 true
    const currentUserId = this.ctx.userId;
    if (userId === currentUserId) {
      questions.forEach(item => {
        item.has_collected_flag = true;
      });
      return questions;
    }
    const currentUserCollectedQuestionIdList = await this.app.mysql.query(
      sql_getCollectedQuestionIdList,
      [currentUserId, categoryId]
    );
    questions.forEach(q => {
      const hasCollected = currentUserCollectedQuestionIdList.some(
        item => item.id === q.id
      );
      q.has_collected_flag = hasCollected;
    });

    return questions;
  }

  async getMistakesByUserIdAndCategoryId(userId, categoryId) {
    // 获取用户对应类别所有错误题目的id集合
    const sql_getMistakeListByUserIdAndCategoryId =
      sqls.getMistakeListByUserIdAndCategoryId;
    let mistakeList = await this.app.mysql.query(
      sql_getMistakeListByUserIdAndCategoryId,
      [userId, categoryId, userId]
    );

    // 没有符合条件的题目
    if (mistakeList.length === 0) {
      return [];
    }

    // 按照 mistakeList 中 id 顺序，查询题目信息
    // 过滤掉 id 相同的项
    mistakeList = _.uniqBy(mistakeList, 'id');
    // 获取 id 数组
    const mistakeIds = mistakeList.map(item => item.id);

    const sql_getQuestionsByIdList = sqls.getQuestionsByIdList;
    const promise_mistokenQuestionDetails = this.app.mysql.query(
      sql_getQuestionsByIdList,
      [[mistakeIds], mistakeIds]
    );

    // 按照 mistakeList 中 id 顺序，查询题目选项信息
    const sql_getOptionsByQuestionIdList = sqls.getOptionsByQuestionIdList;
    const promise_mistokenQuestionOptions = this.app.mysql.query(
      sql_getOptionsByQuestionIdList,
      [[mistakeIds], mistakeIds]
    );

    // 按照 mistakeList 中 id 顺序，查询用户的回答信息
    const sql_getUserAnswersByQuestionIdList =
      sqls.getUserAnswersByQuestionIdList;
    const promise_userAnswers = this.app.mysql.query(
      sql_getUserAnswersByQuestionIdList,
      [userId, [mistakeIds]]
    );

    const results = await Promise.all([
      promise_mistokenQuestionDetails,
      promise_mistokenQuestionOptions,
      promise_userAnswers,
    ]);

    // 将 选项, 是否收藏标识, 用户答案 挂载到相应的问题对象的options属性上
    const [questions, options, userAnswers] = results;
    const uniqUserAnswers = _.uniqBy(userAnswers, 'question_id');
    questions.forEach(q => {
      const targetOptions = options.filter(
        option => option.question_id === q.id
      );
      const hasCollectedFlag =
        mistakeList.find(item => item.id === q.id).is_collected === 1;
      const userAnswer = uniqUserAnswers.find(item => item.question_id === q.id)
        .personal_answer;

      q.options = targetOptions;
      q.has_collected_flag = hasCollectedFlag;
      q.user_answer = userAnswer;
    });

    return questions;
  }

  async getCollectedQuestionCount(userId, groupByCategory) {
    if (groupByCategory) {
      const sql = sqls.getCollectedQuestionCountByCategory;
      const results = await this.app.mysql.query(sql, userId);
      return results;
    }
    const sql = sqls.getCollectedQuestionCount;
    const results = await this.app.mysql.query(sql, userId);
    return results[0];
  }

  async getMistokenQuestionCount(userId, groupByCategory) {
    if (groupByCategory) {
      const sql = sqls.getMistokenQuestionCountByCategory;
      const results = await this.app.mysql.query(sql, userId);
      return results;
    }

    const sql = sqls.getMistokenQuestionCount;
    const results = await this.app.mysql.query(sql, userId);
    return results[0];
  }

  async getQuestionCount(groupByCategory) {
    if (groupByCategory) {
      const sql = sqls.getQuestionCountByCategory;
      const results = await this.app.mysql.query(sql);
      return results;
    }

    const sql = sqls.getQuestionCount;
    const results = await this.app.mysql.query(sql);
    return results[0];
  }

  async getDoneRightQuestionCount(userId, groupByCategory) {
    if (groupByCategory) {
      const sql = sqls.getDoneRightQuestionCountByCategory;
      const results = await this.app.mysql.query(sql, userId);
      return results;
    }

    const sql = sqls.getDoneRightQuestionCount;
    const results = await this.app.mysql.query(sql, userId);
    return results[0];
  }

  async getDoneQuestionCount(userId, groupByCategory) {
    if (groupByCategory) {
      const sql = sqls.getDoneQuestionCountByCategory;
      const results = await this.app.mysql.query(sql, userId);
      return results;
    }

    const sql = sqls.getDoneQuestionCount;
    const results = await this.app.mysql.query(sql, userId);
    return results[0];
  }
}

module.exports = QuestionService;
