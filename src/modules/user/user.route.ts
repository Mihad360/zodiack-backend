import express, { NextFunction, Request, Response } from "express";
import { userControllers } from "./user.controller";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";
import { teacherControllers } from "../Teacher/teacher.controller";

const router = express.Router();

router.get("/", auth("admin"), userControllers.getUsers);
router.get(
  "/me",
  auth("admin", "teacher", "participant"),
  userControllers.getMe
);
router.patch(
  "/update-profile",
  auth("admin", "teacher"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  userControllers.editUserProfile
);
router.delete("/:id", auth("admin", "school"), userControllers.deleteUser);
router.delete("/:id", auth("teacher"), teacherControllers.removeParticipant);

export const UserRoutes = router;
