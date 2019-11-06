'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/service/loginService.js', () => {
  describe('getUserByEmail()', () => {
    let ctx;
    before(() => {
      ctx = app.mockContext();
    });

    it('应该能获取到用户', async () => {
      const user = await ctx.service.loginService.getUserByEmail('1@qq.com');
      assert(user);
      assert(user.email === '1@qq.com');
    });

    it('用户不存在，应该返回null', async () => {
      const user = await ctx.service.loginService.getUserByEmail('123');
      assert(user === null);
    });
  });
});
