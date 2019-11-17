'use strict';

const Controller = require('egg').Controller;

class QuestionCategoryController extends Controller {
  async getQuestionCategories() {
    const { ctx, service } = this;
    const { treeStructure = 'true' } = ctx.query;

    // 参数校验
    ctx.validate(
      {
        treeStructure: {
          type: 'enum',
          values: ['true', 'false'],
        },
      },
      { treeStructure }
    );

    const categories = await service.questionCategoryService.getQuestionCategories(treeStructure);

    ctx.body = categories;
  }
}

module.exports = QuestionCategoryController;
