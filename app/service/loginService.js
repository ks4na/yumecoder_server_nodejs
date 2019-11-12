'use strict';

const Service = require('egg').Service;
const jwt = require('jsonwebtoken');

class LoginService extends Service {
  async getUserByEmail(email) {
    const user = await this.app.mysql.get('t_user', { email });
    return user;
  }

  async getUserById(id) {
    const user = await this.app.mysql.get('t_user', { id });
    return user;
  }

  async updateLoginInfo({ id, last_login_time, exercise_days }) {
    const curTime = new Date();
    if (!isSameDate(curTime, last_login_time)) {
      exercise_days++;
    }
    const {
      accessTokenSecret,
      accessTokenExpireIn,
      refreshTokenSecret,
      refreshTokenExpireIn,
    } = this.config.token;
    const accessToken =
      'Bearer ' +
      jwt.sign({ userId: id }, accessTokenSecret, {
        expiresIn: accessTokenExpireIn,
      });
    const refreshToken =
      'Bearer ' +
      jwt.sign({ userId: id }, refreshTokenSecret, {
        expiresIn: refreshTokenExpireIn,
      });

    const row = {
      id,
      last_login_time: this.ctx.helper.convertDateToString(curTime),
      exercise_days,
      refresh_token: refreshToken,
    };
    const result = await this.app.mysql.update('t_user', row);
    if (result.affectedRows !== 1) {
      throw new Error('user info update falied: ' + JSON.stringify(row));
    }
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken) {
    const { ctx } = this;
    const {
      refreshTokenSecret,
      accessTokenExpireIn,
      accessTokenSecret,
    } = this.config.token;

    let errCode, errMsg, userId;
    try {
      const decoded = jwt.verify(
        refreshToken.replace('Bearer ', ''),
        refreshTokenSecret
      );
      userId = decoded.userId;
      const user = await this.app.mysql.get('t_user', { id: userId });
      if (user.refresh_token !== refreshToken) {
        errCode = 4014;
        errMsg = ctx.__('loginService.expiredRefreshToken');
      }
    } catch (err) {
      // 2.1. refresh_token过期
      if (err.name === 'TokenExpiredError') {
        errCode = 4014;
        errMsg = ctx.__('loginService.expiredRefreshToken');
      } else {
        // 2.2. 其他refresh_token异常
        errCode = 4015;
        errMsg = ctx.__('loginService.invalidRefreshToken');
      }
    }

    if (errCode && errMsg) {
      return {
        err: true,
        data: {
          code: errCode,
          msg: errMsg,
        },
      };
    }
    const accessToken =
      'Bearer ' +
      jwt.sign({ userId }, accessTokenSecret, {
        expiresIn: accessTokenExpireIn,
      });
    return {
      err: false,
      data: {
        access_token: accessToken,
      },
    };
  }

  async getUserIdByOtherLoginInfo({ open_id, provider }) {
    const results = await this.app.mysql.select('t_otherlogin', {
      where: {
        open_id,
        provider,
      },
      columns: ['uid'],
    });
    return results.length === 0 ? null : results[0].uid;
  }

  async createOtherLoginUser(user, otherLoginInfo) {
    // 开启自动控制的事务
    const userId = await this.app.mysql.beginTransactionScope(async conn => {
      // 插入用户信息到用户表
      const result = await conn.insert('t_user', user);
      if (result.affectedRows !== 1) {
        throw new Error('add user failed: ' + JSON.stringify(user));
      }
      // 获取刚插入的user的id
      const userId = result.insertId;

      // 将该用户添加到三方登录信息表中
      const otherLoginRow = {
        uid: userId,
        open_id: otherLoginInfo.open_id,
        provider: otherLoginInfo.provider,
      };
      const res = await conn.insert('t_otherlogin', otherLoginRow);
      if (res.affectedRows !== 1) {
        throw new Error(
          'add otherLogin info failed: ' + JSON.stringify(otherLoginRow)
        );
      }
      return userId;
    }, this.ctx);

    return userId;
  }
}

module.exports = LoginService;

/**
 * 判断是否为同一天
 * @param {日期} date 日期
 * @param {日期2} compareDate 日期2
 */
function isSameDate(date, compareDate) {
  date = new Date(date);
  compareDate = new Date(compareDate);

  const isSameYear = date.getFullYear() === compareDate.getFullYear();
  const isSameMonth = date.getMonth() === compareDate.getMonth();
  const isSameDate = date.getDate() === compareDate.getDate();

  return isSameYear && isSameMonth && isSameDate;
}
