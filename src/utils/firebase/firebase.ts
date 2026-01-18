import admin from "firebase-admin";
import serviceAccount from "../../../config/groupmate-f4a4a-firebase-adminsdk-fbsvc-4f1e9a108f.json";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

// ✅ LOG BACKEND FIREBASE PROJECT DETAILS
console.log("==========================================");
console.log("🔥 BACKEND FIREBASE CONFIG");
console.log("==========================================");
console.log("Project ID:", serviceAccount.project_id);
console.log("Client Email:", serviceAccount.client_email);
console.log("Private Key ID:", serviceAccount.private_key_id);
console.log("==========================================\n");

export default admin;
