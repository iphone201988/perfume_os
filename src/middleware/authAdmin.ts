import { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../utils/errors";
import AdminModel from "../model/Admin";
import { verifyToken } from "../utils/utills";
import { ObjectId } from "mongoose";

const authAdminMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        if (!req.headers.authorization) {
            throw new UnauthorizedError("Unauthorized")
        }

        const token = req.headers.authorization.split(" ")[1];
        const decoded: any = verifyToken(token);
        if (!decoded) {
            throw new UnauthorizedError("Unauthorized")
        }
        const user = await AdminModel.findById(decoded.id);
        if (!user) {
            throw new UnauthorizedError("Unauthorized")
        }
        if(user?.jti !== decoded?.jti){
            throw new UnauthorizedError("Unauthorized")
        }
        req.user = user as any;
        req.userId = user._id as any;
        next();
    } catch (error) {
        next(error)
    }
};

export default authAdminMiddleware;
