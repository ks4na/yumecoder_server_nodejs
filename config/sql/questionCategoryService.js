'use strict';

module.exports = {
  getRootCategories: `
SELECT
  * 
FROM
  t_questioncategory 
WHERE
  parent_id = 0 
  AND is_deleted = 0 
ORDER BY
  parent_id ASC,
  sort ASC`,
  getChildCategoriesById: `
SELECT
	* 
FROM
	t_questioncategory 
WHERE
	is_deleted = 0 
	AND parent_id = ?
ORDER BY
  sort ASC`,
  getQuestionAmountByCategoryId: `
SELECT
	count( * ) as count 
FROM
	t_question 
WHERE
	category_id = ? 
	AND is_deleted = 0`,
};
