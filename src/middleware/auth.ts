import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors";
import UserModel from "../model/User";
import { verifyToken } from "../utils/utills";

const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.headers.authorization) {
            throw new UnauthorizedError("Unauthorized")
        }

        const token = req.headers.authorization.split(" ")[1];
        const decoded: any = verifyToken(token);
        if (!decoded) {
            throw new UnauthorizedError("Unauthorized")
        }
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            throw new UnauthorizedError("Unauthorized")
        }
        // if(user?.jti !== decoded?.jti){
        //     throw new UnauthorizedError("Unauthorized")
        // }
        req.user = user;
        req.userId = user._id;
        next();
    } catch (error) {
        next(error)
    }
};

export default authMiddleware;
