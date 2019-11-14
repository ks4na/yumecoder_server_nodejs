'use strict';

const Service = require('egg').Service;

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
}

module.exports = QuestionService;
