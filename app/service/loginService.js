'use strict';

const Service = require('egg').Service;
const jwt = require('jsonwebtoken');
const moment = require('moment');

class LoginService extends Service {
  async getUserByEmail(email) {
    const user = await this.app.mysql.get('t_user', { email });
    return user;
  }

  async getUserById(id) {
    const user = await this.app.mysql.get('t_user', { id });
    return user;
  }

  async updateLastLoginTime({ id, last_login_time, exercise_days }) {
    const curTime = new Date();
    if (!last_login_time || !isSameDate(curTime, last_login_time)) {
      exercise_days++;
    }
    const row = {
      id,
      last_login_time: this.ctx.helper.convertDateToString(curTime),
      exercise_days,
    };
    const result = await this.app.mysql.update('t_user', row);
    if (result.affectedRows !== 1) {
      throw new Error('update last_login_time falied: ' + JSON.stringify(row));
    }
  }

  async updateLoginInfo({ id, last_login_time, exercise_days }) {
    const curTime = new Date();
    if (!last_login_time || !isSameDate(curTime, last_login_time)) {
      exercise_days++;
    }
    const { accessToken, refreshToken } = this.genereateTokens(id);

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
      refreshTokenRegenerateDaysBefore,
      accessTokenSecret,
    } = this.config.token;

    let errCode,
      errMsg,
      userId,
      needRegenerateRefreshToken = false;
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
      } else {
        // 判断是否需要刷新 refresh_token
        if (
          moment.duration(moment.unix(decoded.exp) - moment()).days() <
          refreshTokenRegenerateDaysBefore
        ) {
          needRegenerateRefreshToken = true;
        }
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
        code: errCode,
        msg: errMsg,
      };
    }
    // 如果需要重新生成 refresh_token
    if (needRegenerateRefreshToken) {
      const { accessToken, refreshToken } = this.genereateTokens(userId);

      const row = {
        id: userId,
        refresh_token: refreshToken,
      };
      const result = await this.app.mysql.update('t_user', row);
      if (result.affectedRows !== 1) {
        throw new Error('update refresh_token falied: ' + JSON.stringify(row));
      }

      return {
        code: 0,
        access_token: accessToken,
        refresh_token: refreshToken,
      };
    }
    // 只需要重新获取 access_token, 不需要 refresh_token
    const accessToken =
      'Bearer ' +
      jwt.sign({ userId }, accessTokenSecret, {
        expiresIn: accessTokenExpireIn,
      });
    return {
      code: 0,
      access_token: accessToken,
    };
  }

  async getUserByOtherLoginInfo({ open_id, provider }) {
    const sql =
      'select u.* from `t_user` u , `t_otherlogin` o where u.id = o.uid and o.provider = ? and o.open_id = ?';
    const results = await this.app.mysql.query(sql, [provider, open_id]);
    return results.length > 0 ? results[0] : null;
  }

  async createOtherLoginUser(user, otherLoginInfo) {
    // 开启自动控制的事务
    const {
      accessToken,
      refreshToken,
    } = await this.app.mysql.beginTransactionScope(async conn => {
      // 插入用户信息到用户表
      const result = await conn.insert('t_user', user);
      if (result.affectedRows !== 1) {
        throw new Error('add user failed: ' + JSON.stringify(user));
      }
      // 获取刚插入的user的id
      const userId = result.insertId;

      // 根据用户id生成 accessToken 和 refreshToken ,并将 refreshToken 存入用户表
      const { accessToken, refreshToken } = this.genereateTokens(userId);
      const updateRow = {
        id: userId,
        refresh_token: refreshToken,
      };
      const updateResult = await conn.update('t_user', updateRow);
      if (updateResult.affectedRows !== 1) {
        throw new Error(
          'update user.refresh_token failed: ' + JSON.stringify(updateRow)
        );
      }

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
      return { accessToken, refreshToken };
    }, this.ctx);

    return { accessToken, refreshToken };
  }

  genereateTokens(userId) {
    const {
      accessTokenSecret,
      accessTokenExpireIn,
      refreshTokenSecret,
      refreshTokenExpireIn,
    } = this.config.token;
    const accessToken =
      'Bearer ' +
      jwt.sign({ userId }, accessTokenSecret, {
        expiresIn: accessTokenExpireIn,
      });
    const refreshToken =
      'Bearer ' +
      jwt.sign({ userId }, refreshTokenSecret, {
        expiresIn: refreshTokenExpireIn,
      });

    return {
      accessToken,
      refreshToken,
    };
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
