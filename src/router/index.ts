import express from "express";
import userRouter from "./user";
import perfumeRouter from "./perfume";
const router = express.Router();

router.use("/user", userRouter);
router.use("/perfume", perfumeRouter);


export default router