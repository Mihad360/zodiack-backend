import { ObjectId } from "mongoose";

export interface IAttachment {
    conversation_id: ObjectId;
    message_id: ObjectId;
    fileUrl: string;
    mimeType: string;
    isDeleted: boolean;
}
