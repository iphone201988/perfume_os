import express from "express";
import perfumeController  from "../controller/perfume";
import authMiddleware from "../middleware/auth";
import { validate } from "../middleware/validate";
import { upload } from "../middleware/upload";
const perfumeRouter = express.Router();


