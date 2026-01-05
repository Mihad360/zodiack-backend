import express from "express";
import auth from "../../middlewares/auth";
import { teacherControllers } from "./teacher.controller";

const router = express.Router();

router.get("/own-trips", auth("teacher"), teacherControllers.getTripsByTeacher);
router.get(
  "/:id/trip-students",
  auth("teacher"),
  teacherControllers.getTripStudents
);

export const TeacherRoutes = router;
