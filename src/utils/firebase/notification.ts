import admin from "./firebase";

export const sendPushNotifications = async (
  tokens: string[],
  title: string,
  body: string
) => {
  if (!tokens || tokens.length === 0) return;

  const message = {
    notification: { title, body },
    tokens,
  };
  console.log(message);
  const response = await admin.messaging().sendEachForMulticast(message);
  console.log(response);
  console.log(response.responses[0].error);
  // Auto-remove invalid or expired tokens
  response.responses.forEach((res, index) => {
    if (!res.success) {
      const errorCode = res.error?.code;

      if (
        errorCode === "messaging/registration-token-not-registered" ||
        errorCode === "messaging/invalid-registration-token"
      ) {
        console.log("Removing invalid token:", tokens[index]);
        // Remove token from DB here
      }
    }
  });

  return response;
};
