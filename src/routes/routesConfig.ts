import { UserRoutes } from "../modules/user/user.route";
import { AdminRoutes } from "../modules/admin/admin.route";
import { AuthRoutes } from "../modules/Auth/auth.route";
import { TripRoutes } from "../modules/Trip/trip.route";
import { JoinParticipantsRoutes } from "../modules/JoinedParticipants/joinedparticipants.route";
import { SettingRoutes } from "../modules/settings/settings.route";
import { TeacherRoutes } from "../modules/Teacher/teacher.route";

export const routesConfig = [
  { path: "/users", handler: UserRoutes },
  { path: "/auth", handler: AuthRoutes },
  { path: "/trips", handler: TripRoutes },
  { path: "/participants", handler: JoinParticipantsRoutes },
  { path: "/settings", handler: SettingRoutes },
  { path: "/teachers", handler: TeacherRoutes },
  { path: "/admin", handler: AdminRoutes },
];
