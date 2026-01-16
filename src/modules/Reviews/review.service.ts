import HttpStatus from "http-status";
import AppError from "../../errors/AppError";
import { ITestimonial } from "./review.interface";
import PricingModel, { DonateModel, TestimonialModel } from "./review.model";
import { sendImageToCloudinary } from "../../utils/sendImageToCloudinary";
import QueryBuilder from "../../builder/QueryBuilder";

// eslint-disable-next-line no-undef
const addReview = async (payload: ITestimonial, file: Express.Multer.File) => {
  try {
    if (!payload) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Review payload is required");
    }
    let imageUrl = "";

    // Upload thumbnail if provided
    if (file) {
      const uploadedImage = await sendImageToCloudinary(
        file.buffer,
        file.originalname,
        file.mimetype
      );
      imageUrl = uploadedImage.secure_url;
    } else {
      throw new Error("Thumbnail image is required");
    }
    payload.author.image = imageUrl;
    console.log(payload);
    const newReview = await TestimonialModel.create(payload);

    if (!newReview) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Failed to create testimonial review"
      );
    }

    return newReview;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error adding testimonial:", error.message);
    throw new AppError(
      HttpStatus.INTERNAL_SERVER_ERROR,
      error.message || "Something went wrong while adding testimonial"
    );
  }
};

const getReviews = async (query: Record<string, unknown>) => {
  const testQuery = new QueryBuilder(
    TestimonialModel.find({ isDeleted: false }).sort({ createdAt: -1 }),
    query
  )
    .paginate()
    .fields();
  const meta = await testQuery.countTotal();
  const result = await testQuery.modelQuery;

  return { meta, result };
};

const addMealsDonateCount = async (id: string, payload: { meals: number }) => {
  const result = await DonateModel.findByIdAndUpdate(
    id,
    {
      $inc: { meals: payload.meals }, // increments meals value
    },
    { new: true }
  );

  return result;
};

const getMealsCharity = async () => {
  const result = await DonateModel.find();
  return result;
};

const getPricingData = async () => {
  const result = await PricingModel.find();
  return result;
};

const deleteReview = async (id: string) => {
  const result = await TestimonialModel.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return result;
};

export const reviewServices = {
  addReview,
  getReviews,
  addMealsDonateCount,
  getMealsCharity,
  getPricingData,
  deleteReview,
};
