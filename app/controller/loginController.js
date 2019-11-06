'use strict';

const Controller = require('egg').Controller;
const md5 = require('md5');

class LoginController extends Controller {
  async login() {
    const { ctx } = this;
    const { loginService } = this.service;

    // 参数校验
    const { account, password } = ctx.request.body;
    ctx.validate(
      {
        account: 'email',
        password: {
          type: 'password',
          min: 6,
        },
      },
      { account, password }
    );

    const user = await loginService.getUserByEmail(account);
    let errCode = 0,
      errMsg;
    if (user === null) {
      errCode = 1;
      errMsg = ctx.__('loginController.unexistUser');
    } else if (user.is_active === 0) {
      errCode = 2;
      errMsg = ctx.__('loginController.inactiveUser');
    } else if (user.password !== md5(password + this.config.md5.salt)) {
      errCode = 3;
      errMsg = ctx.__('loginController.incorrectAccountOrPwd');
    }

    // 如果存在errCode，返回错误信息
    if (errCode !== 0) {
      ctx.status = 400;
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 更新登录信息，即：最后一次登录时间和练习天数,返回accessToken和refreshToken
    const { accessToken, refreshToken } = await loginService.updateLoginInfo(
      user
    );
    ctx.body = {
      code: errCode,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refreshToken() {
    const { ctx } = this;
    const { loginService } = this.service;

    // 参数校验
    const { refresh_token } = ctx.request.body;
    ctx.validate(
      {
        refresh_token: 'string',
      },
      { refresh_token }
    );

    const result = await loginService.refreshToken(refresh_token);
    ctx.body = result.data;
    if (result.err) {
      ctx.status = 401;
    }
  }
}

module.exports = LoginController;
