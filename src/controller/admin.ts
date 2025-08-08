import { NextFunction, Request, Response } from "express";
import QuestionModel from "../model/QuestionModel";
import { SUCCESS } from "../utils/response";
import { comparePassword, filterMainAccords, findUserByEmail, generateOtp, parseJsonIfString, processNotes, processPercentageArray, processPerfumers, publicViewData, signToken } from "../utils/utills";
import { BadRequestError } from "../utils/errors";
import AdminModel from "../model/Admin";
import UserModel from "../model/User";
import PerfumeModel from "../model/Perfume";
import { startOfMonth, subMonths, endOfMonth } from 'date-fns';
import ArticlesModel from "../model/Articles";
import FollowModel from "../model/Follow";
import ReviewModel from "../model/Reviews";
import NotesModel from "../model/Notes";
import PerfumersModel from "../model/Perfumers";
import { getCache, setCache } from "../config/cache";



//login admin
const loginAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = await AdminModel.findOne({ email: req.body.email });
        if (!user) {
            throw new BadRequestError("User does not exist");
        }
        const isMatch = await comparePassword(req.body.password, user.password);
        if (!isMatch) {
            throw new BadRequestError("Invalid credentials");
        }
        user.jti = generateOtp(30, true, true);
        user.deviceToken = req.body.deviceToken ?? null;
        user.deviceType = req.body.deviceType ?? null;
        await user.save();
        const data = publicViewData(user)
        const token = signToken({ id: user._id, jti: user.jti });
        SUCCESS(res, 200, "Login successful", { data: { ...data, token } });

    } catch (error) {
        next(error);
    }
};
const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const data = publicViewData(req.user)
        SUCCESS(res, 200, "fetch successfully", { data: { ...data } });

    } catch (error) {
        next(error);
    }
};
//dashboard data 
const dashboard = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const totalUsers = await UserModel.countDocuments();
        const totalPerfumes = await PerfumeModel.countDocuments();

        const now = new Date();
        const startOfThisMonth = startOfMonth(now);
        const startOfLastMonth = startOfMonth(subMonths(now, 1));
        const endOfLastMonth = endOfMonth(subMonths(now, 1));

        const perfumesAddedThisMonth = await PerfumeModel.countDocuments({
            createdAt: { $gte: startOfThisMonth }
        });
        // Users registered this month
        const usersThisMonth = await UserModel.countDocuments({
            createdAt: { $gte: startOfThisMonth }
        });

        // Users registered last month
        const usersLastMonth = await UserModel.countDocuments({
            createdAt: {
                $gte: startOfLastMonth,
                $lte: endOfLastMonth
            }
        });

        const usersMoreThanLastMonth = usersThisMonth - usersLastMonth;

        const data = {
            totalUsers,
            totalPerfumes,
            usersThisMonth,
            usersLastMonth,
            usersMoreThanLastMonth,
            perfumesAddedThisMonth
        };

        SUCCESS(res, 200, "Fetch successful", { data });
    } catch (error) {
        next(error);
    }
};
// get users 
const getUsers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { page = "1", limit = "10", search, sort = "name_asc" } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        const findQuery: any = { isDeleted: false };
        if (search) {
            findQuery.fullname = new RegExp("^" + search, "i")
        };
        const sortOptions: Record<string, Record<string, 1 | -1>> = {
            "date_desc": { createdAt: -1 },
            "date_asc": { createdAt: 1 },
            "name_asc": { fullname: 1 },
            "name_desc": { fullname: -1 },
        };

        const sortStage = sortOptions[sort as string] || { fullname: 1 };
        const users = await UserModel.aggregate([
            {
                $match: findQuery
            },
            {
                $sort: sortStage
            },
            {
                $skip: skip
            },
            {
                $limit: perPage
            },
            {
                $project: {
                    username: 1,
                    fullname: 1,
                    email: 1,
                    profileImage: 1,
                    createdAt: 1
                }
            }
        ]);
        const totalCount = await UserModel.countDocuments(findQuery);
        const pagination = { totalCount, currentPage, perPage, totalPage: Math.ceil(totalCount / perPage) };
        SUCCESS(res, 200, "User fetched successfully", { data: { users, pagination } });
    } catch (error) {
        next(error);
    }
};
const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user: any = await UserModel.findById(req.params.userId).select("-password");
        if (!user) {
            throw new BadRequestError("User does not exist");
        }
        user.followers = await FollowModel.countDocuments({ followId: user._id });
        user.following = await FollowModel.countDocuments({ userId: user._id });
        SUCCESS(res, 200, "User fetched successfully", { data: user });
    } catch (error) {
        next(error);
    }
}
// update user
const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        await UserModel.findByIdAndUpdate(req.params.userId, req.body);
        SUCCESS(res, 200, "User updated successfully");
    } catch (error) {
        next(error);
    }
};
// suspend user
const suspendAccount = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user: any = await UserModel.findById(req.params.userId);
        if (!user) {
            throw new BadRequestError("User does not exist");
        }
        user.suspendAccount = !user.suspendAccount;
        await user.save();
        SUCCESS(res, 200, `User ${user.suspendAccount ? "suspended" : "activated"} successfully`);
    } catch (error) {
        next(error);
    }
};

// add question
const createQuestion = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        console.log(req.file, "file");
        if (req?.file) {
            req.body.image = `/uploads/${(req.file as Express.Multer.File).filename}`
        }
        await QuestionModel.create(req.body);
        SUCCESS(res, 200, "Question created successfully");
    } catch (error) {
        next(error);
    }
};

const getQuestions = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { page = "1", limit = "10", type } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        const findQuery = { isDeleted: false };
        if (type) findQuery['type'] = type;
        const questions = await QuestionModel.find(findQuery).sort({ createdAt: -1 }).skip(skip).limit(perPage).lean();
        const totalCount = await QuestionModel.countDocuments(findQuery);
        const pagination = { totalCount, currentPage, perPage, totalPage: Math.ceil(totalCount / perPage) };
        SUCCESS(res, 200, "Question fetched successfully", { data: { questions, pagination } });
    } catch (error) {
        next(error);
    }
};

const deleteQuestion = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        await QuestionModel.findByIdAndUpdate(req.params.id, { isDeleted: true });
        SUCCESS(res, 200, "Question deleted successfully");
    } catch (error) {
        next(error);
    }
};
const updateQuestion = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (req?.file) {
            req.body.image = `/uploads/${(req.file as Express.Multer.File).filename}`
        }
        await QuestionModel.findByIdAndUpdate(req.params.id, req.body);
        SUCCESS(res, 200, "Question updated successfully");
    } catch (error) {
        next(error);
    }
};

const getArticles = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { page = "1", limit = "10", search, sort = 'date_desc' } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        const findQuery: any = {  };
        if (search) {
            findQuery.questionText = new RegExp("^" + search, "i")
        };
        const sortOptions: Record<string, Record<string, 1 | -1>> = {
            "date_desc": { createdAt: -1 },
            "date_asc": { createdAt: 1 },
            "name_asc": { questionText: 1 },
            "name_desc": { questionText: -1 },
        };

        const sortStage = sortOptions[sort as string] || { questionText: 1 };

        const articles = await ArticlesModel.find(findQuery).sort(sortStage).skip(skip).limit(perPage).lean();
        const totalCount = await ArticlesModel.countDocuments({});
        const pagination = { totalCount, currentPage, perPage };
        SUCCESS(res, 200, "Articles fetched successfully", { data: { articles, pagination } });
    } catch (error) {
        next(error);
    }
};
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
};
const deleteArticle = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        await ArticlesModel.findByIdAndDelete(req.params.articleId);
        SUCCESS(res, 200, "Article deleted successfully");
    } catch (error) {
        next(error);
    }
};
const getPerfumes = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { page = "1", limit = "10",search, sort='date_desc' } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        const findQuery: any = {  };
          if (search) {
            findQuery.name = new RegExp("^" + search, "i")
        };
        const sortOptions: Record<string, Record<string, 1 | -1>> = {
            "date_desc": { createdAt: -1 },
            "date_asc": { createdAt: 1 },
            "name_asc": { questionText: 1 },
            "name_desc": { questionText: -1 },
        };

        const sortStage = sortOptions[sort as string] || { questionText: 1 };

        const perfumes = await PerfumeModel.aggregate([
            {
                $match: findQuery
            },
            {
                $sort: { createdAt: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: perPage
            },
            {
                $lookup: {
                    from: "Review",
                    localField: "_id",
                    foreignField: "perfumeId",
                    as: "reviews"
                }
            },
            { $addFields: { reviewCount: { $size: "$reviews" } } },
            {
                $project: {
                    reviews: 0
                }
            }
        ]);

        const totalCount = await PerfumeModel.countDocuments({});
        const pagination = { totalCount, currentPage, perPage, totalPage: Math.ceil(totalCount / perPage) };
        SUCCESS(res, 200, "Perfumes fetched successfully", { data: { perfumes, pagination } });
    } catch (error) {
        next(error);
    }
};
const getPerfumeById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const perfume: any = await PerfumeModel.findById(req.params.perfumeId);
        if (!perfume) {
            throw new BadRequestError("Perfume does not exist");
        }
        SUCCESS(res, 200, "Perfume fetched successfully", { data: perfume });
    } catch (error) {
        next(error);
    }
};
const getNotes = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const data = getCache("notes");
        if (data) {
            return SUCCESS(res, 200, "Notes fetched successfully", { data: data });
        }
        const notes = await NotesModel.find({}).sort({ name: 1 });
        setCache("notes", notes);
        SUCCESS(res, 200, "Notes fetched successfully", { data: notes });
    } catch (error) {
        next(error);
    }
};
const getPerfumers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const data = getCache("perfumers");
        if (data) {
            return SUCCESS(res, 200, "Perfumers fetched successfully", { data: data });
        }
        const perfumers = await PerfumersModel.find({}).sort({ name: 1 });
        setCache("perfumers", perfumers);
        SUCCESS(res, 200, "Perfumers fetched successfully", { data: perfumers });
    } catch (error) {
        next(error);
    }
};

const createPerfume = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (req?.file) {
            req.body.image = `/uploads/${(req.file as Express.Multer.File).filename}`;
        }

        let {
            intendedFor,
            mainAccords,
            perfumers,
            notes,
            occasions,
            seasons,
            ...data
        } = req.body;

        // Parse JSON strings if they come from multipart form data
        data.intendedFor = parseJsonIfString(intendedFor);
        mainAccords = parseJsonIfString(mainAccords);
        perfumers = parseJsonIfString(perfumers);
        notes = parseJsonIfString(notes);
        occasions = parseJsonIfString(occasions);
        seasons = parseJsonIfString(seasons);

        // Validation
        if (!data.name || !data.brand) {
            return res.status(400).json({
                success: false,
                message: "Name and brand are required fields"
            });
        }

        // Get all perfumers and notes data
        const allPerfumers: any = getCache("perfumers") ? getCache("perfumers") : await PerfumersModel.find({}).sort({ name: 1 });
        const allNotes: any = getCache("notes") ? getCache("notes") : await NotesModel.find({}).sort({ name: 1 });

        data.mainAccords = filterMainAccords(mainAccords);
        data.perfumers = processPerfumers(perfumers, allPerfumers);
        data.notes = processNotes(notes, allNotes);
        data.occasions = processPercentageArray(occasions);
        data.seasons = processPercentageArray(seasons);
        data.longevity = {
            eternal: { vote: 0, percentage: 0 },
            "long lasting": { vote: 0, percentage: 0 },
            moderate: { vote: 0, percentage: 0 },
            "very weak": { vote: 0, percentage: 0 },
            weak: { vote: 0, percentage: 0 },
        };
        data.sillage = {
            intimate: { vote: 0, percentage: 0 },
            moderate: { vote: 0, percentage: 0 },
            strong: { vote: 0, percentage: 0 },
            enormous: { vote: 0, percentage: 0 },
        };
        data.rating = {
            score: 0,
            votes: 0,
        };
        data.createdAt = new Date();
        data.updatedAt = new Date();


        console.log("data", data);

        // Create the perfume
        const newPerfume = await PerfumeModel.create(data);

        SUCCESS(res, 201, "Perfume created successfully", newPerfume);
    } catch (error) {
        console.error('Create perfume error:', error);
        next(error);
    }
};
const deletePerfume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const perfumeId = req.params.perfumeId;
        const perfume = await PerfumeModel.findByIdAndDelete(perfumeId);
        if (!perfume) {
            throw new BadRequestError("Perfume not found");
        }
        SUCCESS(res, 200, "Perfume deleted successfully");
    } catch (error) {
        console.error('Delete perfume error:', error);
        next(error);
    }
};
const updatePerfume = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const perfumeId = req.params.perfumeId;
        if (req?.file) {
            req.body.image = `/uploads/${(req.file as Express.Multer.File).filename}`;
        }

        let {
            intendedFor,
            mainAccords,
            perfumers,
            notes,
            occasions,
            seasons,
            ...data
        } = req.body;

        data.intendedFor = parseJsonIfString(intendedFor);
        mainAccords = parseJsonIfString(mainAccords);
        perfumers = parseJsonIfString(perfumers);
        notes = parseJsonIfString(notes);
        occasions = parseJsonIfString(occasions);
        seasons = parseJsonIfString(seasons);

        const allPerfumers: any = getCache("perfumers") ? getCache("perfumers") : await PerfumersModel.find({}).sort({ name: 1 });
        const allNotes: any = getCache("notes") ? getCache("notes") : await NotesModel.find({}).sort({ name: 1 });
        data.mainAccords = filterMainAccords(mainAccords);
        data.perfumers = processPerfumers(perfumers, allPerfumers);
        data.notes = processNotes(notes, allNotes);
        data.occasions = processPercentageArray(occasions);
        data.seasons = processPercentageArray(seasons);

        const perfume = await PerfumeModel.findByIdAndUpdate(perfumeId, data, { new: true });
        if (!perfume) {
            throw new BadRequestError("Perfume not found");
        }
        SUCCESS(res, 200, "Perfume updated successfully",);
    } catch (error) {
        console.error('Update perfume error:', error);
        next(error);
    }
};

export default {
    loginAdmin, getProfile, getUsers, getUserById, createQuestion, getQuestions, deleteQuestion, updateQuestion, dashboard, getArticles, createArticle, updateArticle, deleteArticle, updateUser, suspendAccount, getPerfumes,
    getPerfumeById, getNotes, getPerfumers, createPerfume, deletePerfume, updatePerfume
};