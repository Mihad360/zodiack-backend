import { VideoModel } from "./video.model";

const getVideo = async () => {
  const result = await VideoModel.find();
  return result;
};

export const videoServices = {
  getVideo,
};
