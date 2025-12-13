import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { reviewControllers } from "./review.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get("/reviews", reviewControllers.getReviews);
router.get("/charity-meals", reviewControllers.getMealsCharity);
router.get("/pricings", reviewControllers.getPricingData);
router.post("/donate-meals-charity/:id", reviewControllers.addMealsDonateCount);
router.post(
  "/add-review",
  auth("admin"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  reviewControllers.addReview
);

export const reviewRoutes = router;
