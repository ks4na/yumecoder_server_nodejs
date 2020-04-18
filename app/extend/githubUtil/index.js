'use strict';

class GithubUtil {
  constructor(EggHelper) {
    this.helper = EggHelper;
  }

  setHelper(helper) {
    this.helper = helper;
    return this;
  }

  getConfig() {
    return this.helper ? this.helper.app.config.githubConfig : {};
  }

  static getInstance() {
    return GithubUtil.instance;
  }

  async exchangeCodeForAccessToken(code) {
    const { client_id, client_secret, access_token_domain } = this.getConfig();
    if (!client_id || !client_secret) {
      throw new Error(
        `missing Github login config info :: client_id=${client_id}, client_secret=${client_secret}`
      );
    }
    const response = await this.helper.app.curl(access_token_domain, {
      method: 'POST',
      data: {
        client_id,
        client_secret,
        code,
      },
      dataType: 'json',
    });

    if (
      !response.data ||
      !response.data.access_token ||
      !response.data.token_type
    ) {
      this.helper.ctx.logger.error(
        'get Github access_token failed: ',
        response.data && response.data.error,
        response.data && response.data.error_description
      );
    }
    return response.data;
  }

  async getUserInfoByAccessToken(accessToken, tokenType) {
    const { user_info_domain } = this.getConfig();
    if (!user_info_domain) {
      throw new Error(
        `missing Github login config info :: user_info_domain=${user_info_domain}`
      );
    }
    const response = await this.helper.app.curl(user_info_domain, {
      method: 'GET',
      headers: {
        Authorization: `${tokenType} ${accessToken}`,
      },
      dataType: 'json',
    });
    if (!response.data) {
      this.helper.ctx.logger.error('get Github user info failed: ', response);
    }
    return response.data;
  }
}

GithubUtil.instance = new GithubUtil();

module.exports = GithubUtil;
