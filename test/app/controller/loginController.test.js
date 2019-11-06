'use strict';

const { app, assert } = require('egg-mock/bootstrap');
const jwt = require('jsonwebtoken');

describe('test/app/controller/loginController.js', () => {
  describe('POST /api/login', () => {
    let postData, user, ctx;
    beforeEach(() => {
      postData = {
        account: '1@qq.com',
        password: '123123',
      };
      ctx = app.mockContext();
      user = {
        id: 6,
        email: '1@qq.com',
        phone: null,
        password: '4297f44b13955235245b2497399d7a93',
        nickname: '码梦人6号',
        gender: 1,
        avatar: '',
        is_active: 1,
        active_code: 'a9c32e3f-362d-11e8-99d8-000c520dd8bc',
        expire_time: new Date('2018-04-02T04:24:07.000Z'),
        create_time: new Date('2018-04-02T04:24:12.000Z'),
        last_login_time: new Date('2019-11-04T11:32:42.000Z'),
        exercise_days: 9,
        credits: 0,
        personal_message: '我是机器人6号',
        attention: 1,
        fans: 0,
        school: null,
        wanting_job: null,
        done_question_number: 15,
        test_range: 0,
        question_number_per_time: 5,
        is_admin: 0,
        is_super_admin: 0,
        refresh_token:
          'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTU3Mjg2NzE2MiwiZXhwIjoxNTc0MTYzMTYyfQ.d18G9hcisRU1kNiNHOOyWCGDn2-p-StcwPqs9XEAKeU',
      };
    });

    it('参数校验起作用', () => {
      postData.password = '12312';
      return app
        .httpRequest()
        .post('/api/login')
        .send(postData)
        .set('Accept', 'application/json')
        .expect(422);
    });

    it('用户不存在', () => {
      app.mockService('loginService', 'getUserByEmail', () => {
        return null;
      });
      return app
        .httpRequest()
        .post('/api/login')
        .send(postData)
        .set('Accept', 'application/json')
        .expect(400)
        .expect({
          code: 1,
          msg: ctx.__('loginController.unexistUser'),
        });
    });

    it('用户尚未激活', () => {
      app.mockService('loginService', 'getUserByEmail', () => {
        user.is_active = 0;
        return user;
      });

      return app
        .httpRequest()
        .post('/api/login')
        .send(postData)
        .set('Accept', 'application/json')
        .expect(400)
        .expect({
          code: 2,
          msg: ctx.__('loginController.inactiveUser'),
        });
    });

    it('账号或密码错误', () => {
      app.mockService('loginService', 'getUserByEmail', () => {
        user.password = '123';
        return user;
      });

      return app
        .httpRequest()
        .post('/api/login')
        .send(postData)
        .set('Accept', 'application/json')
        .expect(400)
        .expect({
          code: 3,
          msg: ctx.__('loginController.incorrectAccountOrPwd'),
        });
    });

    it('成功登录，返回包含userId的access_token和refresh_token', async () => {
      const response = await app
        .httpRequest()
        .post('/api/login')
        .send(postData)
        .set('Accept', 'application/json');
      const { status, body } = response;
      const { code, access_token, refresh_token } = body;
      const ctx = app.mockContext();
      assert(status === 200);
      assert(code === 0);
      const decoded = jwt.verify(
        access_token.replace('Bearer ', ''),
        app.config.token.accessTokenSecret
      );
      const userInfo = await ctx.service.loginService.getUserByEmail(
        postData.account
      );
      assert(decoded.userId === userInfo.id);
      assert(refresh_token === userInfo.refresh_token);
    });
  });
});
