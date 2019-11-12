'use strict';

const Controller = require('egg').Controller;
const md5 = require('md5');

class RegistController extends Controller {
  async isUsedEmail() {
    const { ctx, service } = this;
    const { email } = ctx.query;
    // 参数校验
    ctx.validate(
      {
        email: 'email',
      },
      { email }
    );
    const user = await service.registService.getUserByEmail(email);
    const isUsedEmail = user && user.is_active === 1;
    if (isUsedEmail) {
      ctx.body = true;
      return;
    }
    ctx.body = false;
  }

  async registValidate() {
    const { ctx, service } = this;
    const { email, password, captcha } = ctx.request.body;
    // 参数校验
    ctx.validate(
      {
        email: 'email',
        password: {
          type: 'password',
          min: 6,
          max: 18,
        },
        captcha: 'string',
      },
      {
        email,
        password,
        captcha,
      }
    );

    // 检测验证码是否失效
    const captchaFlag = await ctx.helper.captchaUtil.validate(captcha);
    if (captchaFlag === false) {
      ctx.body = {
        code: 1,
        msg: ctx.__('registController.invalidCaptcha'),
      };
      return;
    }

    // 检测邮箱是否已被使用(已被使用： 已注册且已激活)
    const user = await service.registService.getUserByEmail(email);
    const isUsedEmail = user && user.is_active === 1;
    if (isUsedEmail) {
      ctx.body = {
        code: 2,
        msg: ctx.__('registController.usedEmail'),
      };
      return;
    }

    let mailReceiver, activeCode;
    const activeCodeExpireTime = new Date(
      Date.now() + this.config.mailConfig.activeCodeEmailExpireIn * 60 * 1000
    );
    // 1. 已注册但未激活的邮箱用户
    if (user) {
      const row = {
        id: user.id,
        password: md5(password + this.config.md5.salt),
        create_time: ctx.helper.convertDateToString(new Date()),
        expire_time: ctx.helper.convertDateToString(activeCodeExpireTime),
        active_code: ctx.helper.generateActiveCode(),
      };
      await service.registService.updateUser(row);

      // 给 mailReceiver 和 activeCode 赋值，用于发送激活邮件
      mailReceiver = user.email;
      activeCode = row.active_code;
    } else {
      // 2. 从未注册过的邮箱用户
      const row = {
        email,
        password: md5(password + this.config.md5.salt),
        create_time: ctx.helper.convertDateToString(new Date()),
        expire_time: ctx.helper.convertDateToString(activeCodeExpireTime),
        active_code: ctx.helper.generateActiveCode(),
      };
      await service.registService.createUser(row);

      // 给 mailReceiver 和 activeCode 赋值，用于发送激活邮件
      mailReceiver = email;
      activeCode = row.active_code;
    }

    // 发送激活邮件
    await service.registService.sendRegistEmail(mailReceiver, activeCode);

    ctx.body = true;
  }

  async active() {
    const { ctx, service } = this;
    const { email, activeCode } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        email: 'email',
        activeCode: {
          type: 'string',
          format: /\d{6}/,
        },
      },
      { email, activeCode }
    );

    const user = await service.registService.getUserByEmail(email);
    let errCode = 0,
      errMsg;
    if (user === null) {
      errCode = 1;
      errMsg = ctx.__('registController.unexistUser');
    } else if (user.is_active === 1) {
      errCode = 2;
      errMsg = ctx.__('registController.activedUser');
    } else if (
      user.active_code !== activeCode ||
      new Date() >= new Date(user.expire_time)
    ) {
      errCode = 3;
      errMsg = ctx.__('registController.activeCodeIsWrongOrExpired');
    }
    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 激活当前用户
    await service.registService.activeUser(user);

    ctx.body = true;
  }
}

module.exports = RegistController;
