import { Schema, model } from "mongoose";
import { ILegal, INews } from "./news.interface";

const NewsSchema = new Schema<INews>(
  {
    title: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
    },
    category: {
      type: String,
      default: "General",
    },
    readTime: {
      type: String,
      default: "5 min read",
    },
    publishedDate: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const NewsModel = model<INews>("News", NewsSchema);

const LegalSchema = new Schema<ILegal>(
  {
    description: {
      type: String,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const LegalModel = model<ILegal>("Legal", LegalSchema);
