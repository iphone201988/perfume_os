import { NextFunction, Request, Response } from "express";
import PerfumeModel from "../model/Perfume";
import { SUCCESS } from "../utils/response";
import { BadRequestError } from "../utils/errors";
import ReviewModel from "../model/Reviews";
import NotesModel from "../model/Notes";
import { escapeRegex } from "../utils/utills";
import SearchModel from "../model/Search";
import WishlistModel from "../model/Wishlist";
import CollectionModel from "../model/Collection";
import PerfumersModel from "../model/Perfumers";
import FavoritesModel from "../model/Favorites";
import { getUserProfile } from "./user";
import { emitGetProfile } from "../services/socketManager";
import ArticlesModel from "../model/Articles";
import mongoose from "mongoose";



// get perfume
const perfume = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { name, brand, perfumeId, isSearch = "false" } = req.query;

        let query: Record<string, any> = {};

        // Build the query with escaped regex if necessary
        if (typeof name === 'string') query['name'] = new RegExp('^' + escapeRegex(name), 'i');
        if (typeof brand === 'string') query['brand'] = new RegExp('^' + escapeRegex(brand), 'i');
        if (typeof perfumeId === 'string') query['_id'] = perfumeId;

        // Fetch the perfume and reviews in a single query (including notes data)
        const perfume: any = await PerfumeModel.findOne(query).lean();

        if (!perfume) {
            return res.status(200).json({ success: false, message: "Perfume not found in database" });
        }
        const favorites = await FavoritesModel.find({ userId: req.userId }).lean();
        const favoriteNoteIds = favorites.map((fav: any) => fav?.noteId?.toString());
        const favoritePerfumerIds = favorites.map((fav: any) => fav?.perfumerId?.toString());
        const favoritePerfumeIds = favorites.map((fav: any) => fav?.perfumeId?.toString());
        perfume.isFavorite = favoritePerfumeIds.includes(perfume._id.toString())
        // Populate note information by fetching all notes at once
        const noteGroups = ['base', 'top', 'middle', 'notes'];
        for (const group of noteGroups) {
            if (perfume?.notes?.[group]?.length) {
                const noteIds = perfume.notes[group].map((item: any) => item?.noteId).filter(Boolean);
                if (noteIds.length) {
                    const notes = await NotesModel.find({ '_id': { $in: noteIds } }).lean();
                    perfume.notes[group] = perfume.notes[group].map((item: any) => ({
                        ...item,
                        noteId: notes.find((note: any) => note._id.toString() === item?.noteId?.toString()) || item.noteId,
                        isFavorite: favoriteNoteIds.includes(item?.noteId?.toString())
                    }));
                }
            }
        }
        //perfumers
        perfume.perfumers = perfume?.perfumers?.filter(p => p.perfumerId !== null);
        for (let perfumer of perfume.perfumers) {
            perfumer.isFavorite = favoritePerfumerIds.includes(perfumer?.perfumeId?.toString())
            perfumer.perfumerId = await PerfumersModel.findById(perfumer.perfumerId).lean();
        }
        perfume.reviews = await ReviewModel.find({ perfumeId: perfume._id }).sort({ datePublished: -1 }).limit(10).lean();
        const totalReviewsAndRatings = await ReviewModel.aggregate([
            {
                $match: { perfumeId: perfume._id }
            },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    averageRating: { $avg: "$rating" }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalReviews: { $ifNull: ["$totalReviews", 0] },
                    averageRating: { $ifNull: ["$averageRating", 0] }
                }
            }

        ]);
        perfume.totalReviewsAndRatings = totalReviewsAndRatings[0] || { totalReviews: 0, averageRating: 0 };
        perfume.isWishlist = (await WishlistModel.findOne({ userId: req.user._id, perfumeId: perfume._id })) ? true : false;
        perfume.isCollection = (await CollectionModel.findOne({ userId: req.user._id, perfumeId: perfume._id })) ? true : false;
        // same brand perfumes
        perfume.sameBrand = await PerfumeModel.find({ brand: perfume.brand })
            .select('name brand image')
            .limit(10)
            .lean();
        // similar perfume
        const similarPerfumes = await PerfumeModel.find({
            "mainAccords.name": { $in: perfume.mainAccords.map((accord: any) => accord.name) },
            _id: { $ne: perfume._id } // exclude the current perfume
        }).select('name brand image')
            .limit(10)
            .lean();

        // Add the similar perfumes to the response
        perfume.similar = similarPerfumes;
        if (isSearch == "true") {
            const isSearch = await SearchModel.findOne({ userId: req.user._id, perfumeId: perfume._id });
            if (!isSearch) {
                await SearchModel.create({ userId: req.user._id, perfumeId: perfume._id, createdAt: new Date() });
            } else {
                await SearchModel.updateOne({ userId: req.user._id, perfumeId: perfume._id }, { $set: { createdAt: new Date() } });
            }
        }
        SUCCESS(res, 200, "Perfume fetched successfully", { data: perfume });
    } catch (error) {
        next(error);
    }
};

//search perfume
const searchPerfume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        let { search = "Ab", page = "1", limit = "10" } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        const query = { name: { $regex: "^" + search, $options: 'i' } };
        const perfumes = await PerfumeModel.find(query).select('name brand image').sort({ name: 1 }).skip(skip)
            .limit(perPage).lean();
        const totalCount = await PerfumeModel.countDocuments(query);
        SUCCESS(res, 200, "Perfume fetched successfully", { data: { perfumes, pagination: { totalCount, currentPage, perPage } } });
    } catch (error) {
        next(error);
    }
}
// recent and top search perfume
const recentAndTopSearches = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // 1. Recent Searches by User
        const recentSearches = await SearchModel.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("perfumeId", "name brand image")
            .lean();

        const recentPerfumes = recentSearches
            .map(item => item.perfumeId)
            .filter(Boolean);

        const topSearches = await SearchModel.aggregate([
            {
                $group: {
                    _id: "$perfumeId",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "Perfume", // Collection name (case sensitive)
                    localField: "_id",
                    foreignField: "_id",
                    as: "perfume"
                }
            },
            { $unwind: "$perfume" },
            {
                $project: {
                    _id: "$perfume._id",
                    name: "$perfume.name",
                    brand: "$perfume.brand",
                    image: "$perfume.image",
                    count: 1
                }
            }
        ]);

        SUCCESS(res, 200, "Searches fetched successfully", {
            data: {
                recentPerfumes,
                topPerfumes: topSearches
            }
        });

    } catch (error) {
        next(error);
    }
};

//write review
const writeReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user;
        const { perfumeId, longevity, sillage } = req.body;

        const perfume = await PerfumeModel.findById(perfumeId);
        if (!perfume) {
            throw new BadRequestError("Perfume not found");
        }

        // 1. Create review
        const review = await ReviewModel.create({
            ...req.body,
            userId: user._id,
            datePublished: new Date(),
            authorImage: user.profileImage,
            authorName: user.fullname,
        });

        // 2. Increment rating.votes
        const newVotes = (perfume.rating?.votes || 0) + 1;

        // 3. Longevity update
        const longevityField = longevity?.toLowerCase();
        const sillageField = sillage?.toLowerCase();

        const updatedLongevity = { ...perfume.longevity };
        const updatedSillage = { ...perfume.sillage };

        if (longevityField) {
            const currentVote = perfume.longevity?.[longevityField]?.vote || 0;
            updatedLongevity[longevityField] = {
                vote: currentVote + 1,
                percentage: 0, // will calculate below
            };
        }
        console.log(updatedLongevity);

        if (sillageField) {
            const currentVote = perfume.sillage?.[sillageField]?.vote || 0;
            updatedSillage[sillageField] = {
                vote: currentVote + 1,
                percentage: 0,
            };
        }

        // 4. Recalculate percentages
        const longevityTotalVotes = Object.values(updatedLongevity).reduce((sum: number, l: any) => sum + (l.vote || 0), 0);
        const sillageTotalVotes = Object.values(updatedSillage).reduce((sum: number, s: any) => sum + (s.vote || 0), 0);

        for (const key in updatedLongevity) {
            const vote = updatedLongevity[key].vote || 0;
            updatedLongevity[key].percentage = longevityTotalVotes > 0 ? Number(((vote / longevityTotalVotes) * 100).toFixed(1)) : 0;
        }

        for (const key in updatedSillage) {
            const vote = updatedSillage[key].vote || 0;
            updatedSillage[key].percentage = sillageTotalVotes > 0 ? Number(((vote / sillageTotalVotes) * 100).toFixed(1)) : 0;
        }

        // 5. Update Perfume document
        await PerfumeModel.findByIdAndUpdate(perfumeId, {
            $set: {
                'longevity': updatedLongevity,
                'sillage': updatedSillage,
                'rating.votes': newVotes
            }
        });

        // 6. Emit user profile update
        const data = await getUserProfile(user._id.toString(), user);
        emitGetProfile(user._id.toString(), data);

        SUCCESS(res, 200, "Review added successfully", { data: review });

    } catch (error) {
        next(error);
    }
};
//get reviews
const getPerfumeReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        let { page = "1", limit = "10", perfumeId } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        const perfume = await PerfumeModel.findById(perfumeId);
        if (!perfume) {
            throw new BadRequestError("Perfume not found");
        }
        const reviews = await ReviewModel.find({ perfumeId }).sort({ datePublished: -1 }).skip(skip).limit(perPage).lean();
        const totalCount = await ReviewModel.countDocuments({ perfumeId })
        SUCCESS(res, 200, "Reviews fetched successfully", { data: { reviews, pagination: { totalCount, currentPage, perPage } } });
    } catch (error) {
        next(error);
    }
};

//get note 
const getNotes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.query;
        const note: any = await NotesModel.findById(id).lean();
        if (!note) {
            throw new BadRequestError("Note not found");
        }
        //pufume that have these note
        const perfumes = await PerfumeModel.find({
            $or: [
                { "notes.top.noteId": id },
                { "notes.middle.noteId": id },
                { "notes.base.noteId": id },
                { "notes.notes.noteId": id }
            ]
        }).limit(10)
            .select('name brand image')
            .lean();

        note.isFavorite = (await FavoritesModel.findOne({ userId: req.userId, noteId: note._id })) ? true : false;


        SUCCESS(res, 200, "Notes fetched successfully", { data: { note, perfumes } });
    } catch (error) {
        next(error);
    }
};
//get perfumer
const getPerfumer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.query;
        const perfumer: any = await PerfumersModel.findById(id).lean();
        if (!perfumer) {
            throw new BadRequestError("Perfumer not found");
        }
        // similler perfume contains this perfumer
        const perfumes = await PerfumeModel.find({ "perfumers.perfumerId": id })
            .select('name brand image')  // Selecting relevant fields
            .limit(10)
            .lean();
        perfumer.isFavorite = (await FavoritesModel.findOne({ userId: req.userId, perfumerId: perfumer._id })) ? true : false;
        const totalCount = await PerfumeModel.countDocuments({ "perfumers.perfumerId": id });
        SUCCESS(res, 200, "Perfumer fetched successfully", { data: { perfumer, perfumes, totalCount } });
    } catch (error) {
        next(error);
    }
};
//similler perfume  
const simillerPerfume = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id, type, page = "1", limit = "10" } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        if (type === "perfumer") {
            const perfumer = await PerfumersModel.findById(id).lean();
            if (!perfumer) {
                throw new BadRequestError("Perfumer not found");
            }
            // similler perfume contains this perfumer
            const perfumes = await PerfumeModel.find({ "perfumers.perfumerId": perfumer._id })
                .select('name brand image')
                .skip(skip)
                .limit(10)
                .lean();
            const totalCount = await PerfumeModel.countDocuments({ "perfumers.perfumerId": perfumer._id });
            const pagination = {
                totalCount,
                currentPage,
                perPage
            };
            SUCCESS(res, 200, "Similler Perfumes fetched successfully", { data: perfumes, pagination });
        } else if (type === "note") {
            const note = await NotesModel.findById(id).lean();
            if (!note) {
                throw new BadRequestError("Note not found");
            }
            //pufume that have these note
            const perfumes = await PerfumeModel.find({
                $or: [
                    { "notes.top.noteId": note._id },
                    { "notes.middle.noteId": note._id },
                    { "notes.base.noteId": note._id },
                    { "notes.notes.noteId": note._id }
                ]
            }).skip(skip)
                .limit(10)
                .select('name brand image')
                .lean();
            const totalCount = await PerfumeModel.countDocuments({
                $or: [
                    { "notes.top.noteId": note._id },
                    { "notes.middle.noteId": note._id },
                    { "notes.base.noteId": note._id },
                    { "notes.notes.noteId": note._id }
                ]
            });
            const pagination = {
                totalCount,
                currentPage,
                perPage
            };
            SUCCESS(res, 200, "Similler Perfumes fetched successfully", { data: perfumes, pagination });
        } else {
            throw new BadRequestError("Type not found");
        }
    } catch (error) {
        next(error);
    }
};
const addFavorite = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { id, type } = req.body;

        if (!user || !user._id) {
            throw new BadRequestError("User not authenticated");
        }

        // Map type to model & field name in FavoritesModel
        const typeMap: Record<string, { model: any; favField: string; singularName: string }> = {
            perfume: { model: PerfumeModel, favField: "perfumeId", singularName: "Perfume" },
            note: { model: NotesModel, favField: "noteId", singularName: "Note" },
            perfumer: { model: PerfumersModel, favField: "perfumerId", singularName: "Perfumer" },
            article: { model: ArticlesModel, favField: "articleId", singularName: "Acticle" },
        };

        const typeInfo = typeMap[type];
        if (!typeInfo) {
            throw new BadRequestError("Invalid favorite type");
        }

        const item = await typeInfo.model.findById(id);
        if (!item) {
            throw new BadRequestError(`${typeInfo.singularName} does not exist`);
        }

        const favQuery = { [typeInfo.favField]: id, userId: user._id };
        const existingFavorite = await FavoritesModel.findOne(favQuery);

        if (existingFavorite) {
            await FavoritesModel.findByIdAndDelete(existingFavorite._id);
            const data = await getUserProfile(user._id.toString(), user)
            emitGetProfile(user._id.toString(), data)
            return SUCCESS(
                res,
                200,
                `${typeInfo.singularName} removed from favorite successfully`,
                {}
            );
        }

        await FavoritesModel.create({ [typeInfo.favField]: id, userId: user._id, type });
        const data = await getUserProfile(user._id.toString(), user)
        emitGetProfile(user._id.toString(), data)
        return SUCCESS(
            res,
            200,
            `${typeInfo.singularName} added to favorite successfully`,
            {}
        );
    } catch (error) {
        console.error("error in addFavorite", error);
        next(error);
    }
};
const getFavorites = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.userId;
        const { type, page = "1", limit = "10" } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        const result = await FavoritesModel.aggregate([
            {
                $match: {
                    userId: userId,
                    type: type
                }
            }, {
                $facet: {
                    favorites: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: perPage },
                        {
                            $lookup: {
                                from: 'Perfume',
                                localField: 'perfumeId',
                                foreignField: '_id',
                                as: 'perfumeId',
                                pipeline: [
                                    {
                                        $project: {
                                            "name": 1, "brand": 1, "image": 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: 'Notes',
                                localField: 'noteId',
                                foreignField: '_id',
                                as: 'noteId',
                                pipeline: [
                                    {
                                        $project: {
                                            "name": 1, "bgUrl": 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: 'Articles',
                                localField: 'articleId',
                                foreignField: '_id',
                                as: 'articleId',
                                pipeline: [
                                    {
                                        $project: {
                                            "title": 1, "image": 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $lookup: {
                                from: 'Perfumers',
                                localField: 'perfumerId',
                                foreignField: '_id',
                                as: 'perfumerId',
                                pipeline: [
                                    {
                                        $project: {
                                            "name": 1, "image": 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $unwind: {
                                path: '$articleId',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $unwind: {
                                path: '$perfumeId',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $unwind: {
                                path: '$noteId',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $unwind: {
                                path: '$perfumerId',
                                preserveNullAndEmptyArrays: true
                            }
                        }
                    ],
                    totalCount: [
                        {
                            $count: 'count'
                        }
                    ]
                }
            }

        ]);

        const totalCount = result[0]?.totalCount[0]?.count || 0;
        const favorites = result[0]?.favorites || [];
        SUCCESS(res, 200, "Favorites fetched successfully", { data: { favorites, pagination: { totalCount, currentPage, perPage } } });
        SUCCESS(res, 200, "Favorites fetched successfully", { data: {} });
    } catch (error) {
        next(error);
    }
};

const getPerfumeRecommendations = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Step 1: Get user's interacted perfumes (favorites, wishlist, etc.)
        const [favorites, collection, wishlist, searches] = await Promise.all([
            FavoritesModel.find({ userId: user._id, type: "perfume" }, "perfumeId"),
            CollectionModel.find({ userId: user._id }, "perfumeId"),
            WishlistModel.find({ userId: user._id }, "perfumeId"),
            SearchModel.find({ userId: user._id }, "perfumeId"),
        ]);

        const userPerfumeIds = new Set([
            ...favorites,
            ...collection,
            ...wishlist,
            ...searches,
        ].map((doc) => doc.perfumeId.toString()));

        // Step 2: Extract user preferences from favorite/search perfumes
        const interactedPerfumes = await PerfumeModel.find({ _id: { $in: Array.from(userPerfumeIds) } });

        const intendedFor = [...new Set(interactedPerfumes.flatMap(p => p.intendedFor || []))];
        const mainAccords = [...new Set(interactedPerfumes.flatMap(p => (p.mainAccords || []).map(a => a.name)))];
        const noteNames = [...new Set(interactedPerfumes.flatMap(p =>
            [
                ...(p.notes?.top || []),
                ...(p.notes?.middle || []),
                ...(p.notes?.base || []),
            ].map(n => n.name)
        ))];

        // Step 3: Aggregate matching perfumes with scoring and pagination
        const baseMatch: any = {
            _id: { $nin: Array.from(userPerfumeIds).map(id => new mongoose.Types.ObjectId(id)) }
        };

        // Add the most selective filter first
        if (intendedFor.length > 0) {
            baseMatch.intendedFor = { $in: intendedFor };
        }

        const results = await PerfumeModel.aggregate([
            { $match: baseMatch },
            {
                $addFields: {
                    matchScore: {
                        $add: [
                            { $size: { $setIntersection: ["$intendedFor", intendedFor] } },
                            { $size: { $setIntersection: ["$mainAccords.name", mainAccords] } },
                            { $size: { $setIntersection: ["$notes.top.name", noteNames] } },
                            { $size: { $setIntersection: ["$notes.middle.name", noteNames] } },
                            { $size: { $setIntersection: ["$notes.base.name", noteNames] } },
                        ]
                    }
                }
            },
            { $match: { matchScore: { $gt: 25 } } },
            { $sort: { matchScore: -1, } },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    brand: 1,
                    image: 1,
                    matchScore: 1
                }
            },
            {
                $facet: {
                    data: [{ $skip: skip }, { $limit: limit }],
                    total: [{ $count: "count" }]
                }
            }
        ]).allowDiskUse(true).exec();
        const perfumes = results[0].data;
        const total = results[0].total[0]?.count || 0;

        const pagination = {
            totalCount: total,
            currentPage: page,
            perPage: limit,
        };

        return SUCCESS(res, 200, "Recommended perfumes fetched successfully", {
            data: perfumes,
            pagination
        });

    } catch (error) {
        console.error("Error in perfume recommendations:", error);
        next(error);
    }
};

// const noteimage = async () => {
//     try {
//         const notes = await NotesModel.find({}).lean();
//         console.log(notes.length, "notes found");
//         for (const note of notes) {
//             let imageUrl = note.bgUrl;
//             // Fallback to thumbnails if available
//             const image = note?.thumbnails?.[0]?.src ?? imageUrl;

//             // Update document
//             await NotesModel.updateOne(
//                 { _id: note._id },
//                 { $set: { image } }
//             );
//         }

//         console.log("Note images updated successfully.");
//     } catch (err) {
//         console.error("Error updating note images:", err);
//     }
// };
// noteimage();


// async function lalala() {
//     const notesList = await NotesModel.find({}).lean();
//     const noteMap = new Map(notesList.map(note => [note.name.toLowerCase().trim(), note._id]));

//  const perfumes = await PerfumeModel.find({
//         $or: [
//             { 'notes.base.noteId': { $exists: false } },
//             { 'notes.top.noteId': { $exists: false } },
//             { 'notes.middle.noteId': { $exists: false } },
//             { 'notes.notes.noteId': { $exists: false } }
//         ]
//     }).lean();    let count = 0;

//     for (const perfume of perfumes) {
//         count++;
//         console.log(perfume?.name, "COUNT", count);

//         const noteGroups = ['base', 'top', 'middle', 'notes'];
//         let updated = false;

//         for (const group of noteGroups) {
//             if (perfume?.notes?.[group]?.length > 0) {
//                 for (let i = 0; i < perfume.notes[group].length; i++) {
//                     const item = perfume.notes[group][i];
//                     const noteId = noteMap.get(item.name.toLowerCase().trim());

//                     if (noteId) {
//                         perfume.notes[group][i].noteId = noteId;
//                         updated = true;
//                     }else{
//                         // with regex 
//                         const note = await NotesModel.findOne({ name: { $regex: item.name, $options: 'i' } }).lean();
//                         if (note) {
//                             perfume.notes[group][i].noteId = note._id;
//                             updated = true;
//                         }

//                     }
//                 }
//             }
//         }

//         if (updated) {
//             // console.log("perfume.notes", perfume.notes);
//             await PerfumeModel.updateOne(
//                 { _id: perfume._id },
//                 { $set: { notes: perfume.notes } }
//             );
//         }
//     }
// }

// lalala();

// async function trimSpace() {
//     const perfumes = await PerfumeModel.find({
//         intendedFor: { $exists: true, $ne: [] }
//     }).lean();

//     const bulkOps = [];

//     for (const perfume of perfumes) {
//         const original = perfume.intendedFor;
//         const trimmed = original.map((item: any) => item.trim());

//         // Only push update if there's a difference
//         if (JSON.stringify(original) !== JSON.stringify(trimmed)) {
//             bulkOps.push({
//                 updateOne: {
//                     filter: { _id: perfume._id },
//                     update: { $set: { intendedFor: trimmed } }
//                 }
//             });
//         }
//     }

//     if (bulkOps.length > 0) {
//         const result = await PerfumeModel.bulkWrite(bulkOps);
//         console.log(`Updated ${result.modifiedCount} perfumes.`);
//     } else {
//         console.log("No updates needed.");
//     }
// }
// trimSpace();

// async function attachPerfumerIdWithPerfume() {
//     try {
//         console.log("start");
//         const perfumersList = await PerfumersModel.find({}).lean();
//         console.log("perfumersList", perfumersList.length);
//         const noteMap = new Map(perfumersList.map(perfumer => [perfumer.name.toLowerCase().trim(), perfumer._id]));

//       const perfumes = await PerfumeModel.find({
//             "perfumers.perfumerId": { $exists: false }
//         }).lean();
//         console.log("perfumes", perfumes.length);
//         let count = 0;
//         const bulkUpdates = [];

//         for (const perfume of perfumes) {
//             count++;
//             console.log(`Processing perfume: ${perfume?.name} | Count: ${count}`);

//             let updated = false;

//             for (let perfumer of perfume.perfumers) {
//                 const perfumerId = noteMap.get(perfumer.name.toLowerCase().trim());

//                 if (perfumerId) {
//                     perfumer.perfumerId = perfumerId;
//                     updated = true;
//                 } else {
//                     // Using regex to find matching perfumer
//                     const data = await PerfumersModel.findOne({ name: { $regex: perfumer.name, $options: 'i' } }).lean();
//                     if (data) {
//                         perfumer.perfumerId = data._id;
//                         updated = true;
//                     }
//                 }
//             }

//             if (updated) {
//                 console.log("perfume.perfumers", perfume.perfumers);
//                 bulkUpdates.push({
//                     updateOne: {
//                         filter: { _id: perfume._id },
//                         update: { $set: { perfumers: perfume.perfumers } }
//                     }
//                 });

//                 // Optionally log if you are updating a perfume
//                 console.log(`Updated perfume: ${perfume.name}`);
//             }
//         }

//         if (bulkUpdates.length > 0) {
//             await PerfumeModel.bulkWrite(bulkUpdates);
//             console.log(`Bulk update completed for ${bulkUpdates.length} perfumes.`);
//         }
//     } catch (error) {
//         console.error("Error in attaching perfumer IDs with perfumes:", error);
//     }
// }

// attachPerfumerIdWithPerfume();

//  async function changeInPerfume() {
//     const perfumes = await PerfumeModel.find({}).lean();
//     let count = 0;
//     const bulkUpdates = [];

//     perfumes.forEach(perfume => {
//         count++;
//         console.log(`Processing perfume: ${perfume?.name} | Count: ${count}`);

//         const update = {
//             $set: { seasons: perfume.sessions },
//             $unset: { sessions: "" }
//         };

//         bulkUpdates.push({
//             updateOne: {
//                 filter: { _id: perfume._id },
//                 update
//             }
//         });

//         console.log(`Queued update for perfume: ${perfume.name}`);
//     });

//     if (bulkUpdates.length > 0) {
//         await PerfumeModel.bulkWrite(bulkUpdates);
//         console.log(`Bulk update completed for ${bulkUpdates.length} perfumes.`);
//     }
// }


// changeInPerfume();

function generateRandom2to5() {
    return Math.floor(Math.random() * 4) + 2;
}



async function changeInReview() {
    const Reviews = await ReviewModel.find({ $or: [{ rating: 1 }, { rating: 2 }] }).lean();
    let count = 0;
    const bulkUpdates = [];

    Reviews.forEach(review => {
        let number = generateRandom2to5();

        count++;
        console.log(`Processing Review: ${review?._id} | Count: ${count}`);

        const update = {
            $set: { rating: number },
        };

        bulkUpdates.push({
            updateOne: {
                filter: { _id: review._id },
                update
            }
        });

        console.log(`Queued update for Review: ${review?._id}`);
    });

    if (bulkUpdates.length > 0) {
        await ReviewModel.bulkWrite(bulkUpdates);
        console.log(`Bulk update completed for ${bulkUpdates.length} Reviews.`);
    }
}


// changeInReview();

// add noteid which not have 
async function addNotesToPerfume(name: string, noteId: string) {
    if (!name || !noteId) return;
    const perfumes = await PerfumeModel.find({
        $or: [
            { "notes.top": { $elemMatch: { name: name, noteId: { $exists: false } } } },
            { "notes.middle": { $elemMatch: { name: name, noteId: { $exists: false } } } },
            { "notes.base": { $elemMatch: { name: name, noteId: { $exists: false } } } },
            { "notes.notes": { $elemMatch: { name: name, noteId: { $exists: false } } } }
        ]
    }).lean();
    const noteSections = ['top', 'middle', 'base', 'notes'];
    let count = 0;

    for (const perfume of perfumes) {
        count++;
        console.log(perfume?.name, "COUNT", count);

        for (const section of noteSections) {
            if (perfume.notes[section]) {
                for (const note of perfume.notes[section]) {
                    if (note.name.toString().trim() === name.toString().trim() && !note.noteId) {
                        note.noteId = new mongoose.Types.ObjectId(noteId);
                    }
                }
            }
        }

        await PerfumeModel.updateOne({ _id: perfume._id }, { $set: { notes: perfume.notes } });
        console.log("perfume", perfume?.name);
    }
}
// addNotesToPerfume("Green Leaves","6839edacc412f47360596aa2")

export default { perfume, recentAndTopSearches, searchPerfume, writeReview, getPerfumeReviews, getNotes, getPerfumer, simillerPerfume, addFavorite, getFavorites, getPerfumeRecommendations };