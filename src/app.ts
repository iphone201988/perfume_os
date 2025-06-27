
import "dotenv/config";
import express, { NextFunction, Request, Response } from "express";
import morgan from "morgan";
import cors from "cors";
import router from "./router";
import { BadRequestError } from "./utils/errors";
import errorHandler from "./middleware/errorHandler";
import path from "path";
const app = express();


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.get("/", (req: Request, res: Response) => {
    res.send("API is running" + req.body);
});
app.use("/api/v1", router);
app.use((req: Request, res: Response, next: NextFunction) => {
    next(new BadRequestError("Route not found"));
});
app.use(errorHandler);

export default app