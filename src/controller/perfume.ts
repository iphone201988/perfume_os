import { NextFunction, Request, Response } from "express";
import PerfumeModel from "../model/Perfume";
import { SUCCESS } from "../utils/response";
import { BadRequestError } from "../utils/errors";
import ReviewModel from "../model/Reviews";



// get perfume
const perfume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name, brand } = req.query;

        let query: Record<string, any> = {};

        if (typeof name === 'string') {
            const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query['name'] = new RegExp(escapedName, 'i');
        }

        if (typeof brand === 'string') {
            const escapedBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            query['brand'] = new RegExp(escapedBrand, 'i');
        }

        const perfume:any = await PerfumeModel.findOne(query).lean();
        if(!perfume){
            throw new BadRequestError("Perfume not found");
        }
        perfume.reviews =  await ReviewModel.find({perfumeId:perfume._id}).lean();
        SUCCESS(res, 200, "Perfume fetched successfully", { perfume });
    } catch (error) {
        next(error);
    }
};

//search perfume
const searchPerfume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { name } = req.query;
        const perfume = await PerfumeModel.find({ name: { $regex: name, $options: 'i' } }).lean();
        SUCCESS(res, 200, "Perfume fetched successfully", { perfume });
    } catch (error) {
        next(error);
    }
}



export default { perfume };