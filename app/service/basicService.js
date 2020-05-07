'use strict';

const Service = require('egg').Service;
const path = require('path');
const fsPromise = require('fs').promises;

class BasicService extends Service {
  async sendResetPwdMail(mailReceiver, activeCode) {
    // 根据当前使用的言语获取邮件模板
    const curLanguage = this.ctx.helper.currentLanguage;
    const templateFilePath = path.join(
      __dirname,
      `../../config/mailTemplate/resetPwdMail.${curLanguage}.template`
    );
    let templateStr = await fsPromise.readFile(templateFilePath, {
      encoding: 'utf-8',
    });

    // 获取配置文件的激活码过期时间（activeCodeEmailExpireIn）
    const { activeCodeEmailExpireIn } = this.config.mailConfig;
    // 替换占位符为变量值
    templateStr = templateStr.replace('{{appName}}', this.ctx.__('appName'));
    templateStr = templateStr.replace(
      '{{activeCodeEmailExpireIn}}',
      activeCodeEmailExpireIn
    );
    templateStr = templateStr.replace('{{activeCode}}', activeCode);

    // 发送邮件
    const subject =
      this.ctx.__('appName') +
      ': ' +
      this.ctx.__('basicService.resetPwdEmailSubject');
    const result = await this.ctx.helper.mailUtil.sendMail(
      mailReceiver,
      subject,
      templateStr
    );
    if (result.error) {
      throw new Error(`send password-reset mail failed: ${result.msg}`);
    }
    return result;
  }

  async updatePwd(id, password) {
    const row = {
      id,
      password,
      expire_time: this.ctx.helper.convertDateToString(new Date()), // 刷新expire_time,避免重复请求仍然有效
      refresh_token: null, // 清除 refresh_token，让原来的 refresh_token 失效，已有的 access_token 过期后强制重新登录
    };
    const result = await this.app.mysql.update('t_user', row);
    if (result.affectedRows !== 1) {
      throw new Error('update pwd failed: ' + JSON.stringify(row));
    }
    return true;
  }
}

module.exports = BasicService;
