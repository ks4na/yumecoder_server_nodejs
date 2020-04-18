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
          max: 18,
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
    ctx.body = result;
  }

  async qqLogin() {
    const { ctx, service } = this;
    const { openId, nickname, gender, avatar } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        openId: 'string',
        nickname: 'string',
        gender: 'string',
        avatar: 'string',
      },
      { openId, nickname, gender, avatar }
    );

    // 查询数据库该openId对应的用户， 没有则新增用户记录
    const otherLoginInfo = { open_id: openId, provider: 'qq' };
    let user = await service.loginService.getUserByOtherLoginInfo(
      otherLoginInfo
    );
    let generatedTokens; // 保存生成的access_token和refresh_token
    if (user === null) {
      user = {
        nickname,
        avatar,
        gender: gender === '男' ? 1 : gender === '女' ? 2 : 0,
        create_time: ctx.helper.convertDateToString(new Date()),
        is_active: 1,
        // 由于三方登录，无需以下字段，但数据库要求非空，所以任意设置
        password: 'otherlogin_qq',
        active_code: ctx.helper.generateActiveCode(),
        expire_time: ctx.helper.convertDateToString(new Date()),
      };

      // 创建该用户，返回accessToken和refreshToken
      generatedTokens = await service.loginService.createOtherLoginUser(
        user,
        otherLoginInfo
      );
    } else {
      // 更新登录信息，即：最后一次登录时间和练习天数,返回accessToken和refreshToken
      generatedTokens = await service.loginService.updateLoginInfo(user);
    }

    ctx.body = {
      code: 0,
      access_token: generatedTokens.accessToken,
      refresh_token: generatedTokens.refreshToken,
    };
  }

  async githubLogin() {
    const { ctx, service } = this;
    const { code } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        code: 'string',
      },
      { code }
    );

    const responseData = await ctx.helper.githubUtil.exchangeCodeForAccessToken(
      code
    );
    if (!responseData) {
      ctx.body = {
        code: 1,
        msg: ctx.__('loginController.getGithubAccessTokenFailed'),
      };
      return;
    }
    const { access_token: accessToken, token_type: tokenType } = responseData;
    if (!accessToken || !tokenType) {
      ctx.body = {
        code: 1,
        msg: ctx.__('loginController.getGithubAccessTokenFailed'),
      };
      return;
    }
    const userInfo = await ctx.helper.githubUtil.getUserInfoByAccessToken(
      accessToken,
      tokenType
    );

    if (!userInfo) {
      ctx.body = {
        code: 2,
        msg: ctx.__('loginController.getGithubUserInfoFailed'),
      };
      return;
    }
    const { login: nickname, id: openId, avatar_url: avatar } = userInfo;
    if (!openId) {
      ctx.body = {
        code: 2,
        msg: ctx.__('loginController.getGithubUserInfoFailed'),
      };
    }

    // 查询数据库该openId对应的 github 用户， 没有则新增用户记录
    const otherLoginInfo = { open_id: openId, provider: 'github' };
    let user = await service.loginService.getUserByOtherLoginInfo(
      otherLoginInfo
    );
    let generatedTokens; // 保存生成的access_token和refresh_token
    if (user === null) {
      user = {
        nickname,
        avatar,
        gender: 0, // github 不提供 gender 属性，设置为 0
        create_time: ctx.helper.convertDateToString(new Date()),
        is_active: 1,
        // 由于三方登录，无需以下字段，但数据库要求非空，所以任意设置
        password: 'otherlogin_github',
        active_code: ctx.helper.generateActiveCode(),
        expire_time: ctx.helper.convertDateToString(new Date()),
      };

      // 创建该用户，返回accessToken和refreshToken
      generatedTokens = await service.loginService.createOtherLoginUser(
        user,
        otherLoginInfo
      );
    } else {
      // 更新登录信息，即：最后一次登录时间和练习天数,返回accessToken和refreshToken
      generatedTokens = await service.loginService.updateLoginInfo(user);
    }

    ctx.body = {
      code: 0,
      access_token: generatedTokens.accessToken,
      refresh_token: generatedTokens.refreshToken,
    };
  }
}

module.exports = LoginController;
