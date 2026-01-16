import admin from "firebase-admin";
import serviceAccount from "../../../config/zodiack-26293-firebase-adminsdk-fbsvc-ce12b28cbe.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;
