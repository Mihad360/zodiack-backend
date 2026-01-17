// notification.service.ts
import { UserModel } from "../../modules/user/user.model";
import admin from "./firebase";

export interface CallUser {
  _id: string | undefined;
  name: string | undefined;
  email: string | undefined;
}

export const sendCallPushNotification = async (
  receiverId: string,
  caller: CallUser,
  requestType: "video-call" | "audio-call"
) => {
  try {
    // Get receiver's FCM token
    console.log(caller);
    console.log(receiverId);
    const receiver =
      await UserModel.findById(receiverId).select("fcmToken name");

    // ✅ FIXED: Check for single fcmToken field
    if (!receiver || !receiver.fcmToken) {
      console.log("No FCM token found for user:", receiverId);
      return;
    }

    const isVideoCall = requestType === "video-call";
    const callType = isVideoCall ? "Video" : "Audio";
    console.log(isVideoCall, callType);
    // ✅ FIXED: Use send() instead of sendEachForMulticast() for single token
    const message = {
      notification: {
        title: `Incoming ${callType} Call`,
        body: `${caller.name} is calling...`,
      },
      data: {
        type: "call",
        callType: requestType,
        callerId: caller._id?.toString() || "",
        callerName: caller.name || "Unknown",
        callerEmail: caller.email || "",
        timestamp: Date.now().toString(),
      },
      android: {
        priority: "high" as const,
        notification: {
          channelId: "call_channel",
          sound: "ringtone",
          priority: "max" as const,
          visibility: "public" as const,
          category: "call",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "ringtone.mp3",
            category: "call",
            "interruption-level": "critical",
          },
        },
      },
      token: receiver.fcmToken, // ✅ Single token (not tokens array)
    };

    console.log("Sending call notification to:", receiver.name);

    // ✅ FIXED: Use send() for single token
    const response = await admin.messaging().send(message);

    console.log("Call notification sent successfully:", response);
    return response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error sending call notification:", error);

    // ✅ Handle invalid token errors
    if (
      error.code === "messaging/registration-token-not-registered" ||
      error.code === "messaging/invalid-registration-token"
    ) {
      console.log("Removing invalid token for user:", receiverId);
    }
  }
};
