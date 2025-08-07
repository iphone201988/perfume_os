import { NextFunction, Request, Response } from "express";
import { comparePassword, findPerfumeById, findUserByEmail, findUserById, findUserByReferral, findUserBySocialId, findUserByUsername, generateOtp, getRankName, hashPassword, otpExpiry, publicViewData, signToken, } from "../utils/utills";
import UserModel from "../model/User";
import PerfumeModel from "../model/Perfume";
import { SUCCESS } from "../utils/response";
import { BadRequestError } from "../utils/errors";
import { sendEmail } from "../services/sendEmail";
import FollowModel from "../model/Follow";
import CollectionModel from "../model/Collection";
import WishlistModel from "../model/Wishlist";
import ReviewModel from "../model/Reviews";
import { IUser } from "../types/database/type";
import BadgesModel from "../model/Badges";
import UserBadgesModel from "../model/UserBadges";
import { emitGetProfile, emitJoinRoom, emitNotificationCount } from "../services/socketManager";
import QuestionModel from "../model/QuestionModel";
import QuizModel from "../model/QuizModel";
import mongoose from "mongoose";
import FavoritesModel from "../model/Favorites";
import PerfumersModel from "../model/Perfumers";
import NotesModel from "../model/Notes";
import NotificationsModel from "../model/Notification";
import ArticlesModel from "../model/Articles";
//social login
const socialLogin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { socialId, provider, fullname, email, deviceToken, deviceType } = req.body;
        let user = await findUserBySocialId(socialId, provider);
        let newLogin = user ? false : true;

        if (!user) {
            user = await findUserByEmail(email);

            if (user) {
                user.socialLinkedAccounts.push({ provider, id: socialId });
            } else {
                const generatedReferralCode = generateOtp(10, true, true);
                newLogin = true;
                user = new UserModel({
                    fullname: fullname || null,
                    email,
                    socialLinkedAccounts: [{ provider, id: socialId }],
                    deviceToken,
                    deviceType,
                    referralCode: generatedReferralCode,
                });
            }

        }
        user.jti = generateOtp(30, true, true);
        user.deviceToken = deviceToken ?? null;
        user.deviceType = deviceType ?? null;

        await user.save();
        if (!user?.username) newLogin = true;

        const token = signToken({ id: user._id, jti: user.jti });
        const data = publicViewData(user);
        SUCCESS(res, 200, "User logged in successfully", { data: { ...data, token, newLogin } });
    } catch (error) {
        console.log("error in socialLogin", error);
        next(error);
    }
}

const register = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        let checkUsername = await findUserByUsername(req?.body?.username);
        if (checkUsername) {
            throw new BadRequestError("User with this username already exists");
        }
        req.body.email = req.body?.email?.toLowerCase();
        const checkEmail = await findUserByEmail(req?.body?.email);
        if (checkEmail) {
            throw new BadRequestError("User with this email already exists");
        }
        req.body.password = await hashPassword(req.body?.password);
        req.body.referralCode = generateOtp(10, true, true);
        const user = await UserModel.create(req.body);
        user.jti = generateOtp(30, true, true);
        user.deviceToken = req.body.deviceToken ?? null;
        user.deviceType = req.body.deviceType ?? null;
        await user.save();
        const data = publicViewData(user)
        const token = signToken({ id: user._id, jti: user.jti });
        SUCCESS(res, 201, "User created successfully", { data: { ...data, token } });
    } catch (error) {
        console.log("error in register", error);
        next(error);
    }
}
//login
const login = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = await findUserByUsername(req.body.username);
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
        console.log("error in login", error);
        next(error);
    }
}

//get profile
const profile = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { userId, type = "1" } = req.query;
        let viewedUser: IUser | null = null;
        let currentUser: IUser | null = null;

        if (type === "1") {
            currentUser = req.user;
            viewedUser = req.user;
        } else {
            viewedUser = await findUserById(userId as string);
            if (!viewedUser) throw new BadRequestError("User does not exist");
            currentUser = req.user;
        }
        const data: any = publicViewData(viewedUser);

        const [totalCollection, collections, totalWishlist, wishlists, totalBadges, badges, isFollowing, followers, following, reviewDataAgg, favorites, totalFavorites] = await Promise.all([
            CollectionModel.countDocuments({ userId: viewedUser._id }),
            CollectionModel.find({ userId: viewedUser._id }).sort({ createdAt: -1 }).limit(12).populate("perfumeId", "name brand image").lean(),
            WishlistModel.countDocuments({ userId: viewedUser._id }),
            WishlistModel.find({ userId: viewedUser._id }).sort({ createdAt: -1 }).limit(12).populate("perfumeId", "name brand image").lean(),
            UserBadgesModel.countDocuments({ userId: viewedUser._id }),
            UserBadgesModel.find({ userId: viewedUser._id }).sort({ createdAt: -1 }).limit(12).populate("badgeId").lean(),
            FollowModel.exists({ userId: currentUser._id, followId: viewedUser._id }),
            FollowModel.countDocuments({ followId: viewedUser._id }),
            FollowModel.countDocuments({ userId: viewedUser._id }),
            ReviewModel.aggregate([
                {
                    $match: { userId: viewedUser._id }
                },
                {
                    $lookup: {
                        from: "Perfume",
                        localField: "perfumeId",
                        foreignField: "_id",
                        as: "perfumeId",
                        pipeline: [{ $project: { name: 1, brand: 1, image: 1 } }]
                    }
                },
                { $unwind: { path: "$perfumeId", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "User",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userId",
                        pipeline: [{ $project: { fullname: 1, profileImage: 1 } }]
                    }
                },
                { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
                {
                    $facet: {
                        reviewsList: [
                            { $sort: { createdAt: -1 } },
                            { $limit: 5 },
                            {
                                $project: {
                                    rating: 1,
                                    review: 1,
                                    userId: 1,
                                    perfumeId: 1,
                                    createdAt: 1
                                }
                            }
                        ],
                        stats: [
                            {
                                $group: {
                                    _id: null,
                                    totalReviews: { $sum: 1 },
                                    averageRating: { $avg: "$rating" }
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        reviews: "$reviewsList", // flatten to a top-level "reviews" array
                        totalReviews: {
                            $ifNull: [{ $arrayElemAt: ["$stats.totalReviews", 0] }, 0]
                        },
                        averageRating: {
                            $ifNull: [{ $arrayElemAt: ["$stats.averageRating", 0] }, 0]
                        }
                    }
                }
            ]),
            FavoritesModel.find({ userId: viewedUser._id }).populate("perfumeId", "name brand image").populate("perfumerId", "name smallImage").populate("noteId", "name bgUrl").populate("articleId", "title image").limit(12).lean(),
            FavoritesModel.countDocuments({ userId: viewedUser._id })
        ]);
        const { reviews = [], totalReviews = 0, averageRating = 0 } = reviewDataAgg[0] || {}
        Object.assign(data, {
            collections,
            totalCollection,
            totalWishlist,
            wishlists,
            totalBadges,
            badges,
            isFollowing: !!isFollowing,
            followers,
            following,
            reviews,
            totalReviews,
            averageRating,
            favorites,
            totalFavorites
        });

        SUCCESS(res, 200, "Profile fetched successfully", { data });
    } catch (error) {
        next(error);
    }
};
export const getUserProfile = async (userId: string, currentUser: IUser | null): Promise<any> => {
    try {
        let viewedUser: IUser | null = null;

        // Determine the viewed user
        viewedUser = await findUserById(userId);
        if (!viewedUser) throw new BadRequestError("User does not exist");

        // Collect user data
        const data: any = publicViewData(viewedUser);

        // Fetch required data concurrently using Promise.all
        const [
            totalCollection, collections, totalWishlist, wishlists, totalBadges, badges,
            isFollowing, followers, following, reviewDataAgg, favorites, totalFavorites
        ] = await Promise.all([
            CollectionModel.countDocuments({ userId: viewedUser._id }),
            CollectionModel.find({ userId: viewedUser._id }).sort({ createdAt: -1 }).limit(12).populate("perfumeId", "name brand image").lean(),
            WishlistModel.countDocuments({ userId: viewedUser._id }),
            WishlistModel.find({ userId: viewedUser._id }).sort({ createdAt: -1 }).limit(12).populate("perfumeId", "name brand image").lean(),
            UserBadgesModel.countDocuments({ userId: viewedUser._id }),
            UserBadgesModel.find({ userId: viewedUser._id }).sort({ createdAt: -1 }).limit(12).populate("badgeId").lean(),
            FollowModel.exists({ userId: currentUser?._id, followId: viewedUser._id }),
            FollowModel.countDocuments({ followId: viewedUser._id }),
            FollowModel.countDocuments({ userId: viewedUser._id }),
            ReviewModel.aggregate([
                {
                    $match: { userId: viewedUser._id }
                },
                {
                    $lookup: {
                        from: "Perfume",
                        localField: "perfumeId",
                        foreignField: "_id",
                        as: "perfumeId",
                        pipeline: [{ $project: { name: 1, brand: 1, image: 1 } }]
                    }
                },
                { $unwind: { path: "$perfumeId", preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "User",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userId",
                        pipeline: [{ $project: { fullname: 1, profileImage: 1 } }]
                    }
                },
                { $unwind: { path: "$userId", preserveNullAndEmptyArrays: true } },
                {
                    $facet: {
                        reviewsList: [
                            { $sort: { createdAt: -1 } },
                            { $limit: 5 },
                            {
                                $project: {
                                    rating: 1,
                                    review: 1,
                                    userId: 1,
                                    perfumeId: 1,
                                    createdAt: 1
                                }
                            }
                        ],
                        stats: [
                            {
                                $group: {
                                    _id: null,
                                    totalReviews: { $sum: 1 },
                                    averageRating: { $avg: "$rating" }
                                }
                            }
                        ]
                    }
                },
                {
                    $project: {
                        reviews: "$reviewsList", // flatten to a top-level "reviews" array
                        totalReviews: {
                            $ifNull: [{ $arrayElemAt: ["$stats.totalReviews", 0] }, 0]
                        },
                        averageRating: {
                            $ifNull: [{ $arrayElemAt: ["$stats.averageRating", 0] }, 0]
                        }
                    }
                }
            ]),
            FavoritesModel.find({ userId: viewedUser._id }).populate("perfumeId", "name brand image").populate("perfumerId", "name smallImage").populate("noteId", "name bgUrl").populate("articleId", "title image").limit(12).lean(),
            FavoritesModel.countDocuments({ userId: viewedUser._id })
        ]);

        // Extract review data
        const { reviews = [], totalReviews = 0, averageRating = 0 } = reviewDataAgg[0] || {};

        // Add the collected data to the response
        Object.assign(data, {
            collections,
            totalCollection,
            totalWishlist,
            wishlists,
            totalBadges,
            badges,
            isFollowing: !!isFollowing,
            followers,
            following,
            reviews,
            totalReviews,
            averageRating,
            favorites,
            totalFavorites
        });

        return data;
    } catch (error) {
        throw error;
    }
};

export const updateUserData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { oldPassword, newPassword, ...updateData } = req.body;

        if (oldPassword && newPassword) {
            const isMatch = await comparePassword(oldPassword, user.password);
            if (!isMatch) {
                throw new BadRequestError("Incorrect password");
            }
            // new password and current password are not same
            if (oldPassword === newPassword) {
                throw new BadRequestError("New password cannot be same as old password");
            }
            user.password = await hashPassword(newPassword);
        }
        if (updateData?.referredBy) {
            const referredBy = await findUserByReferral(updateData?.referredBy);
            if (!referredBy) {
                throw new BadRequestError("Invalid Referral Code");
            }
            updateData.referredBy = referredBy._id;
        }
        Object.assign(user, updateData);
        await user.save();
        const data = publicViewData(user)
        SUCCESS(res, 200, "Update Successfully", { data });
    } catch (error) {
        console.log("error in register", error);
        next(error);
    }
};

export const profileUpdate = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        if (req.file) {
            const fileUrl = `/uploads/${(req.file as Express.Multer.File).filename}`;
            req.body.profileImage = fileUrl;
        }
        if (req.body.username) {
            const checkUsername = await findUserByUsername(req?.body?.username);
            if (checkUsername) {
                throw new BadRequestError("Username already exists");
            }
        }
        Object.assign(user, req.body);
        await user.save();
        SUCCESS(res, 200, "Profile uploaded successfully", { data: publicViewData(user) });
    } catch (error) {
        console.log("error in uploadImage", error);
        next(error);

    }

};
//upload image to s3 return url
export const uploadImage = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.file) {
            throw new BadRequestError("Image is required");
        }
        const fileUrl = (req.file as Express.Multer.File).filename;
        SUCCESS(res, 200, "Image uploaded successfully", { fileUrl });
    } catch (error) {
        console.log("error in uploadImage", error);
        next(error);

    }

};

//forget password
const forgetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.body.email || !req.body.type) {
            throw new BadRequestError("Email and type is required");
        }
        req.body.email = req.body?.email?.toLowerCase();
        const user = await findUserByEmail(req.body.email);
        if (!user) {
            throw new BadRequestError("User does not exist");
        }
        user.otp = generateOtp();
        user.otpExpireAt = otpExpiry();
        user.isVerified = true;
        await user.save();
        await sendEmail(user.email, req.body?.type || 3, user.otp);
        SUCCESS(res, 200, "Otp sent successfully", { email: req.body.email });
    } catch (error) {
        console.log("error in forgetPassword", error);
        next(error);
    }
}
// otp verify 
const verifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        if (!req.body.email || !req.body.otp) {
            throw new BadRequestError("Email and otp is required");
        }
        const user = await findUserByEmail(req.body.email);
        if (!user) {
            throw new BadRequestError("User does not exist");
        }
        if (!user.isVerified) {
            throw new BadRequestError("Otp not sent");

        }
        if (user.otp !== req.body.otp) {
            throw new BadRequestError("Invalid otp");
        }
        if (user.otpExpireAt.getTime() < Date.now()) {
            throw new BadRequestError("Otp expired");
        }
        user.isVerified = true;
        user.otp = null;
        user.otpExpireAt = null;
        await user.save();
        const token = signToken({ id: user._id });
        SUCCESS(res, 200, "Otp verified successfully", { token });
    } catch (error) {
        console.log("error in otpVerify", error);
        next(error);
    }
};
//reset password 
const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        if (!req.body.password) {
            throw new BadRequestError("Password is required");
        }
        // password or current password not same 
        const isMatch = await comparePassword(req.body.password, user.password);
        if (isMatch) {
            throw new BadRequestError("New password cannot be same as old password");
        }
        user.password = await hashPassword(req.body.password);
        await user.save();
        SUCCESS(res, 200, "Password reset successfully");
    } catch (error) {
        console.log("error in resetPassword", error);
        next(error);
    }
};
// delete user
const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;

        const deletePromises = [
            UserModel.findByIdAndDelete(user._id),
            FavoritesModel.deleteMany({ userId: user._id }),
            CollectionModel.deleteMany({ userId: user._id }),
            WishlistModel.deleteMany({ userId: user._id }),
            ReviewModel.deleteMany({ userId: user._id }),
            FollowModel.deleteMany({ $or: [{ userId: user._id }, { followId: user._id }] }),
            NotificationsModel.deleteMany({ userId: user._id }),
        ];
        await Promise.all(deletePromises);

        SUCCESS(res, 200, "User deleted successfully");
    } catch (error) {
        console.error("Error in deleteUser:", error);
        next(error);
    }
};


const followUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { userId } = req.params;
        const followingUser = await findUserById(userId);
        if (!followingUser) {
            throw new BadRequestError("User does not exist");
        }
        const isFollowing = await FollowModel.findOne({ userId: user._id, followId: followingUser._id });
        if (isFollowing) {
            await FollowModel.findByIdAndDelete(isFollowing._id);
            await NotificationsModel.findOneAndDelete({ followId: isFollowing._id });
        } else {
            console.log("isFollowing", followingUser);
            const follow = await FollowModel.create({ userId: user._id, followId: followingUser._id });
            await NotificationsModel.create(
                {
                    userId,
                    followId: follow._id,
                    type: "follow",
                    title: `New Follower`,
                    message: `${user.fullname} is Following  you`
                });
        }
        const data = await getUserProfile(user._id.toString(), user)
        emitNotificationCount(userId.toString(), { count: await NotificationsModel.countDocuments({ userId, isRead: false }) });
        emitGetProfile(user._id.toString(), data);

        SUCCESS(res, 200, isFollowing ? "User unfollowed successfully" : "User followed successfully");
    } catch (error) {
        console.log("error in followUser", error);
        next(error);
    }
}

//add collection
const addCollection = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

    try {
        const user = req.user;
        const { perfumeId } = req.params;
        const perfume = await findPerfumeById(perfumeId);
        if (!perfume) {
            throw new BadRequestError("Perfume does not exist");
        }
        const isCollection = await CollectionModel.findOne({ userId: user._id, perfumeId: perfume._id });
        if (isCollection) {
            await CollectionModel.findByIdAndDelete(isCollection._id);
        } else {
            await CollectionModel.create({ userId: user._id, perfumeId: perfume._id });
        }
        const data = await getUserProfile(user._id.toString(), user)
        emitGetProfile(user._id.toString(), data)
        SUCCESS(res, 200, isCollection ? "Perfume removed from collection successfully" : "Perfume added to collection successfully");
    } catch (error) {
        console.log("error in addCollection", error);
        next(error);
    }
};
//add wishlist 
const addWishlist = async (req: Request, res: Response, next: NextFunction): Promise<any> => {

    try {
        const user = req.user;
        const { perfumeId } = req.params;
        const perfume = await findPerfumeById(perfumeId);
        if (!perfume) {
            throw new BadRequestError("Perfume does not exist");
        }
        const isWishlist = await WishlistModel.findOne({ userId: user._id, perfumeId: perfume._id });
        if (isWishlist) {
            await WishlistModel.findByIdAndDelete(isWishlist._id);
        } else {
            await WishlistModel.create({ userId: user._id, perfumeId: perfume._id });
        }
        const data = await getUserProfile(user._id.toString(), user)
        emitGetProfile(user._id.toString(), data)
        SUCCESS(res, 200, isWishlist ? "Perfume removed from wishlist successfully" : "Perfume added to wishlist successfully");
    } catch (error) {
        console.log("error in addWishlist", error);
        next(error);
    }
}

//get collection wishlist reviews badges
const userData = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { page = "0", limit = "10", type = "collection" } = req.query;
        const currentPage = Math.max(Number(page), 1);
        const perPage = Math.max(Number(limit), 1);
        const skip = (currentPage - 1) * perPage;
        if (type === "collection") {
            const collections = await CollectionModel.find(
                { userId: user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage)
                .populate('perfumeId', 'name brand image')
                .lean();
            const totalCount = await CollectionModel.countDocuments({ userId: user._id });
            SUCCESS(res, 200, "Collection fetched successfully", {
                data: { collections, pagination: { totalCount, currentPage, perPage } }
            });
        } else if (type === "wishlist") {
            const wishlists = await WishlistModel.find(
                { userId: user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage)
                .populate('perfumeId', 'name brand image')
                .lean();
            const totalCount = await WishlistModel.countDocuments({ userId: user._id });
            SUCCESS(res, 200, "Wishlist fetched successfully", {
                data: { wishlists, pagination: { totalCount, currentPage, perPage } }
            });
        } else if (type === "review") {
            const reviews = await ReviewModel.find(
                { userId: user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage)
                .populate('perfumeId', 'name brand image')
                .populate('userId', 'fullname profileImage')
                .lean();
            const totalCount = await ReviewModel.countDocuments({ userId: user._id });
            SUCCESS(res, 200, "Review fetched successfully", {
                data: { reviews, pagination: { totalCount, currentPage, perPage } }
            });
        }
        else if (type === "badge") {
            const badges = await UserBadgesModel.find(
                { userId: user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(perPage)
                .populate('badgeId')
                .lean();
            const totalCount = await UserBadgesModel.countDocuments({ userId: user._id });
            SUCCESS(res, 200, "Badge fetched successfully", {
                data: { badges, pagination: { totalCount, currentPage, perPage } }
            });
        } else {
            throw new BadRequestError("Invalid type");
        }
    } catch (error) {
        console.log("error in userData", error);
        next(error);
    }
}
const submitUserQuiz = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { quizId, answers } = req.body; // answers: { questionId, selectedAnswer }

        const quiz = await QuizModel.findById(quizId);
        if (!quiz) throw new BadRequestError("Quiz not found");

        const playerIndex = quiz.players.findIndex(p => p.userId.toString() === user._id.toString());
        if (playerIndex === -1) throw new BadRequestError("User not in this quiz");

        const player = quiz.players[playerIndex];

        // Check if question already answered
        const alreadyAnswered = player.answers?.some(
            (ans: any) => ans.questionId.toString() === answers.questionId
        );
        if (alreadyAnswered) throw new BadRequestError("Question already answered");

        const question = await QuestionModel.findById(answers.questionId);
        if (!question) throw new BadRequestError("Question not found");

        const isCorrect =
            answers.selectedAnswer?.toLowerCase() === question.correctAnswer?.toLowerCase();

        // Add answer to user's record
        const answerObject = {
            questionId: question._id,
            correctAnswer: question.correctAnswer,
            selectedAnswer: answers.selectedAnswer,
            isCorrect,
        };

        player.answers.push(answerObject);
        if (isCorrect) {
            player.correctAnswers = (player.correctAnswers || 0) + 1;
            player.score = (player.score || 0) + 1;
        }

        // Optional: Update points only after all questions are answered
        const totalQuestions = quiz.totalQuestions || quiz.questions.length;
        let pointsEarned = 0;
        let passed = false;

        if (player.answers.length === totalQuestions) {
            passed = player.correctAnswers >= 7;

            if (quiz.mode === "quick") pointsEarned = passed ? 20 : 0;
            if (quiz.mode === "ranked") pointsEarned = passed ? 100 : -50;

            const newPoints = Math.max(0, (user.rankPoints || 0) + pointsEarned);
            const rankName = getRankName(newPoints);

            player.status = passed ? "pass" : "fail";
            player.pointsEarned = pointsEarned;
            player.isActive = false;

            await UserModel.findByIdAndUpdate(user._id, {
                rankPoints: newPoints,
                rankName,
            });
        }

        quiz.markModified("players");
        await quiz.save();

        SUCCESS(res, 200, "Answer submitted successfully", {
            isCorrect,
            answeredQuestion: answerObject,
            currentScore: player.score,
            totalAnswered: player.answers.length,
            totalQuestions,
            ...(player.answers.length === totalQuestions
                ? { passed, pointsEarned }
                : {}),
        });
    } catch (error) {
        console.log("Error in submitUserQuiz", error);
        next(error);
    }
};
const getQuestions = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.userId;
        const { type = "trivia" } = req.query;
        const userQuizRecords = await QuizModel.find({ userId }).select("questions.questionId").lean();
        const attemptedQuestionIds = userQuizRecords
            .flatMap((record) => record.questions.map((q) => q.toString()))
            .filter(Boolean);
        const questions = await QuestionModel.aggregate([
            { $match: { _id: { $nin: attemptedQuestionIds.map(id => new mongoose.Types.ObjectId(id)) }, isDeleted: false, type } },
            { $sample: { size: 10 } },
        ]);
        // if (questions?.length <= 10) throw new BadRequestError("No more questions available");
        SUCCESS(res, 200, "Question fetched successfully", { data: questions });
    } catch (error) {
        next(error);
    }
};

const createQuiz = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const userId = req.userId;

        const { mode, quizType, playType } = req.body;

        // Validate input
        if (!mode || !["quick", "ranked"].includes(mode)) {
            throw new BadRequestError("Invalid or missing mode");
        }
        if (!quizType || !["trivia", "scent", "guess"].includes(quizType)) {
            throw new BadRequestError("Invalid or missing quiz type");
        }
        if (!playType || !["solo", "multiple"].includes(playType)) {
            throw new BadRequestError("Invalid or missing play type");
        }

        // Get attempted question IDs from host's quiz records
        const userQuizRecords = await QuizModel.find({
            "players.userId": userId,
        })
            .select("questions")
            .lean();

        const attemptedQuestionIds = userQuizRecords
            .flatMap((record) => record.questions.map((q) => q.toString()))
            .filter(Boolean);
        console.log(attemptedQuestionIds);
        // Fetch 12 random unattempted questions of specified type
        const questions = await QuestionModel.aggregate([
            {
                $match: {
                    _id: { $nin: attemptedQuestionIds.map((id) => new mongoose.Types.ObjectId(id)) },
                    isDeleted: false,
                    type: quizType,
                },
            },
            { $sample: { size: 12 } },
        ]);

        if (questions.length < 12) {
            throw new BadRequestError("Not enough unattempted questions available");
        }

        // Create quiz with selected questions
        const quiz = await QuizModel.create({
            hostId: userId,
            mode,
            roomId: generateOtp(6, false, false),
            quizType,
            playType,
            questions: questions.map((q) => q._id),
            totalQuestions: 12,
            players: [],
            status: "waiting",
        });
        const getQuiz = await QuizModel.findById(quiz._id)
            .populate({
                path: "questions",
                model: "Question",
            })
            .lean();


        SUCCESS(res, 201, "Quiz created successfully", { data: getQuiz });
    } catch (error) {
        next(error);
    }
};
// {
//         userId: new mongoose.Types.ObjectId(userId),
//         score: 0,
//         correctAnswers: 0,
//         pointsEarned: 0,
//         joinedAt: new Date(),
//         isActive: true,
//       }

const getFollowers = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { page = "1", limit = "10" } = req.query;
        const currentPage = Number(page) || 1;
        const perPage = Number(limit) || 10;
        const skip = (currentPage - 1) * perPage;

        const results = await FollowModel.aggregate([
            { $match: { userId: user._id } },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    followers: [
                        { $skip: skip },
                        { $limit: perPage },
                        {
                            $lookup: {
                                from: "User",
                                localField: "followId",
                                foreignField: "_id",
                                as: "follow",
                                pipeline: [{ $project: { fullname: 1, profileImage: 1 } }],
                            },
                        },
                        { $unwind: "$follow" },
                        { $replaceRoot: { newRoot: "$follow" } },
                    ],
                    total: [{ $count: "count" }],
                },
            },
        ]);

        const total = results[0]?.total[0]?.count || 0;
        const followers = results[0]?.followers || [];
        const pagination = { total, currentPage, perPage };

        SUCCESS(res, 200, "Followers fetched successfully", { data: followers, pagination });
    } catch (error) {
        next(error);
    }
};
//send quiz invite
const sendQuizInvite = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { quizId, userIds } = req.body;
        const quiz = await QuizModel.findById(quizId);
        if (!quiz) {
            throw new BadRequestError("Quiz not found");
        }
        if (quiz.status !== "waiting") {
            throw new BadRequestError("Quiz is not in waiting state");
        }
        const host = await UserModel.findById(quiz.hostId);
        if (!host) {
            throw new BadRequestError("Host not found");
        }
        const invitedUsers = await UserModel.find({ _id: { $in: userIds } }, '_id fullname deviceToken deviceType');
        if (invitedUsers.length !== userIds.length) {
            throw new BadRequestError("Some users are not valid");
        }

        const notifications: any[] = [];
        const pushPromises: Promise<any>[] = [];
        const emitPromises: Promise<void>[] = [];
        // 3. Build notifications & push messages
        for (const invitedUser of invitedUsers) {
            const message = `You have been invited to a quiz by ${host.fullname}`;

            // Build in-app notification
            notifications.push({
                userId: invitedUser._id,
                type: "quizInvite",
                quizId: quiz._id,
                title: "Quiz Invite",
                message,
            });

            // Emit unread notification count (non-blocking)
            emitPromises.push(
                NotificationsModel.countDocuments({ userId: invitedUser._id, isRead: false })
                    .then((count) => emitNotificationCount(invitedUser._id.toString(), { count }))
            );
            // if (invitedUser.deviceToken) {
            //     pushPromises.push(
            //         sendPushNotification({
            //             deviceType: invitedUser.deviceType,
            //             token: invitedUser.deviceToken,
            //             title: "Quiz Invite",
            //             message: `You have been invited to a quiz by ${host.fullname}`,
            //             data: {
            //                 type: "quizInvite",
            //                 quizId: quiz._id.toString(),
            //             },
            //         })
            //     );
            // }
        }

        // 4. Insert notifications in bulk
        if (notifications.length > 0) {
            await NotificationsModel.insertMany(notifications);
        }

        // 5. Send push notifications in parallel
        // if (pushPromises.length > 0) {
        //     await Promise.allSettled(pushPromises); // safer than Promise.all
        // }
        Promise.allSettled(emitPromises).catch(console.error);


        SUCCESS(res, 200, "Quiz invite sent successfully");
    } catch (error) {
        next(error);

    }
};
// join quiz
const joinQuiz = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { quizId, roomId } = req.body;
        const quiz = roomId ? await QuizModel.findOne({ roomId }) : await QuizModel.findById(quizId);
        if (!quiz) {
            throw new BadRequestError("Quiz not found");
        }
        if (quiz.status !== "waiting") {
            throw new BadRequestError("Quiz is not in waiting state");
        }
        if (!quiz.players.find((player) => player?.userId?.toString() === user._id.toString())) {
            await QuizModel.updateOne({ _id: quiz._id }, { $push: { players: { userId: user._id } } });
        }
        const getQuiz = await QuizModel.findById(quiz._id)
            .populate({
                path: "questions",
                model: "Question",
            }).populate({
                path: "players.userId",
                model: "User",
                select: "fullname profileImage",
            })
            .lean();
        emitJoinRoom(user._id.toString(), getQuiz.roomId.toString(), getQuiz);
        SUCCESS(res, 200, "Joined quiz successfully");
    } catch (error) {
        next(error);
    }
}


const getNotifications = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { page = "1", limit = "10", status } = req.query;
        const currentPage = Number(page) || 1;
        const perPage = Number(limit) || 10;
        const skip = (currentPage - 1) * perPage;

        const filter = {
            userId: user._id,
        };

        if (status === "unread") filter["isRead"] = false;

        const results = await NotificationsModel.aggregate([
            { $match: filter },
            { $sort: { createdAt: -1 } },
            {
                $facet: {
                    notifications: [
                        { $skip: skip },
                        { $limit: perPage },
                        {
                            $lookup: {
                                from: "Follow",
                                localField: "followId",
                                foreignField: "_id",
                                as: "follow",
                                pipeline: [
                                    {
                                        $lookup: {
                                            from: "User",
                                            localField: "userId",
                                            foreignField: "_id",
                                            as: "followUser",
                                            pipeline: [
                                                {
                                                    $project: {
                                                        _id: 1,
                                                        fullname: 1,
                                                        profileImage: 1,
                                                    },
                                                },
                                            ],

                                        },
                                    },
                                    {
                                        $unwind: {
                                            path: "$followUser",
                                            preserveNullAndEmptyArrays: true
                                        },
                                    },
                                ],
                            }
                        },
                        {
                            $unwind: {
                                path: "$follow",
                                preserveNullAndEmptyArrays: true
                            },
                        }, {
                            $lookup: {
                                from: "Quiz",
                                localField: "quizId",
                                foreignField: "_id",
                                as: "quiz",
                            },
                        },
                        {
                            $unwind: {
                                path: "$quiz",
                                preserveNullAndEmptyArrays: true
                            },
                        },

                    ],
                    totalNotifications: [
                        { $count: "count" },
                    ],
                }
            }
        ]);

        const totalCount = results[0]?.totalNotifications[0]?.count || 0;
        const notifications = results[0]?.notifications || [];
        const unreadNotifications = await NotificationsModel.countDocuments({ userId: user._id, isRead: false });
        const pagination = { totalCount, currentPage, perPage, totalPage: Math.ceil(totalCount / perPage) };
        SUCCESS(res, 200, "Notifications fetched successfully", { data: notifications, pagination, unreadNotifications });
    } catch (error) {
        next(error);
    }
};
const markNotificationAsRead = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const user = req.user;
        const { type, id } = req.query;
        if (type == "single") {
            await NotificationsModel.findByIdAndUpdate(id, { isRead: true });
        } else {
            await NotificationsModel.updateMany({ userId: user._id }, { $set: { isRead: true } });
        }
        SUCCESS(res, 200, "Notifications marked as read successfully", {});
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
        SUCCESS(res, 200, "Articles fetched successfully", { data: articles, pagination });
    } catch (error) {
        next(error);
    }
};
 const getArticlesById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    try {
        const { id } = req.params;
        const articles = await ArticlesModel.findById(id).lean();
        if(!articles){
            throw new Error("Article not found");
        }
        SUCCESS(res, 200, "Articles fetched successfully", { data: articles });
    } catch (error) {
        next(error);
    }
};

export default {
    register, login, profile, updateUserData, uploadImage,
    forgetPassword, verifyOtp, resetPassword, profileUpdate, socialLogin, deleteUser,
    followUser, addCollection, addWishlist, userData, submitUserQuiz, getQuestions,
    getNotifications, markNotificationAsRead, createQuiz, getFollowers, sendQuizInvite, joinQuiz, getArticles, getArticlesById
};