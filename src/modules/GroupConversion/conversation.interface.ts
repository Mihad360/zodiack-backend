// import { IMessage } from "./../Message/message.interface";
import { Types } from "mongoose";
import { IUser } from "../user/user.interface";

export interface IConversation {
  _id?: Types.ObjectId;
  teacher?: Types.ObjectId | Partial<IUser>;
  trip_id?: Types.ObjectId;
  user?: Types.ObjectId;
  participant_id?: Types.ObjectId;
  lastMsg?: Types.ObjectId;
  isDeleted: boolean;
}

export interface IMessageConversation extends IConversation {
  teacher: Partial<IUser>;
}
