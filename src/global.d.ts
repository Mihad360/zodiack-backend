// global.d.ts
import { Server as SocketIo } from "socket.io";

declare global {
  namespace Express {
    interface Request {
      users?: import("./modules/user/user.interface").IUser;
    }
  }
  namespace NodeJS {
    interface Global {
      io: SocketIo;
    }
  }
}
