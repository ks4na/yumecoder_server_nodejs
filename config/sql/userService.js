'use strict';

module.exports = {
  updateDoneQuestionNumberById: `
UPDATE t_user 
SET done_question_number = done_question_number + ?
WHERE
  id = ? `,
  addOneCreditNumberByUserId: `
UPDATE t_user 
SET credits = credits + 1 
WHERE
  id = ? `,
  removeOneCreditNumberByUserId: `
UPDATE t_user 
SET credits = credits - 1 
WHERE
	id = ? `,
};
