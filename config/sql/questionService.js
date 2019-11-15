'use strict';
module.exports = {
  getTopLevelQuestionRemarksByQuestionId: `
SELECT
	qr.id,
	qr.content,
	qr.zan,
	qr.create_user,
	qr.create_time,
	u.nickname,
	u.avatar 
FROM
	t_questionremark qr
	LEFT JOIN t_user u ON qr.create_user = u.id 
WHERE
	qr.question_id = ?
	AND qr.parent_id = 0 
	AND qr.is_deleted = 0 
ORDER BY
	qr.zan DESC,
  qr.create_time DESC`,
  getQuestionRemarkReplyCountByQuestionId: `
SELECT
	qr.id,
	count( qr2.id ) as count
FROM
	t_questionremark qr
	LEFT JOIN t_questionremark qr2 ON qr.id = qr2.parent_id 
WHERE
	qr.question_id = ? 
	AND qr.parent_id = 0 
	AND qr.is_deleted = 0 
	AND qr2.parent_id != 0 
GROUP BY
	qr.id 
ORDER BY
	qr.zan DESC,
	qr.create_time DESC`,
  getValidCategoryIdList: `
SELECT
	id 
FROM
	t_questioncategory 
WHERE
	parent_id != 0 
	AND is_deleted = 0`,
  getCollectedQuestionIdListByUserIdAndCategoryId: `
SELECT
	q.id 
FROM
	t_donequestion dq
	LEFT JOIN t_question q ON dq.question_id = q.id 
WHERE
	dq.create_user = ? 
	AND is_collected = 1 
	AND q.category_id = ?
ORDER BY
	dq.collected_time DESC`,
  getQuestionsByIdList: `
SELECT
	id,
	type,
	question,
	answer,
	analysis,
	knowledge_tag 
FROM
	t_question 
WHERE
	id IN ?
ORDER BY FIELD (id, ?) `,
  getOptionsByQuestionIdList: `
SELECT
	id,
	question_id,
	sort,
	content 
FROM
	t_option 
WHERE
	is_deleted = 0 
	AND question_id IN ?
ORDER BY
	FIELD ( question_id, ?),
	sort ASC`,
  getMistakeListByUserIdAndCategoryId: `
SELECT
	q.id,
	dq.is_collected 
FROM
	t_donequestion dq
	LEFT JOIN t_question q ON dq.question_id = q.id
	LEFT JOIN t_test_question tq ON tq.question_id = q.id 
WHERE
	dq.create_user = ?
	AND dq.is_right = 0 
	AND q.category_id = ?
	AND tq.test_id IN ( SELECT id FROM t_test WHERE create_user = ? ) 
ORDER BY
	tq.test_id DESC`,
  getUserAnswersByQuestionIdList: `
SELECT
	tq.question_id,
	tq.personal_answer 
FROM
	t_test t
	LEFT JOIN t_test_question tq ON t.id = tq.test_id 
WHERE
	t.create_user = ?
	AND tq.question_id IN ?
ORDER BY
	tq.test_id DESC`,
};
