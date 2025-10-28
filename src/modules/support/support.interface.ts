import { Types } from "mongoose";

export type ISupport = {
  user: Types.ObjectId;
  title: string;
  description: string;
  isDeleted: boolean;
};
