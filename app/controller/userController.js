'use strict';

const Controller = require('egg').Controller;
const md5 = require('md5');

class UserController extends Controller {
  async getCurrentUserInfo() {
    const { ctx, service } = this;

    const { userId } = ctx;
    const user = await service.userService.getUserById(userId);
    const filteredUserInfo = ctx.helper.removeKey(user, [
      'password',
      'active_code',
      'expire_time',
      'refresh_token',
    ]);

    ctx.body = filteredUserInfo;
  }

  async getUserInfo() {
    const { ctx, service } = this;
    const { userId } = ctx.params;

    // 参数校验
    ctx.validate(
      {
        userId: 'id',
      },
      { userId }
    );

    const user = await service.userService.getUserById(userId);
    const filteredUserInfo = ctx.helper.removeKey(user, [
      'email',
      'phone',
      'is_active',
      'create_time',
      'last_login_time',
      'is_admin',
      'is_super_admin',
      'password',
      'active_code',
      'expire_time',
      'refresh_token',
    ]);

    ctx.body = filteredUserInfo;
  }

  async updateCurrentUserInfo() {
    const { ctx, service } = this;
    const {
      gender,
      wantingJob,
      nickname,
      personalMessage,
      questionNumberPerTime,
      testRange,
    } = ctx.request.body;

    // 参数校验
    ctx.validate(
      {
        gender: {
          type: 'enum',
          values: [0, 1, 2],
          required: false,
        },
        wantingJob: {
          type: 'string',
          required: false,
        },
        nickname: {
          type: 'string',
          trim: true,
          min: 4,
          max: 15,
          required: false,
        },
        personalMessage: {
          type: 'string',
          max: 50,
          required: false,
        },
        questionNumberPerTime: {
          type: 'enum',
          values: [5, 10, 15, 20],
          required: false,
        },
        testRange: {
          type: 'enum',
          values: [0, 1, 2, 3],
          required: false,
        },
      },
      {
        gender,
        wantingJob,
        nickname,
        personalMessage,
        questionNumberPerTime,
        testRange,
      }
    );

    const updateColumns = [];
    if (gender !== undefined) {
      updateColumns.push({ column: 'gender', value: gender });
    }
    if (wantingJob !== undefined) {
      updateColumns.push({ column: 'wanting_job', value: wantingJob });
    }
    if (nickname !== undefined) {
      updateColumns.push({ column: 'nickname', value: nickname });
    }
    if (personalMessage !== undefined) {
      updateColumns.push({
        column: 'personal_message',
        value: personalMessage,
      });
    }
    if (questionNumberPerTime !== undefined) {
      updateColumns.push({
        column: 'question_number_per_time',
        value: questionNumberPerTime,
      });
    }
    if (testRange !== undefined) {
      updateColumns.push({ column: 'test_range', value: testRange });
    }

    if (updateColumns.length === 0) {
      ctx.body = {
        code: 1,
        msg: ctx.__('userController.noUpdateField'),
      };
      return;
    }
    const user = {
      id: ctx.userId,
    };
    for (let i = 0; i < updateColumns.length; i++) {
      const item = updateColumns[i];
      user[item.column] = item.value;
    }

    // 更新用户信息
    await service.userService.updateUserById(user);

    ctx.body = true;
  }

  async resetPwd() {
    const { ctx, service } = this;
    const { oldPwd, newPwd } = ctx.request.body;

    // 参数校验
    ctx.validate({
      oldPwd: {
        type: 'password',
        min: 6,
        max: 18,
      },
      newPwd: {
        type: 'password',
        min: 6,
        max: 18,
      },
    });

    if (newPwd === oldPwd) {
      ctx.body = {
        code: 1,
        msg: ctx.__('userController.cannotBeSamePassword'),
      };
      return;
    }

    const { userId } = ctx;
    const user = await service.userService.getUserById(userId);
    if (user.password !== md5(oldPwd + this.config.md5.salt)) {
      ctx.body = {
        code: 2,
        msg: ctx.__('userController.wrongPassword'),
      };
      return;
    }

    const updateRow = {
      id: userId,
      password: md5(newPwd + this.config.md5.salt),
    };
    await service.userService.updateUserById(updateRow);

    ctx.body = true;
  }

  async handleLogout() {
    const { ctx, service } = this;
    const { userId } = ctx;

    await service.userService.handleLogout(userId);

    ctx.body = true;
  }

  async uploadAvatar() {
    const { ctx, service } = this;
    const { avatar } = ctx.request.body;
    const avatarFormats = ctx.helper.qiniuUploadUtil.getConfig().avatarFormats;

    // 参数校验
    ctx.validate(
      {
        avatar: {
          type: 'string',
        },
      },
      { avatar }
    );

    // 校验avatar格式
    const avatarRegExp = new RegExp(
      `data:image\/(${avatarFormats.join('|')});base64,(\\S+)`
    );
    if (!avatarRegExp.test(avatar)) {
      ctx.body = {
        code: 1,
        msg: ctx.__('userController.invalidAvatarFormat'),
      };
      return;
    }

    const extendName = RegExp.$1;
    const imgData = RegExp.$2;

    // 处理头像更新
    const { userId } = ctx;
    const avatarSrc = await service.userService.updateAvatar(
      imgData,
      extendName,
      userId
    );

    ctx.body = avatarSrc;
  }
}

module.exports = UserController;
