import { NextFunction, Request, Response } from "express";
import { comparePassword, findPerfumeById, findUserByEmail, findUserById, findUserByReferral, findUserBySocialId, findUserByUsername, generateOtp, hashPassword, otpExpiry, signToken, userData } from "../utils/utills";
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
        const data = userData(user);
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
        const data = userData(user)
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
        const data = userData(user)
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
        const data: any = userData(viewedUser);

        const [collections, wishlists, badges, isFollowing, followers, following, reviewDataAgg] = await Promise.all([
            CollectionModel.find({ userId: viewedUser._id }).populate("perfumeId").lean(),
            WishlistModel.find({ userId: viewedUser._id }).populate("perfumeId").lean(),
            BadgesModel.find({ userId: viewedUser._id }).populate("badgeId").lean(),
            FollowModel.exists({ userId: currentUser._id, following: viewedUser._id }),
            FollowModel.countDocuments({ followId: viewedUser._id }),
            FollowModel.countDocuments({ userId: viewedUser._id }),
            ReviewModel.aggregate([
                {
                    $match: { userId: viewedUser._id }
                },
                {
                    $lookup: {
                        from: "perfumes",
                        localField: "perfumeId",
                        foreignField: "_id",
                        as: "perfume"
                    }
                },
                {
                    $unwind: {
                        path: "$perfume",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $facet: {
                        reviewsList: [
                            { $sort: { createdAt: -1 } },
                            {
                                $project: {
                                    rating: 1,
                                    comment: 1,
                                    perfume: 1,
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
            ])
        ]);
        const { reviews = [], totalReviews = 0, averageRating = 0 } = reviewDataAgg[0] || {}
        Object.assign(data, {
            collections,
            wishlists,
            badges,
            isFollowing: !!isFollowing,
            followers,
            following,
            reviews,
            totalReviews,
            averageRating
        });

        SUCCESS(res, 200, "Profile fetched successfully", { data });
    } catch (error) {
        next(error);
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
        SUCCESS(res, 200, "Update Successfully");
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
        SUCCESS(res, 200, "Profile uploaded successfully", {});
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
        await UserModel.findByIdAndDelete(user._id);
        SUCCESS(res, 200, "User deleted successfully");
    } catch (error) {
        console.log("error in deleteUser", error);
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
        const isFollowing = await FollowModel.findOne({ user: user._id, following: followingUser._id });
        if (isFollowing) {
            await FollowModel.findByIdAndDelete(isFollowing._id);
        } else {
            await FollowModel.create({ user: user._id, following: followingUser._id });
        }
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
        SUCCESS(res, 200, isWishlist ? "Perfume removed from wishlist successfully" : "Perfume added to wishlist successfully");
    } catch (error) {
        console.log("error in addWishlist", error);
        next(error);
    }
}
export default {
    register, login, profile, updateUserData, uploadImage,
    forgetPassword, verifyOtp, resetPassword, profileUpdate, socialLogin, deleteUser,
    followUser, addCollection, addWishlist
};