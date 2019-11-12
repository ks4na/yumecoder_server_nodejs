'use strict';

const Controller = require('egg').Controller;
const md5 = require('md5');

class BasicController extends Controller {
  async resetPwdValidate() {
    const { ctx, service } = this;
    const { email, captcha } = ctx.request.body;
    // 参数校验
    ctx.validate(
      {
        email: 'email',
        captcha: 'string',
      },
      { email, captcha }
    );

    // 校验验证码有效性
    const captchaFlag = await ctx.helper.captchaUtil.validate(captcha);
    if (!captchaFlag) {
      ctx.body = {
        code: 1,
        msg: ctx.__('basicController.invalidCaptcha'),
      };
      return;
    }

    const user = await service.userService.getUserByEmail(email);
    let errCode = 0,
      errMsg;
    if (user === null) {
      errCode = 2;
      errMsg = ctx.__('basicController.unexistUser');
    } else if (user.is_active === 0) {
      errCode = 3;
      errMsg = ctx.__('basicController.inactiveUser');
    }

    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 更新该用户的激活验证字段
    const active_code = ctx.helper.generateActiveCode();
    const expire_time = new Date(
      Date.now() + this.config.mailConfig.activeCodeEmailExpireIn * 60 * 1000
    );
    const row = {
      id: user.id,
      active_code,
      expire_time: ctx.helper.convertDateToString(expire_time),
    };
    await service.userService.updateUserById(row);

    // 发送重置密码的邮件
    await service.basicService.sendResetPwdMail(email, active_code);

    ctx.body = true;
  }

  async resetPwd() {
    const { ctx, service } = this;
    const { email, password, activeCode } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        email: 'email',
        password: {
          type: 'password',
          min: 6,
        },
        activeCode: {
          type: 'string',
          format: /\d{6}/,
        },
      },
      { email, password, activeCode }
    );

    const user = await service.userService.getUserByEmail(email);
    let errCode = 0,
      errMsg;
    if (user === null) {
      errCode = 1;
      errMsg = ctx.__('basicController.unexistUser');
    } else if (user.is_active === 0) {
      errCode = 2;
      errMsg = ctx.__('basicController.inactiveUser');
    } else if (
      user.active_code !== activeCode ||
      new Date() >= new Date(user.expire_time)
    ) {
      errCode = 3;
      errMsg = ctx.__('basicController.activeCodeIsWrongOrExpired');
    }
    if (errCode !== 0) {
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    // 更新密码
    await service.basicService.updatePwd(
      user.id,
      md5(password + this.config.md5.salt)
    );

    ctx.body = true;
  }
}

module.exports = BasicController;
