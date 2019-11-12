'use strict';

const Service = require('egg').Service;
const fsPromise = require('fs').promises;
const path = require('path');

class RegistService extends Service {
  async getUserByEmail(email) {
    const user = await this.app.mysql.get('t_user', { email });
    return user;
  }

  async createUser(user) {
    const result = await this.app.mysql.insert('t_user', user);
    if (result.affectedRows !== 1) {
      throw new Error('user create failed: ' + JSON.stringify(user));
    }
    return result.insertId;
  }

  async updateUser(user) {
    const result = await this.app.mysql.update('t_user', user);
    if (result.affectedRows !== 1) {
      throw new Error('user udpate failed: ' + JSON.stringify(user));
    }
    return true;
  }

  async sendRegistEmail(mailReceiver, activeCode) {
    // 根据当前请求使用的语言获取注册邮件所用的模板
    const curLanguage = this.ctx.helper.currentLanguage;
    const templateFilePath = path.join(
      __dirname,
      `../../config/mailTemplate/registMail.${curLanguage}.template`
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
      this.ctx.__('registService.registEmailSubject');
    const result = await this.ctx.helper.mailUtil.sendMail(
      mailReceiver,
      subject,
      templateStr
    );
    if (result.error) {
      throw new Error(`send regist mail failed: ${result.msg}`);
    }
    return result;
  }

  async activeUser(user) {
    const row = {
      id: user.id,
      is_active: 1,
      expire_time: this.ctx.helper.convertDateToString(new Date()), // 更新expire_time，防止再次请求仍然有效
      nickname:
        this.ctx.__('appName') + this.ctx.__('registService.No.{0}', [user.id]), // 设置默认昵称
    };

    const result = await this.app.mysql.update('t_user', row);
    if (result.affectedRows !== 1) {
      throw new Error('update user failed: ' + JSON.stringify(row));
    }
    return true;
  }
}

module.exports = RegistService;
