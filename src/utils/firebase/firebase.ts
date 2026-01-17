import admin from "firebase-admin";
import serviceAccount from "../../../config/groupmate-f4a4a-firebase-adminsdk-fbsvc-4f1e9a108f.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export default admin;
