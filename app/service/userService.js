'use strict';

const Service = require('egg').Service;

class UserService extends Service {
  async getUserByEmail(email) {
    const user = await this.app.mysql.get('t_user', { email });
    return user;
  }

  async updateUserById(user) {
    const result = await this.app.mysql.update('t_user', user);
    if (result.affectedRows !== 1) {
      throw new Error('user info update failed');
    }
    return true;
  }
}

module.exports = UserService;
