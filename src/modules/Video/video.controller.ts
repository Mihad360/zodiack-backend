import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { videoServices } from "./video.service";

const getVideo = catchAsync(async (req, res) => {
  const result = await videoServices.getVideo();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User deleted successfully",
    data: result[0],
  });
});

export const videoControllers = {
  getVideo,
};
