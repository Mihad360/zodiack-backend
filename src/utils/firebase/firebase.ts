import admin from "firebase-admin";
import serviceAccount from "../../../../secrets/zodiack-26293-firebase-adminsdk-fbsvc-1684730aeb.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;