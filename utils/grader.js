// utils/grader.js

/**
 * grade(annotations, tasks)
 *
 * - annotations: the array `annotation.result` objects from LS’s webhook payload.
 * - tasks:        the original `SkillTest.tasks` array with ground‐truth in `data.correct_answer`.
 *
 * Returns: a number between 0 and 100 representing % correct.
 *
 * Here we assume each task has a `data.correct_answer` (string), and LS returns:
 *   annotations = [ { task: 1, result: [ { value: { choices: ['Cat'] } } ] }, … ]
 */
module.exports = function grade(annotations, tasks) {
  // 1) Build a map: task ID → correct_answer
  const correctMap = {};
  tasks.forEach(t => {
    correctMap[t.id] = t.data.correct_answer;
  });

  // 2) Count how many were correct
  let correctCount = 0;
  annotations.forEach(a => {
    // LS’s payload: a.task is the original `id` you assigned; a.result[0].value.choices[0] is their pick
    const picked = a.result?.[0]?.value?.choices?.[0];
    const truth  = correctMap[a.task];
    if (picked === truth) correctCount += 1;
  });

  // 3) Compute percentage
  const total = tasks.length;
  if (total === 0) return 0;
  return (correctCount / total) * 100;
};
