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
adminRouter.post("/addQuestion", authAdminMiddleware,upload.single("file"),validate(adminValidation.createQuestionValidation), adminController.createQuestion);
adminRouter.get("/questions", authAdminMiddleware, adminController.getQuestions);
adminRouter.put("/question/:id", authAdminMiddleware, upload.single("file"),validate(adminValidation.updateQuestionValidation), adminController.updateQuestion);
adminRouter.delete("/question/:id", authMiddleware,validate(adminValidation.deleteQuestionValidation), adminController.deleteQuestion);
export default adminRouter