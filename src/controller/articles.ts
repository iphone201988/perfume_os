import { NextFunction, Request, Response } from "express";
import { SUCCESS } from "../utils/response";
import ArticlesModel from "../model/Articles";


// create article
const createArticle = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (req?.file) {
            req.body.image = `/uploads/${(req.file as Express.Multer.File).filename}`
        }
        await ArticlesModel.create(req.body);
        SUCCESS(res, 200, "Article created successfully");
    } catch (error) {
        next(error);
    }
};
const getArticles = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { page="1", limit="10" } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        const articles = await ArticlesModel.find({}).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean();
        const totalCount = await ArticlesModel.countDocuments({});
        const pagination = { totalCount, currentPage, perPage };
        SUCCESS(res, 200, "Articles fetched successfully", { data: {articles, pagination} });
    } catch (error) {
        next(error);
    }
}
const updateArticle = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (req?.file) {
            req.body.image = `/uploads/${(req.file as Express.Multer.File).filename}`
        }
        await ArticlesModel.findByIdAndUpdate(req.params.articleId, req.body);
        SUCCESS(res, 200, "Article updated successfully");
    } catch (error) {
        next(error);
    }
}
export default { createArticle, getArticles,updateArticle };