import express from "express";
import userRouter from "./user";
import perfumeRouter from "./perfume";
import badgesRouter from "./badges";
const router = express.Router();

router.use("/user", userRouter);
router.use("/perfume", perfumeRouter);
router.use("/badges", badgesRouter);


export default router