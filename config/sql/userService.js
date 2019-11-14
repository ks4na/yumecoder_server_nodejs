'use strict';

module.exports = {
  updateDoneQuestionNumberById: `
UPDATE t_user 
SET done_question_number = done_question_number + ?
WHERE
  id = ? `,
};
