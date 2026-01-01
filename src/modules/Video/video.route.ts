import express from "express";
import { videoControllers } from "./video.controller";

const router = express.Router();

router.get("/", videoControllers.getVideo);

export const videoRoutes = router;
