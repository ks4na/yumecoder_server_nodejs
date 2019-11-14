'use strict';

module.exports = {
  getDoneQuestionAmountByUserIdAndCategoryId: `
SELECT
	qc.id as category_id, COUNT( dq.id ) as done_question_amount
FROM
	t_questioncategory qc
	LEFT JOIN t_donequestion dq ON dq.question_id IN ( SELECT id FROM t_question WHERE category_id = qc.id ) 
	AND dq.create_user = ?
WHERE
	qc.id in (?)
	AND qc.is_deleted = 0 
GROUP BY
	qc.id 
ORDER BY
	qc.parent_id ASC,
  qc.sort ASC`,
  getRightQuestionAmountByUserIdAndCategoryId: `
SELECT
	qc.id,
	COUNT( dq.id ) 
FROM
	t_questioncategory qc
	LEFT JOIN t_donequestion dq ON dq.question_id IN ( SELECT id FROM t_question WHERE category_id = qc.id ) 
	AND dq.create_user = ?
	AND dq.is_right = 1 
WHERE
	qc.layer = 2 
	AND qc.is_deleted = 0 
GROUP BY
	qc.id 
ORDER BY
	qc.parent_id ASC,
	qc.sort ASC`,
  getNewQuestionIdList: `
SELECT
	id 
FROM
	t_question 
WHERE
	id NOT IN ( SELECT question_id FROM t_donequestion WHERE create_user = ? ) 
	AND category_id = ?
	AND is_deleted =0`,
  getMistokenQuestionIdList: `
SELECT
	id 
FROM
	t_question 
WHERE
	id IN ( SELECT question_id FROM t_donequestion WHERE create_user = ? AND is_right = 0 ) 
	AND category_id = ? 
	AND is_deleted =0`,
  getNewAndMistokenQuestionIdList: `
SELECT
	id 
FROM
	t_question 
WHERE
	id NOT IN ( SELECT question_id FROM t_donequestion WHERE create_user = ? AND is_right = 1 ) 
	AND category_id = 9 
	AND is_deleted =0`,
  getAllQuestionIdList: `
SELECT
	id 
FROM
	t_question 
WHERE
	category_id = ? AND is_deleted =0`,
  getQuestionsByTestId: `
SELECT
	q.* 
FROM
	t_test_question tq
	LEFT JOIN t_question q ON tq.question_id = q.id 
WHERE
	tq.test_id = ? 
ORDER BY
	tq.question_sort ASC`,
  getOptionsByTestId: `
SELECT
	o.* 
FROM
	t_test_question tq
	LEFT JOIN t_question q ON tq.question_id = q.id
	LEFT JOIN t_option o ON q.id = o.question_id 
WHERE
	tq.test_id = ? AND o.is_deleted = 0
	
ORDER BY
	tq.question_sort ASC,
	o.sort ASC`,
  getRightAnswersByTestId: `
SELECT
	q.id, q.answer, tq.question_sort 
FROM
	t_test_question tq
	LEFT JOIN t_question q ON tq.question_id = q.id 
WHERE
	tq.test_id = ? 
ORDER BY
	tq.question_sort ASC`,
  getCollectInfoByTestIdAndUserId: `
SELECT
	dq.question_id,
	dq.is_collected 
FROM
	t_test_question tq
	LEFT JOIN t_donequestion dq ON tq.question_id = dq.question_id 
WHERE
	tq.test_id = ? 
	AND dq.create_user = ?
ORDER BY
	tq.question_sort ASC`,
};
