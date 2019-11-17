'use strict';

const Service = require('egg').Service;
const sqls = require('../../config/sql/questionCategoryService.js');

class QuestionCategoryService extends Service {
  async getCategoryTree() {
    const { mysql } = this.app;
    // 查询根级别的分类集合
    const sql_getRootCategories = sqls.getRootCategories;
    const rootCategories = await mysql.query(sql_getRootCategories);
    if (rootCategories.length > 0) {
      // 根据根级别分类查询二级分类集合
      const sql_getChildCategoriesById = sqls.getChildCategoriesById;
      const promise_childCategoryList = rootCategories.map(item => {
        return mysql.query(sql_getChildCategoriesById, item.id);
      });
      const childCategories = await Promise.all(promise_childCategoryList);

      for (let i = 0; i < childCategories.length; i++) {
        const childCategoryItem = childCategories[i];
        // 查询每一项子分类的试题数量，赋给该分类的question_amount字段
        const sql_getQuestionAmountByCategoryId =
          sqls.getQuestionAmountByCategoryId;
        const promise_getQuestionAmountByCategoryId = childCategoryItem.map(
          item => {
            return mysql.query(sql_getQuestionAmountByCategoryId, item.id);
          }
        );
        const questionAmountByCategoryId = await Promise.all(
          promise_getQuestionAmountByCategoryId
        );
        questionAmountByCategoryId.forEach((item, i) => {
          childCategoryItem[i].question_amount = item[0].count;
        });
      }
      // 将二级分类赋给根级分类的children属性
      rootCategories.forEach(item => {
        const target = childCategories.find(childItem => {
          return childItem.length > 0 && childItem[0].parent_id === item.id;
        });
        let questionAmount = 0;
        for (let i = 0; i < target.length; i++) {
          questionAmount += target[i].question_amount;
        }
        // 给根级分类添加该分类试题数量字段question_amount
        item.question_amount = questionAmount;
        item.children = target;
      });
    }
    return rootCategories;
  }

  async getQuestionCategoryById(id) {
    const result = await this.app.mysql.get('t_questioncategory', { id });
    return result;
  }

  async getQuestionCategories(treeStructure) {
    const categories = await this.app.mysql.select('t_questioncategory', {
      where: { is_deleted: 0 },
      columns: ['id', 'category_name', 'layer', 'parent_id', 'sort'],
    });

    if (treeStructure) {
      let treeRoot = {
        id: 0,
        category_name: 'root node',
      };

      treeRoot = this.recursiveGenerateTree(treeRoot, categories);
      return treeRoot;
    }

    return categories;
  }

  async recursiveGenerateTree(tree, categories) {
    const children = categories.filter(item => item.parent_id === tree.id);
    tree.children = children;
    for (let i = 0; i < tree.children.length; i++) {
      let item = tree.children[i];
      item = this.recursiveGenerateTree(item, categories);
    }
    return tree;
  }
}

module.exports = QuestionCategoryService;
