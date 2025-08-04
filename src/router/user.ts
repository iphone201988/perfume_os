import express from "express";
import userController from "../controller/user";
import userValidation from "../validation/user";
import authMiddleware from "../middleware/auth";
import { validate } from "../middleware/validate";
import { upload } from "../middleware/upload";
import perfumeController  from "../controller/perfume";

const userRouter = express.Router();

userRouter.post("/socialLogin", validate(userValidation.socialLoginValidation), userController.socialLogin);
userRouter.post("/register", validate(userValidation.registerValidation), userController.register);
userRouter.post("/login", validate(userValidation.loginValidation), userController.login);
userRouter.get("/me", authMiddleware, userController.profile);
userRouter.put("/profileUpdate", authMiddleware, upload.single("file"), validate(userValidation.profileUpateValidation), userController.profileUpdate);
userRouter.put("/updateData", authMiddleware, validate(userValidation.updateDataValidation), userController.updateUserData);
userRouter.post("/forgetPassword", validate(userValidation.forgetValidation), userController.forgetPassword);
userRouter.post("/verifyOtp", validate(userValidation.verifyOtpValidation), userController.verifyOtp);
userRouter.post("/resetPassword", authMiddleware, validate(userValidation.resetValidation), userController.resetPassword);
userRouter.delete("/deleteAccount", authMiddleware, validate(userValidation.deleteValidation), userController.deleteUser);

//uplaod image  
userRouter.post("/upload", authMiddleware, upload.single("file"), userController.uploadImage);

//follow user
userRouter.post("/follow/:userId", authMiddleware, validate(userValidation.followValidation), userController.followUser);

//collection
userRouter.post("/collection/:perfumeId", authMiddleware, validate(userValidation.collectionValidation), userController.addCollection);
userRouter.post("/wishlist/:perfumeId", authMiddleware, validate(userValidation.collectionValidation), userController.addWishlist);

//user data
userRouter.get("/userData", authMiddleware, validate(userValidation.userDataValidation), userController.userData);


//favorite
userRouter.post("/favorite", authMiddleware, validate(userValidation.favoriteValidation), perfumeController.addFavorite);
userRouter.get("/favorite", authMiddleware, validate(userValidation.getFavoriteValidation), perfumeController.getFavorites);


// //  user question
// userRouter.post("/submitQuiz", authMiddleware, validate(userValidation.submitQuizValidation), userController.submitUserQuiz);
// userRouter.get("/quiz", authMiddleware, userController.getQuestions);

//notification
userRouter.get("/notifications", authMiddleware,validate(userValidation.notificationValidation), userController.getNotifications);
userRouter.put("/markNotificationAsRead", authMiddleware,validate(userValidation.markNotificationAsReadValidation), userController.markNotificationAsRead);
export default userRouter