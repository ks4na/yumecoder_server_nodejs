'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async index() {
    const { ctx } = this;
    ctx.body = 'hi, egg' + ctx.helper.currentLanguage;
  }

  async getToken() {
    const jwt = require('jsonwebtoken');
    const access_token = jwt.sign(
      { userId: 123 },
      this.config.token.accessTokenSecret,
      { expiresIn: '7d' }
    );
    const refresh_token = jwt.sign(
      { userId: 123 },
      this.config.token.refreshTokenSecret,
      { expiresIn: '7d' }
    );
    const expired_access_token = jwt.sign(
      { userId: 123 },
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
