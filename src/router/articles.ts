import express from "express";
import articlesController  from "../controller/articles";
import articlesValidation  from "../validation/articles";
import authMiddleware from "../middleware/auth";
import { validate } from "../middleware/validate";
import { upload } from "../middleware/upload";
const articlesRouter = express.Router();


articlesRouter.post("/", authMiddleware,upload.single("file"),validate(articlesValidation.createArticleValidation), articlesController.createArticle);
articlesRouter.get("/me", authMiddleware, articlesController.getArticles);
articlesRouter.put("/:articleId", authMiddleware, upload.single("file"),validate(articlesValidation.updateArticleValidation), articlesController.updateArticle);
export default articlesRouter