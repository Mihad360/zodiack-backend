import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { reviewServices } from "./review.service";

const addReview = catchAsync(async (req, res) => {
  const result = await reviewServices.addReview(
    req.body,
    // eslint-disable-next-line no-undef
    req.file as Express.Multer.File
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Emergency Reminder set successfully",
    data: result,
  });
});

const addMealsDonateCount = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await reviewServices.addMealsDonateCount(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Emergency Reminder set successfully",
    data: result,
  });
});

const getReviews = catchAsync(async (req, res) => {
  const result = await reviewServices.getReviews(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Emergency Reminder set successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getMealsCharity = catchAsync(async (req, res) => {
  const result = await reviewServices.getMealsCharity();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Emergency Reminder set successfully",
    data: result[0],
  });
});

const getPricingData = catchAsync(async (req, res) => {
  const result = await reviewServices.getPricingData();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Emergency Reminder set successfully",
    data: result[0],
  });
});

export const reviewControllers = {
  addReview,
  getReviews,
  addMealsDonateCount,
  getMealsCharity,
  getPricingData,
};
