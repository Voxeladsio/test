/**
 * services/ls.js  (fixed import URL)
 */

const axios = require('axios');
const SkillTest = require('../models/skillTest');

const LS_URL   = process.env.LS_URL;    // e.g. "https://app.humansignal.com"
const LS_TOKEN = process.env.LS_TOKEN;  // your personal access token
const BASE_URL = process.env.BASE_URL;  // "http://localhost:3000"

if (!LS_URL || !LS_TOKEN || !BASE_URL) {
  console.warn('⚠️ Missing LS_URL / LS_TOKEN / BASE_URL in .env');
}

const headers = {
  Authorization: `Token ${LS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function createProject(test, user) {
  let projectId;

  // 1) CREATE & PUBLISH the project
  try {
    const createRes = await axios.post(
      `${LS_URL}/api/projects/`,
      {
        title:        `${test.title} – ${user._id}`,
        label_config: test.interfaceXml,
        is_published: true
      },
      { headers }
    );
    projectId = createRes.data.id;
  } catch (err) {
    console.error('❌ LS CREATE PROJECT failed:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    throw new Error('Label Studio project creation failed');
  }

  // 2) IMPORT tasks (correct endpoint: .../import, no trailing slash)
  const tasksWithContext = test.tasks.map((t) => ({
    id:   t.id,
    data: {
      ...t.data,
      user: user._id.toString(),
      test: test._id.toString()
    }
  }));

  try {
    await axios.post(
      `${LS_URL}/api/projects/${projectId}/import`,
      tasksWithContext,
      { headers }
    );
  } catch (err) {
    console.error('❌ LS IMPORT TASKS failed:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    throw new Error('Label Studio import failed');
  }

  // 3) REGISTER webhook
  try {
    await axios.post(
      `${LS_URL}/api/webhooks/`,
      {
        project:     projectId,
        url:         `${BASE_URL}/api/webhooks/ls`,
        triggers:    ['TASK_COMPLETED'],
        sender_email: false
      },
      { headers }
    );
  } catch (err) {
    console.error('❌ LS REGISTER WEBHOOK failed:');
    if (err.response) {
      console.error('Status:', err.response.status);
      console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    } else {
      console.error(err.message);
    }
    throw new Error('Label Studio webhook registration failed');
  }

  // 4) RETURN the live labeling URL
   const url = `${LS_URL}/projects/${projectId}`;
  return { projectId, url };
}

module.exports = { createProject };
