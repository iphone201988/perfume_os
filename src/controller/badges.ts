import { NextFunction, Request, Response } from "express";
import { SUCCESS } from "../utils/response";
import BadgesModel from "../model/Badges";
import UserBadgesModel from "../model/UserBadges";

const createBadge = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (req?.file) {
            req.body.image = `/uploads/${(req.file as Express.Multer.File).filename}`
        }
        await BadgesModel.create(req.body);
        SUCCESS(res, 200, "Badge created successfully");
    } catch (error) {
        next(error);
    }
};
const getBadges = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const badges = await BadgesModel.find({});
        SUCCESS(res, 200, "Badge fetched successfully", { data: badges });
    } catch (error) {
        next(error);
    }
}
const updateBadge = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (req?.file) {
            req.body.image = `/uploads/${(req.file as Express.Multer.File).filename}`
        }
        await BadgesModel.findByIdAndUpdate(req.params.id, req.body);
        SUCCESS(res, 200, "Badge updated successfully");
    } catch (error) {
        next(error);
    }
};
export default { createBadge, getBadges, updateBadge };