const admin = require('firebase-admin');

admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json'),
});

const uid = 'TGGvcQ9fhcbzWVhaVHYFweT8pKI2';

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`Custom claim 'admin: true' set for user ${uid}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error setting custom claim:', error);
    process.exit(1);
  });