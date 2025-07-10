import express from "express";
import badgesController  from "../controller/badges";
import badgesValidation  from "../validation/badges";
import authMiddleware from "../middleware/auth";
import { validate } from "../middleware/validate";
import { upload } from "../middleware/upload";
const badgesRouter = express.Router();


badgesRouter.post("/", authMiddleware,upload.single("file"),validate(badgesValidation.createBadgeValidation), badgesController.createBadge);
badgesRouter.get("/me", authMiddleware, badgesController.getBadges);
badgesRouter.put("/:badgeId", authMiddleware, upload.single("file"),validate(badgesValidation.updateBadgeValidation), badgesController.updateBadge);
export default badgesRouter