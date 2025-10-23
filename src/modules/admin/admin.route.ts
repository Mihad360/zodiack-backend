import { Router } from "express";
import { AdminController } from "./admin.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userZodSchema } from "../user/user.validation";
import auth from "../../middlewares/auth";
const router = Router();

router.get(
  "/teachers",
  auth("school", "admin"),
  AdminController.getAllTeachers
);
router.get(
  "/students",
  auth("school"),
  AdminController.getAllStudents
);
router.get("/:id", auth("admin"), AdminController.getEachTeacher);
router.post(
  "/create-teacher",
  auth("admin"),
  validateRequest(userZodSchema),
  AdminController.createTeacher
);
router.patch("/edit-license/:id", auth("admin"), AdminController.updateLicense);

export const AdminRoutes = router;
