import express from "express";
import perfumeController  from "../controller/perfume";
import perfumeValidation  from "../validation/perfume";
import authMiddleware from "../middleware/auth";
import { validate } from "../middleware/validate";
import { upload } from "../middleware/upload";
const perfumeRouter = express.Router();

perfumeRouter.get("/", authMiddleware,validate(perfumeValidation.getPerfumeValidation), perfumeController.perfume);
perfumeRouter.get("/search", authMiddleware,validate(perfumeValidation.searchValidation), perfumeController.searchPerfume);
perfumeRouter.get("/recentAndTopSearches", authMiddleware, perfumeController.recentAndTopSearches);

//reviews
perfumeRouter.post("/review", authMiddleware, validate(perfumeValidation.writeReviewValidation), perfumeController.writeReview);
perfumeRouter.get("/reviews", authMiddleware,validate(perfumeValidation.getPerfumeReviewsValidation), perfumeController.getPerfumeReviews);


perfumeRouter.get("/note", authMiddleware, validate(perfumeValidation.idValidation), perfumeController.getNotes);
perfumeRouter.get("/perfumer", authMiddleware,validate(perfumeValidation.idValidation), perfumeController.getPerfumer);
perfumeRouter.get("/simillerPerfume", authMiddleware,validate(perfumeValidation.similarValidation), perfumeController.simillerPerfume);



export default perfumeRouter