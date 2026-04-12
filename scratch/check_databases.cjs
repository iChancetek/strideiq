const { GoogleAuth } = require('google-auth-library');
const fetch = require('node-fetch') || globalThis.fetch;

async function checkDatabases() {
  try {
    const auth = new GoogleAuth({
      keyFile: 'c:\\Users\\chanc\\Downloads\\strideiq-221-firebase-adminsdk-fbsvc-3be5e649d1.json',
      scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/datastore']
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    console.log("Got access token! Fetching database listing...");
    const res = await fetch('https://firestore.googleapis.com/v1/projects/strideiq-221/databases', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();
    console.log("Databases List:");
    console.log(JSON.stringify(data, null, 2));

  } catch(e) {
    console.error("Failed:", e);
  }
}
checkDatabases();
