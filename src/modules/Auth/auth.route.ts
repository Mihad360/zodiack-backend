import express from "express";
import { authControllers } from "./auth.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/login", authControllers.loginUser);
router.post("/participant-login", authControllers.participantLogin);
router.post("/forget-password", authControllers.forgetPassword);
router.post("/resend-otp/:email", authControllers.resendOtp);
router.post(
  "/reset-password",
  auth("admin", "teacher"),
  authControllers.resetPassword
);
router.post("/verify-otp", authControllers.verifyOtp);
router.post(
  "/change-password",
  auth("admin", "teacher"),
  authControllers.changePassword
);
router.post("/refresh-token", authControllers.refreshToken);

export const AuthRoutes = router;
