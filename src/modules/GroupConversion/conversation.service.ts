import { IConversation } from "./conversation.interface";

const createConversation = async (payload: IConversation) => {
  return payload;
};
const getAllConversation = async () => {};
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
