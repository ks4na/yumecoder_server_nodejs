'use strict';

const Service = require('egg').Service;
const sqls = require('../../config/sql/userService.js');
const uuid = require('uuid');

class UserService extends Service {
  async getUserByEmail(email) {
    const user = await this.app.mysql.get('t_user', { email });
    return user;
  }

  async updateUserById(user) {
    const result = await this.app.mysql.update('t_user', user);
    if (result.affectedRows !== 1) {
      throw new Error('user info update failed: ' + JSON.stringify(user));
    }
    return true;
  }

  async getUserById(id) {
    const user = await this.app.mysql.get('t_user', { id });
    return user;
  }

  async updateDoneQuestionNumberById(userId, addedDoneQuestionCount) {
    const sql = sqls.updateDoneQuestionNumberById;
    const result = await this.app.mysql.query(sql, [
      addedDoneQuestionCount,
      userId,
    ]);
    if (result.affectedRows !== 1) {
      throw new Error(
        `update user.done_question_number failed: userId: ${userId}, addedDoneQuestionCount: ${addedDoneQuestionCount} `
      );
    }
    return true;
  }

  async handleLogout(userId) {
    // 清空refreshToken, 使之前签发的refreshToken失效(这样accessToken过期之后，refreshToken就无法通过验证)
    const user = {
      id: userId,
      refresh_token: null,
    };
    const result = await this.app.mysql.update('t_user', user);
    if (result.affectedRows !== 1) {
      throw new Error('handle logout failed: ' + JSON.stringify(user));
    }
    return true;
  }

  async updateAvatar(imgData, extendName, userId) {
    const filename =
      this.config.qiniuConfig.avatarNamePrefix + uuid.v4() + '.' + extendName;
    const ByteArr = Buffer.from(imgData, 'base64');
    try {
      const imgSrc = await this.ctx.helper.qiniuUploadUtil.uploadByteArray(
        ByteArr,
        filename
      );

      // 删除旧头像文件
      try {
        const user = await this.getUserById(userId);
        const deleleFilename = user.avatar
          .split('?')[0]
          .split(this.config.qiniuConfig.domain + '/')[1];
        await this.ctx.helper.qiniuUploadUtil.deleteFile(deleleFilename);
      } catch (err) {
        this.logger.error('delete avatar from oss server failed: ', err);
      }

      // 更新用户头像字段的值
      const user = {
        id: userId,
        avatar: imgSrc,
      };
      await this.updateUserById(user);
      return imgSrc;
    } catch (err) {
      this.logger.error(err);
      throw new Error('upload avatar to qiniu oss server failed');
    }
  }
}

module.exports = UserService;
