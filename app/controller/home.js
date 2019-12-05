'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    const { host, port, database } = ctx.app.config.mysql.client;
    const retBody = {
      currentLanguage: ctx.helper.currentLanguage,
      env: ctx.app.config.env,
      database: `${host}:${port}/${database}`,
    };
    ctx.body = retBody;
  }

  async getToken() {
    const jwt = require('jsonwebtoken');
    let { userId } = this.ctx.params;
    userId = parseInt(userId);
    const access_token = jwt.sign(
      { userId },
      this.config.token.accessTokenSecret,
      { expiresIn: '7d' }
    );
    const refresh_token = jwt.sign(
      { userId },
      this.config.token.refreshTokenSecret,
      { expiresIn: '7d' }
    );
    const expired_access_token = jwt.sign(
      { userId },
      this.config.token.accessTokenSecret,
      { expiresIn: 0 }
    );
    this.ctx.body = {
      access_token,
      refresh_token,
      expired_access_token,
    };
  }
}

module.exports = HomeController;
