'use strict';

const nodemailer = require('nodemailer');

class MailUtil {
  constructor(EggHelper) {
    this.helper = EggHelper;
    this.transporter = null;

    this.initTransporter();
  }

  initTransporter() {
    if (this.helper) {
      const config = this.getConfig();
      const { nodemailerTransportOptions } = config;
      if (!nodemailerTransportOptions) {
        throw new Error(
          'missing mail config info :: nodemailerTransportOptions'
        );
      }
      this.transporter = nodemailer.createTransport(nodemailerTransportOptions);
    }
  }

  setHelper(helper) {
    this.helper = helper;
    this.initTransporter();
    return this;
  }

  getConfig() {
    return this.helper ? this.helper.app.config.mailConfig : {};
  }

  static getInstance() {
    return MailUtil.instance;
  }

  async verify() {
    try {
      if (!this.transporter) {
        throw new Error('missing property: transporter');
      }
      const result = await this.transporter.verify();
      return {
        error: 0,
        msg: result,
      };
    } catch (err) {
      return {
        error: -1,
        msg: err.message,
      };
    }
  }

  async sendMail(receiver, subject, msg) {
    const { sender } = this.getConfig();
    const message = {
      from: sender,
      to: receiver,
      subject,
      html: msg,
    };
    let sendResult;
    try {
      sendResult = await this.transporter.sendMail(message);
    } catch (err) {
      this.helper.ctx.logger.error('sendMail failed: ', err);
      sendResult = {
        error: true,
        msg: err.message,
      };
    }
    return sendResult;
  }
}

MailUtil.instance = new MailUtil();

module.exports = MailUtil;
