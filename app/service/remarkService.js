'use strict';

const Service = require('egg').Service;
const _ = require('lodash');
const sqls_user = require('../../config/sql/userService.js');

class RemarkService extends Service {
  async addRemark(questionId, userId, content) {
    const remarkRow = {
      question_id: questionId,
      content,
      create_user: userId,
      create_time: this.ctx.helper.convertDateToString(new Date()),
    };
    const insertResult = await this.app.mysql.insert(
      't_questionremark',
      remarkRow
    );
    if (insertResult.affectedRows !== 1) {
      throw new Error(
        'insert questionRemark failed: ' + JSON.stringify(remarkRow)
      );
    }
    return true;
  }

  async getRemarkById(id) {
    const remark = await this.app.mysql.get('t_questionremark', { id });
    return remark;
  }

  async getRemarkDetails(remark, userId) {
    const remarkCreater = await this.app.mysql.get('t_user', {
      id: remark.create_user,
    });
    if (!remarkCreater) {
      throw new Error('get remark creater failed: ' + JSON.stringify(remark));
    }
    const detailedRemark = Object.assign({}, remark);
    // 覆盖create_user属性为对象
    detailedRemark.create_user = _.pick(remarkCreater, [
      'id',
      'nickname',
      'avatar',
    ]);
    // 添加added_zan_flag 标识当前用户是否给该评论点过赞
    const zanGiverIdList = await this.app.mysql.select('t_zan', {
      where: { remark_id: remark.id },
      columns: ['create_user'],
    });
    const added_zan_flag = zanGiverIdList.some(
      item => item.create_user === userId
    );
    detailedRemark.added_zan_flag = added_zan_flag;

    // 挂载评论的回复评论信息 replyList 到 detailedRemark 的 replies 属性上
    const replyList = await this.getReplyListByRemarkId(remark.id);
    detailedRemark.replies = replyList;

    return detailedRemark;
  }

  async getReplyListByRemarkId(remarkId) {
    const replyList = await this.app.mysql.select('t_questionremark', {
      where: { parent_id: remarkId },
      orders: [['create_time', 'asc']],
    });
    if (replyList.length === 0) {
      return replyList;
    }
    let relatedUserIds = [];
    replyList.forEach(item => {
      relatedUserIds.push(item.create_user);
      relatedUserIds.push(item.reply_to);
    });
    // 去除 0 和 重复的元素
    relatedUserIds = _.uniq(relatedUserIds).filter(item => item !== 0);
    const users = await this.app.mysql.select('t_user', {
      where: { id: relatedUserIds },
    });
    // 替换replyList中每一项的create_user、reply_to 为详细用户信息
    replyList.forEach(item => {
      const createdUser = users.find(user => user.id === item.create_user);
      item.create_user = _.pick(createdUser, ['id', 'nickname', 'avatar']);
      if (item.reply_to) {
        const replyTo = users.find(user => user.id === item.reply_to);
        item.reply_to = _.pick(replyTo, ['id', 'nickname', 'avatar']);
      } else {
        item.reply_to = null;
      }

      // 如果已删除的话，将content修改为空
      item.is_deleted === 1
        ? (item.content = this.ctx.__('remarkService.deletedReply'))
        : undefined;
    });
    return replyList;
  }

  async addZan(remark, userId) {
    // 开启事务
    const result = await this.app.mysql.beginTransactionScope(async conn => {
      // 更新 t_questionremark 表的 zan 字段
      const updateQRRow = {
        id: remark.id,
        zan: remark.zan + 1,
      };
      const updateQRResult = await conn.update('t_questionremark', updateQRRow);
      if (updateQRResult.affectedRows !== 1) {
        throw new Error(
          'update t_questionremark.zan field failed: ' +
            JSON.stringify(updateQRRow)
        );
      }

      // 添加点赞记录到 t_zan 表
      const insertZanRow = {
        remark_id: remark.id,
        receiver: remark.create_user,
        create_user: userId,
        create_time: this.ctx.helper.convertDateToString(new Date()),
      };
      const insertZanResult = await conn.insert('t_zan', insertZanRow);
      if (insertZanResult.affectedRows !== 1) {
        throw new Error(
          'insert zan info failed: ' + JSON.stringify(insertZanRow)
        );
      }

      // 生成点赞信息的消息，添加到 t_message 表， 如果点赞给自己则不需要生成点赞消息
      if (remark.create_user === userId) {
        return true;
      }
      const insertMsgRow = {
        remark_id: remark.id,
        create_user: userId,
        type: 4, // 点赞信息 type = 4
        receiver: remark.create_user,
        create_time: this.ctx.helper.convertDateToString(new Date()),
      };
      const insertMsgResult = await conn.insert('t_message', insertMsgRow);
      if (insertMsgResult.affectedRows !== 1) {
        throw new Error(
          'insert message info failed: ' + JSON.stringify(insertMsgRow)
        );
      }

      // 更新用户表中评论创建者的成就值字段 credits
      const sql = sqls_user.addOneCreditNumberByUserId;
      const result = await conn.query(sql, [remark.create_user]);
      if (result.affectedRows !== 1) {
        throw new Error(
          'addOneCredit failed: userId: ' + JSON.stringify(remark.create_user)
        );
      }

      return true;
    }, this.ctx);

    return true;
  }

  async hasGivenZan(remarkId, userId) {
    const results = await this.app.mysql.select('t_zan', {
      where: { create_user: userId, remark_id: remarkId },
    });
    if (results.length !== 0) {
      return true;
    }
    return false;
  }

  async removeZan(remark, userId) {
    // 开启事务
    const result = await this.app.mysql.beginTransactionScope(async conn => {
      // 更新 t_questionremark 的 zan 字段
      const updateQRRow = {
        id: remark.id,
        zan: remark.zan - 1,
      };
      const updateQRResult = await conn.update('t_questionremark', updateQRRow);
      if (updateQRResult.affectedRows !== 1) {
        throw new Error(
          'update t_questionremark.zan field failed: ' +
            JSON.stringify(updateQRRow)
        );
      }

      // 删除点赞信息
      const options = {
        create_user: userId,
        remark_id: remark.id,
      };
      const delZanResult = await conn.delete('t_zan', options);
      if (delZanResult.affectedRows !== 1) {
        throw new Error('delete zan info failed: ' + JSON.stringify(options));
      }

      // 删除点赞信息 的通知 message， 如果是自己移除给自己的点赞无需操作
      if (remark.create_user === userId) {
        return true;
      }
      const delMsgOptions = {
        remark_id: remark.id,
        create_user: userId,
        type: 4, // 点赞信息，type = 4
      };
      const delMsgResult = await conn.delete('t_message', delMsgOptions);
      if (delMsgResult.affectedRows !== 1) {
        throw new Error(
          'del zan message failed: ' + JSON.stringify(delMsgOptions)
        );
      }

      // 评论创建者的credits - 1
      const sql = sqls_user.removeOneCreditNumberByUserId;
      const result = await conn.query(sql, [remark.create_user]);
      if (result.affectedRows !== 1) {
        throw new Error(
          'removeOneCredit failed: removeOneCredit userId: ' +
            JSON.stringify(remark.create_user)
        );
      }

      return true;
    }, this.ctx);

    return result;
  }

  async addReplyRemark(remark) {
    // 开启事务
    const result = await this.app.mysql.beginTransactionScope(async conn => {
      // 添加评论
      const addRemarkResult = await conn.insert('t_questionremark', remark);
      if (addRemarkResult.affectedRows !== 1) {
        throw new Error('insert replyRemark failed: ' + JSON.stringify(remark));
      }

      // 添加 回复评论通知 到 t_message, 如果回复的是自己不需要写入到 t_message
      if (remark.reply_to === remark.create_user) {
        return true;
      }
      const insertMsgRow = {
        type: 3, // 回复评论， type = 3
        remark_id: remark.parent_id,
        content: remark.content,
        create_user: remark.create_user,
        receiver: remark.reply_to,
        create_time: this.ctx.helper.convertDateToString(new Date()),
      };
      const insertMsgResult = await conn.insert('t_message', insertMsgRow);
      if (insertMsgResult.affectedRows !== 1) {
        throw new Error(
          'insert message failed: ' + JSON.stringify(insertMsgRow)
        );
      }

      return true;
    }, this.ctx);

    return result;
  }
}

module.exports = RemarkService;
