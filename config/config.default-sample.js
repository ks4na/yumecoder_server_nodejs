/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = (exports = {});

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + 'your cookie sign key';

  // add your middleware config here
  config.middleware = ['token'];

  // add your user config here
  const userConfig = {
    appName: 'your app name',

    // egg-security
    security: {
      csrf: {
        enable: false,
      },
    },

    // 多语言 (i18n)
    i18n: {
      defaultLocale: 'zh-CN',
    },

    // token配置 (token config)
    token: {
      accessTokenExpireIn: '2h',
      refreshTokenExpireIn: '15d',
      accessTokenSecret: 'your accessTokenSecret',
      refreshTokenSecret: 'your accessTokenSecret',
      match: [
        '/api/home',
        '/api/tests',
        '/api/remarks',
        '/api/questions',
        '/api/questionCategories',
        '/api/users',
      ],
    },

    // mysql单数据库信息配置 (mysql database single instance config)
    mysql: {
      client: {
        host: 'host',
        port: 'port',
        user: 'user',
        password: 'password',
        database: 'database',
      },
      // 是否加载到 app 上，默认开启
      app: true,
      // 是否加载到 agent 上，默认关闭
      agent: false,
    },

    // md5加盐配置(md5 salt)
    md5: {
      // 兼容已存在数据，暂时设置为空
      salt: 'md5 salt',
    },

    // onerror全局异常处理插件配置 (onerror plugin config)
    onerror: {
      // 若此项不配置，需要设置请求头 Accept: application/json，不然会返回html格式错误页面
      html(err, ctx) {
        if (ctx.status === 422) {
          ctx.body = JSON.stringify(err);
        }
      },
    },

    // Luosimao人机验证配置(Luosimao captcha config)
    captchaUtilConfig: {
      apiKey: 'Luosimao apiKey',
      targetDomain: 'Luosimao targetDomain',
    },

    // 邮件配置( mail config)
    mailConfig: {
      activeCodeEmailExpireIn: 10, // min
      nodemailerTransportOptions: {
        // nodemailer模块配置 (nodemailer module config)
        pool: true,
        host: 'smtp.qq.com',
        port: 587,
        secure: false,
        auth: {
          user: 'user',
          pass: 'pass',
        },
        debug: false, // 是否开启debug模式(debug mode flag)
      },
      sender: 'same with nodemailTransportOptions.auth.user', // 需要匹配auth中的user的邮箱(should match nodemailTransportOptions.auth.user)
    },

    // bodyParser配置 (bodyParser config)
    bodyParser: {
      jsonLimit: '1mb',
      formLimit: '1mb',
    },
    // 七牛云OSS存储 (qiniu oss config)
    qiniuConfig: {
      avatarFormats: ['jpeg', 'png'], // avatar format limit
      avatarNamePrefix: 'avatarNamePrefix',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      zone: 'zone',
      bucket: 'bucket',
      domain: 'domain',
      imgStyle: 'imageView2/1/w/200/h/200/q/75|imageslim',
    },
    // github oauth login config
    githubConfig: {
      client_id: 'client_id',
      client_secret: 'client_secret',
      access_token_domain: 'https://github.com/login/oauth/access_token',
      user_info_domain: 'https://api.github.com/user',
    },
  };

  return {
    ...config,
    ...userConfig,
  };
};
