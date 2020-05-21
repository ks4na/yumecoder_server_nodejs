'use strict';

const Controller = require('egg').Controller;
const _ = require('lodash');

class QuestionController extends Controller {
  async addToCollection() {
    const { ctx, service } = this;
    let { questionId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        questionId: 'id',
      },
      { questionId }
    );

    // 校验是否做过该题目以及是否已收藏
    const { userId } = ctx;
    questionId = parseInt(questionId);
    const doneQuestion = await service.questionService.getDoneQuestionByQuestionIdAndUserId(
      questionId,
      userId
    );
    let errCode = 0,
      errMsg;
    if (doneQuestion === null) {
      errCode = 1;
      errMsg = ctx.__('questionController.notInDoneQuestion');
    } else if (doneQuestion.is_collected === 1) {
      errCode = 2;
      errMsg = ctx.__('questionController.hasCollected');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 更新收藏字段
    await service.questionService.updateCollectFlag(doneQuestion.id, 1);

    ctx.body = true;
  }

  async removeFromCollection() {
    const { ctx, service } = this;
    let { questionId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        questionId: 'id',
      },
      { questionId }
    );

    // 校验是否做过该题目以及是否已收藏
    const { userId } = ctx;
    questionId = parseInt(questionId);
    const doneQuestion = await service.questionService.getDoneQuestionByQuestionIdAndUserId(
      questionId,
      userId
    );
    let errCode = 0,
      errMsg;
    if (doneQuestion === null) {
      errCode = 1;
      errMsg = ctx.__('questionController.notInDoneQuestion');
    } else if (doneQuestion.is_collected === 0) {
      errCode = 2;
      errMsg = ctx.__('questionController.notInCollection');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 更新收藏字段
    await service.questionService.updateCollectFlag(doneQuestion.id, 0);

    ctx.body = true;
  }

  async getQuestionRemarks() {
    const { ctx, service } = this;
    let { questionId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        questionId: 'id',
      },
      { questionId }
    );

    // 校验题目是否存在
    questionId = parseInt(questionId);
    const question = await service.questionService.getQuestionById(questionId);
    if (question === null) {
      ctx.body = {
        code: 1,
        msg: ctx.__('questionController.unexistQuestion'),
      };
      return;
    }

    // 获取题目评论（包含是否点过赞：added_zan_flag, 回复数 reply_count
    const { userId } = ctx;
    const detailedRemarks = await service.questionService.getDetailedRemarksByQuestionId(
      questionId,
      userId
    );

    ctx.body = {
      remarks: detailedRemarks,
    };
  }

  async getCollectedQuestionsByCategoryId() {
    const { ctx, service } = this;
    let { categoryId, userId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        categoryId: 'id',
        userId: 'id',
      },
      { categoryId, userId }
    );

    // 校验categoryId是否合法
    categoryId = parseInt(categoryId);
    userId = parseInt(userId);
    const isValidCategory = await service.questionService.validateCategory(
      categoryId
    );
    if (!isValidCategory) {
      ctx.body = {
        code: 1,
        msg: ctx.__('questionController.invalidCategoryId'),
      };
      return;
    }

    // 校验用户是否存在
    const user = await service.userService.getUserById(userId);
    if (user === null) {
      ctx.body = {
        code: 2,
        msg: ctx.__('questionController.unexistUser'),
      };
      return;
    }

    // 获取该用户对应的二级分类下所有题目
    const collectedQuestions = await service.questionService.getAllCollectedQuestionsByUserIdAndCategoryId(
      userId,
      categoryId
    );

    const userInfo = _.pick(user, 'id', 'nickname', 'gender', 'avatar');
    ctx.body = {
      owner: userInfo,
      questions: collectedQuestions,
    };
  }

  async getCollectionsByCategoryId() {
    const { ctx, service } = this;
    let { categoryId } = ctx.params;
    const { userId } = ctx;

    // 参数校验
    ctx.validate(
      {
        categoryId: 'id',
      },
      { categoryId }
    );

    // 校验 categoryId 是否合法
    categoryId = parseInt(categoryId);
    const isValidCategory = await service.questionService.validateCategory(
      categoryId
    );
    if (!isValidCategory) {
      ctx.body = {
        code: 1,
        msg: ctx.__('questionController.invalidCategoryId'),
      };
      return;
    }

    // 获取该用户对应的二级分类下所有题目
    const collectedQuestions = await service.questionService.getAllCollectedQuestionsByUserIdAndCategoryId(
      userId,
      categoryId
    );

    ctx.body = collectedQuestions;
  }

  async gitMistakes() {
    const { ctx, service } = this;
    let { categoryId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        categoryId: 'id',
      },
      { categoryId }
    );

    // 校验categoryId是否合法
    categoryId = parseInt(categoryId);
    const isValidCategory = await service.questionService.validateCategory(
      categoryId
    );
    if (!isValidCategory) {
      ctx.body = {
        code: 1,
        msg: ctx.__('questionController.invalidCategoryId'),
      };
      return;
    }

    // 获取当前用户，对应类别的所有错题
    const { userId } = ctx;
    const mistakes = await service.questionService.getMistakesByUserIdAndCategoryId(
      userId,
      categoryId
    );

    ctx.body = {
      mistakes,
    };
  }

  async getQuestionCountByCondition() {
    const { ctx, service } = this;
    const { type, groupByCategory = 'false' } = ctx.query;
    const acceptableTypes = ['all', 'done', 'collected', 'mistake', 'right'];

    // 参数校验
    ctx.validate(
      {
        type: {
          type: 'enum',
          values: acceptableTypes,
        },
        groupByCategory: {
          type: 'enum',
          values: ['true', 'false'],
        },
      },
      { type, groupByCategory }
    );

    const { userId } = ctx;
    const bool_groupByCategory = groupByCategory === 'true';
    let ret;
    switch (type) {
      case 'all':
        ret = await service.questionService.getQuestionCount(
          bool_groupByCategory
        );
        break;
      case 'done':
        ret = await service.questionService.getDoneQuestionCount(
          userId,
          bool_groupByCategory
        );
        break;
      case 'collected':
        ret = await service.questionService.getCollectedQuestionCount(
          userId,
          bool_groupByCategory
        );
        break;
      case 'mistake':
        ret = await service.questionService.getMistokenQuestionCount(
          userId,
          bool_groupByCategory
        );
        break;
      case 'right':
        ret = await service.questionService.getDoneRightQuestionCount(
          userId,
          bool_groupByCategory
        );
        break;
      default:
        throw new Error('unknown type');
    }

    ctx.body = ret;
  }
}
module.exports = QuestionController;
