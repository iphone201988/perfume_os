import { NextFunction, Request, Response } from "express";
import PerfumeModel from "../model/Perfume";
import { SUCCESS } from "../utils/response";
import { BadRequestError } from "../utils/errors";



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

        const perfumes = await PerfumeModel.findOne(query);
        SUCCESS(res, 200, "Perfume fetched successfully", { perfumes });
    } catch (error) {
        next(error);
    }
};



export default { perfume };