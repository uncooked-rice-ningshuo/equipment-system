const { app } = require('electron');
const path = require('path');
const { getAuth } = require('./electron/services/auth');
const { initDatabase } = require('./electron/services/database');

app.whenReady().then(async () => {
  console.log('----------------------------------------');
  console.log('LOGIN SIMULATION START');

  try {
    console.log('Initializing Database...');
    initDatabase();

    console.log('Initializing Auth...');
    const auth = await getAuth();

    const email = 'admin@example.com';
    const password = 'admin123';

    console.log(`Attempting to sign in with: ${email} / ${password}`);

    try {
      const result = await auth.api.signInEmail({
        body: {
          email,
          password,
        },
      });

      console.log('SignIn Result:', JSON.stringify(result, null, 2));

      if (result && result.session) {
        console.log('LOGIN SUCCESS!');
      } else {
        console.log('LOGIN FAILED: No session returned');
      }
    } catch (loginError) {
      console.error('LOGIN ERROR (Caught):');
      console.error(loginError);
      if (loginError.body) {
        console.error('Error Body:', loginError.body);
      }
    }
  } catch (e) {
    console.error('System Error:', e);
  }

  console.log('LOGIN SIMULATION END');
  console.log('----------------------------------------');

  app.quit();
});
