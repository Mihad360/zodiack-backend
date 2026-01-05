import admin from "firebase-admin";
import serviceAccount from "../../../config/zodiack-26293-firebase-adminsdk-fbsvc-5a3658df41.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;
