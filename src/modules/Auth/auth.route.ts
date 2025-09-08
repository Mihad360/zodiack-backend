import express from "express";
import { authControllers } from "./auth.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/login", authControllers.loginUser);
router.post("/forget-password", authControllers.forgetPassword);
router.post("/reset-password", authControllers.resetPassword);
router.post("/verify-otp", authControllers.verifyOtp);
router.post(
  "/change-password",
  auth("admin", "teacher"),
  authControllers.changePassword
);

export const AuthRoutes = router;
