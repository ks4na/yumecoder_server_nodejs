'use strict';

const jwt = require('jsonwebtoken');

module.exports = options => {
  return async function token(ctx, next) {
    // 拦截请求，获取请求头中token信息
    const token = ctx.get('Authorization');

    let errCode, errMsg;
    // 1. 不存在token
    if (!token) {
      errCode = 4011;
      errMsg = ctx.__('tokenMiddleware.missingToken');
    } else {
      // 2. 存在token
      try {
        const decoded = jwt.verify(
          token.replace('Bearer ', ''),
          options.accessTokenSecret
        );
        // 设置userId
        ctx.userId = decoded.userId;
      } catch (err) {
        // 2.1. token过期
        if (err.name === 'TokenExpiredError') {
          errCode = 4012;
          errMsg = ctx.__('tokenMiddleware.expiredToken');
        } else {
          // 2.2. 其他异常
          errCode = 4013;
          errMsg = ctx.__('tokenMiddleware.invalidToken');
        }
      }
    }

    // 存在错误，返回401和错误信息
    if (errCode && errMsg) {
      ctx.status = 401;
      ctx.body = {
        code: errCode,
        msg: errMsg,
      };
      return;
    }

    await next();
  };
};
