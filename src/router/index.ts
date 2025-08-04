import express from "express";
import userRouter from "./user";
import perfumeRouter from "./perfume";
import badgesRouter from "./badges";
import articlesRouter from "./articles";
import adminRouter from "./admin";
const router = express.Router();

router.use("/user", userRouter);
router.use("/perfume", perfumeRouter);
router.use("/badges", badgesRouter);
router.use('/articles', articlesRouter);
router.use('/admin', adminRouter)


export default router