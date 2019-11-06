'use strict';

const moment = require('moment');

module.exports = {
  convertDateToString: date => {
    return moment(date).format('YYYY-MM-DD HH:mm:ss');
  },
};
