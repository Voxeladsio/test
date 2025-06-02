/**
 * scripts/uploadSkillTest.js
 * Run with:  node scripts/uploadSkillTest.js
 * Assumes you are already running `nodemon server.js`
 * and that .env contains SESSION_SECRET etc.
 */
require('dotenv').config();
const fetch = require('node-fetch');               // npm i node-fetch@2 if you haven’t
const fs    = require('fs');

(async () => {
  /* 1 — first sign-in as admin to get the session cookie
     replace the email + password with your real admin creds               */
  const loginRes = await fetch('http://localhost:3000/api/auth/login', {
    method : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body   : JSON.stringify({
      email   : 'admin@example.com',
      password: 'your_admin_password'
    })
  });
  if (!loginRes.ok) {
    console.error('Login failed:', loginRes.status);
    console.log(await loginRes.text());
    process.exit(1);
  }
  const cookie = loginRes.headers.get('set-cookie');     // session cookie

  /* 2 — build the test payload (hard-coded here, or read from a JSON file) */
  const payload = {
    title: 'Demo – Cat vs Dog',
    karmaReward: 5,
    passThreshold: 80,
    interfaceXml: `
      <View>
        <Image name="image" value="$image"/>
        <Choices name="answer" toName="image" choice="single">
          <Choice value="Cat"/><Choice value="Dog"/>
        </Choices>
      </View>`,
    tasks: [
      { id: 1, data: { image: 'https://loremflickr.com/320/240/cat', correct_answer: 'Cat' } },
      { id: 2, data: { image: 'https://loremflickr.com/320/240/dog', correct_answer: 'Dog' } }
    ]
  };

  /* 3 — POST to the admin route with that cookie */
  const res = await fetch('http://localhost:3000/api/admin/skilltests', {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie'      : cookie                 // authenticates as the admin you just logged in
    },
    body: JSON.stringify(payload)
  });

  console.log('Status:', res.status);        // expect 201
  console.log('Body  :', await res.json());  // shows the doc with _id if it worked
})();

