'use strict';

const { app, assert } = require('egg-mock/bootstrap');

describe('test/app/extend/helper.test.js', () => {
  it('转换Date类型参数为字符串，且格式为 YYYY-MM-DD HH:mm:ss。', () => {
    const ctx = app.mockContext();
    assert(
      ctx.helper.convertDateToString(new Date(2019, 10, 5, 17, 46, 10)) ===
        '2019-11-05 17:46:10'
    );
  });
});
