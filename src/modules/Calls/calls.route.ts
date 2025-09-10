import express from "express";
import auth from "../../middlewares/auth";
import { CallControllers } from "./calls.controller";

const router = express.Router();

router.post("/create-call", CallControllers.createCall);
router.get("/:conversation_id", CallControllers.getAllCallBySpeceficMessage);
router.get("/:conversation_id/:call_id", CallControllers.getEachCallMessage);
router.delete("/:callId", CallControllers.deleteCall);

export const CallRoutes = router;
