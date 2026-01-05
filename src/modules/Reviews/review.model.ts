import { Schema, model } from "mongoose";
import { ITestimonial } from "./review.interface";

const AuthorSchema = new Schema(
  {
    name: { type: String, required: true },
    role: { type: String, required: true },
    organization: { type: String, required: true },
    image: { type: String }, // optional
  },
  { _id: false }
);

const TestimonialSchema = new Schema<ITestimonial>(
  {
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    review: { type: String, required: true },

    author: {
      type: AuthorSchema,
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const TestimonialModel = model<ITestimonial>(
  "Testimonial",
  TestimonialSchema
);

const DonateSchema = new Schema(
  {
    meals: { type: Number },
  },
  {
    timestamps: true,
  }
);

export const DonateModel = model("Donate", DonateSchema);

interface IPricingData extends Document {
  title: string;
  billingType: "annually" | "monthly";
  pricing: string[];
}

const PricingDataSchema: Schema<IPricingData> = new Schema({
  title: { type: String, required: true },
  billingType: { type: String, enum: ["annually", "monthly"], required: true },
  pricing: [{ type: String, required: true }],
});

const PricingModel = model<IPricingData>("PricingData", PricingDataSchema);

export default PricingModel;
