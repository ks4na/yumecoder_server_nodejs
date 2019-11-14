'use strict';

const Service = require('egg').Service;
const sqls = require('../../config/sql/userService.js');

class UserService extends Service {
  async getUserByEmail(email) {
    const user = await this.app.mysql.get('t_user', { email });
    return user;
  }

  async updateUserById(user) {
    const result = await this.app.mysql.update('t_user', user);
    if (result.affectedRows !== 1) {
      throw new Error('user info update failed: ' + JSON.stringify(user));
    }
    return true;
  }

  async getUserById(id) {
    const user = await this.app.mysql.get('t_user', { id });
    return user;
  }

  async updateDoneQuestionNumberById(userId, addedDoneQuestionCount) {
    const sql = sqls.updateDoneQuestionNumberById;
    const result = await this.app.mysql.query(sql, [
      addedDoneQuestionCount,
      userId,
    ]);
    if (result.affectedRows !== 1) {
      throw new Error(
        `update user.done_question_number failed: userId: ${userId}, addedDoneQuestionCount: ${addedDoneQuestionCount} `
      );
    }
    return true;
  }
}

module.exports = UserService;
