import express, { NextFunction, Request, Response } from "express";
import { guardRole } from "../../middlewares/roleGuard";
import { userControllers } from "./user.controller";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get("/", auth("admin"), userControllers.getUsers);
router.get("/me", auth("admin", "teacher"), userControllers.getMe);
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
router.delete(
  "/account-delete",
  guardRole(["admin", "user"]),
  userControllers.deleteUser
);

export const UserRoutes = router;
