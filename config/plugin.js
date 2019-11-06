'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  // static: {
  //   enable: true,
  // }

  // mysql
  mysql: {
    enable: true,
    package: 'egg-mysql',
  },

  // validate
  validate: {
    enable: true,
    package: 'egg-validate',
  },
};
