import { model, Schema } from "mongoose";
import { IVideo } from "./video.interface";

const videoSchema = new Schema<IVideo>({
  videoUrl: { type: String },
});

export const VideoModel = model<IVideo>("Video", videoSchema);

