import { NextFunction, Request, Response, Router } from "express";
import { AdminController } from "./admin.controller";
import validateRequest from "../../middlewares/validateRequest";
import { userZodSchema } from "../user/user.validation";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";
const router = Router();

router.get(
  "/teachers",
  auth("school", "admin"),
  AdminController.getAllTeachers
);
router.get(
  "/students",
  auth("school", "admin"),
  AdminController.getAllStudents
);
router.get("/news", AdminController.getAllNews);
router.get("/legals", AdminController.getAllLegal);
router.get("/:id", auth("admin"), AdminController.getEachTeacher);
router.get("/news/each/:newsId?", AdminController.getANews);
router.post(
  "/add-news",
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  AdminController.addNews
);
router.post(
  "/create-teacher",
  auth("admin"),
  validateRequest(userZodSchema),
  AdminController.createTeacher
);
router.post("/add-legal", AdminController.addLegal);
router.patch("/edit-license/:id", auth("admin"), AdminController.updateLicense);

export const AdminRoutes = router;
