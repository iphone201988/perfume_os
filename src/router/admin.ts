import express from "express";
import adminController  from "../controller/admin";
import adminValidation  from "../validation/admin";
import authMiddleware from "../middleware/auth";
import { validate } from "../middleware/validate";
import { upload } from "../middleware/upload";
import authAdminMiddleware from "../middleware/authAdmin";
const adminRouter = express.Router();

adminRouter.post("/login",validate(adminValidation.loginValidation), adminController.loginAdmin);
adminRouter.get("/me",authAdminMiddleware, adminController.getProfile);
adminRouter.get("/dashboard",authAdminMiddleware, adminController.dashboard);
adminRouter.get("/users",authAdminMiddleware, adminController.getUsers);
adminRouter.get("/user/:userId",authAdminMiddleware, adminController.getUserById);
adminRouter.put("/user/:userId",authAdminMiddleware, adminController.updateUser);
adminRouter.put("/user/:userId/suspend",authAdminMiddleware, adminController.suspendAccount);
adminRouter.post("/addQuestion", authAdminMiddleware,upload.single("file"),validate(adminValidation.createQuestionValidation), adminController.createQuestion);
adminRouter.get("/questions", authAdminMiddleware, adminController.getQuestions);
adminRouter.put("/question/:id", authAdminMiddleware, upload.single("file"),validate(adminValidation.updateQuestionValidation), adminController.updateQuestion);
adminRouter.delete("/question/:id", authAdminMiddleware,validate(adminValidation.deleteQuestionValidation), adminController.deleteQuestion);

adminRouter.get("/articles", authAdminMiddleware, adminController.getArticles);
adminRouter.post("/addArticle",authAdminMiddleware,upload.single("file"), adminController.createArticle);
adminRouter.put("/article/:articleId", authAdminMiddleware,upload.single("file"), adminController.updateArticle);
adminRouter.delete("/article/:articleId", authAdminMiddleware, adminController.deleteArticle);


//perfume
adminRouter.get("/perfumes", authAdminMiddleware, adminController.getPerfumes);
adminRouter.get("/perfume/:perfumeId", authAdminMiddleware, adminController.getPerfumeById);
adminRouter.post("/addPerfume", authAdminMiddleware,upload.single("file"), adminController.createPerfume);
adminRouter.put("/perfume/:perfumeId", authAdminMiddleware,upload.single("file"), adminController.updatePerfume);
adminRouter.delete("/perfume/:perfumeId", authAdminMiddleware, adminController.deletePerfume);


adminRouter.get("/notes", authAdminMiddleware, adminController.getNotes);
adminRouter.get("/perfumers", authAdminMiddleware, adminController.getPerfumers);


export default adminRouter