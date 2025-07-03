import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import { setGlobalOptions } from "firebase-functions/v2";

admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

export const helloWorld = onRequest((request, response) => {
  response.send("Hello from Firebase!");
});
