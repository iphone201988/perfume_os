import { NextFunction, Request, Response } from "express";
import { comparePassword, findUserByEmail, findUserByReferral, findUserBySocialId, findUserByUsername, generateOtp, hashPassword, otpExpiry, signToken, userData } from "../utils/utills";
import UserModel from "../model/User";
import PerfumeModel from "../model/Perfume";
import { SUCCESS } from "../utils/response";
import { BadRequestError } from "../utils/errors";
import { sendEmail } from "../services/sendEmail";
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
        SUCCESS(res, 201, "User created successfully",{data:{ ...data, token}});
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
        const user = req.user;
        const data = userData(user);
        SUCCESS(res, 200, "Profile fetched successfully", { data });
    } catch (error) {
        next(error);
    }
}
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
}
export default {
    register, login, profile, updateUserData, uploadImage,
    forgetPassword, verifyOtp, resetPassword, profileUpdate, socialLogin, deleteUser
};