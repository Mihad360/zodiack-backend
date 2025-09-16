import { UserRoutes } from "../modules/user/user.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { TripRoutes } from "../modules/Trip/trip.route";
import { JoinParticipantsRoutes } from "../modules/JoinedParticipants/joinedparticipants.route";
import { SettingRoutes } from "../modules/settings/settings.route";
import { TeacherRoutes } from "../modules/Teacher/teacher.route";
import { NotificationRoutes } from "../modules/Notification/notification.route";
import { ConversationRoutes } from "../modules/GroupConversion/conversation.route";
import { MessageRoutes } from "../modules/Message/message.route";
import { AttachmentRoutes } from "../modules/Attachments/attachment.route";
import { CallRoutes } from "../modules/Calls/calls.route";
import { LocationRoutes } from "../modules/Location/location.route";

export const routesConfig = [
  { path: "/users", handler: UserRoutes },
  { path: "/auth", handler: AuthRoutes },
  { path: "/trips", handler: TripRoutes },
  { path: "/participants", handler: JoinParticipantsRoutes },
  { path: "/settings", handler: SettingRoutes },
  { path: "/teachers", handler: TeacherRoutes },
  { path: "/notifications", handler: NotificationRoutes },
  { path: "/admin", handler: AdminRoutes },
  { path: "/conversations", handler: ConversationRoutes },
  { path: "/messages", handler: MessageRoutes },
  { path: "/attachments", handler: AttachmentRoutes },
  { path: "/location", handler: LocationRoutes },
  { path: "/calls", handler: CallRoutes },
];
