'use strict';

module.exports = () => {
  return async function lastLoginTime(ctx, next) {
    const { userId } = ctx;
    const { loginService } = ctx.service;

    const user = await loginService.getUserById(userId);
    await loginService.updateLastLoginTime(user);

    await next();
  };
};
