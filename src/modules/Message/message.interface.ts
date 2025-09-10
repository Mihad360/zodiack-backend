// interfaces/Message.ts

import { ObjectId } from 'mongoose';

export interface IMessage {
    sender_id: ObjectId;
    group_id: ObjectId;
    msg: string;
    msgType: 'text' | 'attachments' | 'call';
    is_read: boolean;
    isDeleted: boolean;
}

