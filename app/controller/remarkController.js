'use strict';

const Controller = require('egg').Controller;

class RemarkController extends Controller {
  async addRemark() {
    const { ctx, service } = this;
    const { questionId, content } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        questionId: 'id',
        content: {
          type: 'string',
          trim: true,
        },
      },
      { questionId, content }
    );

    const { userId } = ctx;
    // 校验questionId合法性
    let errCode = 0,
      errMsg;
    const question = await service.questionService.getQuestionById(questionId);
    if (question === null) {
      errCode = 1;
      errMsg = ctx.__('remarkController.unexistQuestion');
    } else if (question.is_deleted === 1) {
      errCode = 2;
      errMsg = ctx.__('remarkController.deletedQuestion');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // XSS过滤
    const filteredContent = ctx.helper.escape(content);
    // 添加评论到数据库
    await service.remarkService.addRemark(questionId, userId, filteredContent);
    ctx.body = true;
  }

  async getRemark() {
    const { ctx, service } = this;
    let { remarkId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        remarkId: 'id',
      },
      { remarkId }
    );

    // 校验是否存在该评论
    remarkId = parseInt(remarkId);
    const remark = await service.remarkService.getRemarkById(remarkId);

    let errCode = 0,
      errMsg;
    if (remark === null) {
      errCode = 1;
      errMsg = ctx.__('remarkController.unexistRemark');
    } else if (remark.is_deleted === 1) {
      errCode = 2;
      errMsg = ctx.__('remarkController.deletedRemark');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    const { userId } = ctx;
    // 获取该评论的详细信息
    const remarkDetails = await service.remarkService.getRemarkDetails(
      remark,
      userId
    );

    ctx.body = {
      remark: remarkDetails,
    };
  }

  async addZan() {
    const { ctx, service } = this;
    let { remarkId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        remarkId: 'id',
      },
      { remarkId }
    );

    // 校验是否存在该评论
    remarkId = parseInt(remarkId);
    const remark = await service.remarkService.getRemarkById(remarkId);

    let errCode = 0,
      errMsg;
    if (remark === null) {
      errCode = 1;
      errMsg = ctx.__('remarkController.unexistRemark');
    } else if (remark.is_deleted === 1) {
      errCode = 2;
      errMsg = ctx.__('remarkController.deletedRemark');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 校验是否已经点过赞
    const { userId } = ctx;
    const hasGivenZan = await service.remarkService.hasGivenZan(
      remarkId,
      userId
    );
    if (hasGivenZan) {
      ctx.body = {
        code: 3,
        msg: ctx.__('remarkController.hasGivenZan'),
      };
      return;
    }

    await service.remarkService.addZan(remark, userId);

    ctx.body = true;
  }

  async removeZan() {
    const { ctx, service } = this;
    let { remarkId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        remarkId: 'id',
      },
      { remarkId }
    );

    // 校验是否存在该评论
    remarkId = parseInt(remarkId);
    const remark = await service.remarkService.getRemarkById(remarkId);

    let errCode = 0,
      errMsg;
    if (remark === null) {
      errCode = 1;
      errMsg = ctx.__('remarkController.unexistRemark');
    } else if (remark.is_deleted === 1) {
      errCode = 2;
      errMsg = ctx.__('remarkController.deletedRemark');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 校验是否点过赞
    const { userId } = ctx;
    const hasGivenZan = await service.remarkService.hasGivenZan(
      remarkId,
      userId
    );
    if (!hasGivenZan) {
      ctx.body = {
        code: 3,
        msg: ctx.__('remarkController.hasNotGivenZan'),
      };
      return;
    }

    await service.remarkService.removeZan(remark, userId);

    ctx.body = true;
  }

  async addReply() {
    const { ctx, service } = this;
    let { remarkId } = ctx.params;
    const { questionId, content, replyTo } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        questionId: {
          type: 'int',
          format: /^\d+$/,
        },
        remarkId: 'id',
        replyTo: {
          type: 'int',
          format: /^\d+$/,
        },
        content: {
          type: 'string',
          trim: true,
        },
      },
      { remarkId, questionId, content, replyTo }
    );

    const { userId } = ctx;
    // 校验questionId合法性
    let errCode = 0,
      errMsg;
    const question = await service.questionService.getQuestionById(questionId);
    if (question === null) {
      errCode = 1;
      errMsg = ctx.__('remarkController.unexistQuestion');
    } else if (question.is_deleted === 1) {
      errCode = 2;
      errMsg = ctx.__('remarkController.deletedQuestion');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 校验是否存在该评论
    remarkId = parseInt(remarkId);
    const remark = await service.remarkService.getRemarkById(remarkId);
    if (remark === null) {
      ctx.body = {
        code: 3,
        msg: ctx.__('remarkController.unexistRemark'),
      };
      return;
    }

    // 校验回复用户replyTo 是否存在
    const replyToUser = await service.userService.getUserById(replyTo);
    if (replyToUser === null) {
      ctx.body = {
        code: 4,
        msg: ctx.__('remarkController.unexistReplyToUser'),
      };
      return;
    }

    // XSS过滤
    const filteredContent = ctx.helper.escape(content);
    // 添加回复评论到数据库
    const remarkObj = {
      question_id: questionId,
      parent_id: remarkId,
      reply_to: replyTo,
      create_user: userId,
      content: filteredContent,
      create_time: ctx.helper.convertDateToString(new Date()),
    };
    await service.remarkService.addReplyRemark(remarkObj);
    ctx.body = true;
  }
}

module.exports = RemarkController;
