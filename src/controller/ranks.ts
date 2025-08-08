import { NextFunction, Request, Response } from "express";
import { SUCCESS } from "../utils/response";
import RanksModel from "../model/Ranks";


// create rank
const createRank = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (req?.file) {
            req.body.image = `/uploads/${(req.file as Express.Multer.File).filename}`
        }
        await RanksModel.create(req.body);
        SUCCESS(res, 200, "Rank created successfully");
    } catch (error) {
        next(error);
    }
};
const getRanks = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const rankPoints = user.rankPoints || 0;
        const ranks = await RanksModel.find({}).sort({ min: 1 }).lean();

        const ranksWithFlag = ranks.map((rank: any) => ({
            ...rank,
            currentRank: rankPoints >= rank.min && rankPoints <= rank.max
        }));
        const currentRank = ranks.find(rank => rankPoints >= rank.min && rankPoints <= rank.max) || null;

        SUCCESS(res, 200, "Ranks fetched successfully", {
            data: {
                ranks: ranksWithFlag,
                currentRank,
                rankPoints,
            }
        });
    } catch (error) {
        next(error);
    }
};
export default { createRank, getRanks };