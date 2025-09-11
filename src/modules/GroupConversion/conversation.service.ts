import { JwtPayload, StudentJwtPayload } from "../../interface/global";
import { IConversation } from "./conversation.interface";
import { ConversationModel } from "./conversation.model";

const createConversation = async (payload: IConversation) => {
  return payload;
};
const getAllConversation = async (user: JwtPayload & StudentJwtPayload) => {
  const participantId = user.user ? user.user : user.studentId;
  console.log(user);
  if (user.role === "participant") {
    const conversations = await ConversationModel.find({
      participants: participantId, // Match the participant ID in the participants array
      isDeleted: false, // Optional: Only return conversations that are not deleted
    })
      .populate("teacher", "user_name") // Populate teacher details (optional)
      .populate("trip_id", "trip_name trip_date") // Populate trip details (optional)
      .populate("participants", "firstName"); // Populate participant details (optional)

    return conversations;
  } else if (user.role === "teacher") {
    const teacherId = user.user; // Assuming teacherId is stored as user.user

    const conversations = await ConversationModel.find({
      teacher: teacherId, // Filter conversations where the teacher matches
      isDeleted: false, // Only return conversations that are not deleted
    })
      .populate("teacher", "user_name") // Populate teacher details (optional)
      .populate("trip_id", "trip_name trip_date") // Populate trip details (optional)
      .populate("participants", "firstName lastName"); // Populate participants (students) in the conversation

    return conversations;
  }
};
const getEachConversation = async () => {};
const updateConversation = async () => {};
const deleteConversation = async () => {};

export const conversationServices = {
  createConversation,
  getAllConversation,
  getEachConversation,
  updateConversation,
  deleteConversation,
};
