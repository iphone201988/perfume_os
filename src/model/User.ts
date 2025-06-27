import mongoose, { Schema } from "mongoose";
import { IUser } from "../types/database/type";

const UserSchema = new mongoose.Schema<IUser>({
    fullname: { type: String, default: null },
    username: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, },
    profileImage: { type: String, default: null },
    timezone: { type: String, default: null },
    gender: { type: String, default: null },
    language: { type: String, default: null },
    step: { type: Number, default: 0 },
    isNotificationOn: { type: Boolean, default: false },
    dob: { type: Date, default: null },
    socialLinkedAccounts: [{ provider: { type: String }, id: { type: String } }],
    perfumeStrength: { type: Number, default: 0 },
    perfumeBudget: { type: String, default: null },
    enjoySmell: [{ type: String }],
    reasonForWearPerfume: { type: String, default: null },
    referralSource: { type: String, default: null },
    referralCode: { type: String, default: null },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isVerified: { type: Boolean, default: false },
    jti: { type: String, default: null },
    otp: { type: String, default: null },
    otpExpireAt: { type: Date, default: null },
    deviceToken: { type: String, default: null },
    deviceType: { type: String, default: null },
    isBlocked: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
}, { timestamps: true });


const UserModel = mongoose.model<IUser>("User", UserSchema, 'User');

export default UserModel;


