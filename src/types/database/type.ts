import { Document, ObjectId } from "mongoose";

export interface IUser extends Document {
    _id: ObjectId;
    username: string | null;
    fullname: string | null;
    email: string;
    password: string;
    profileImage: string;
    socialLinkedAccounts:[{
        provider: "google" | "facebook" | "apple" | "tiktok",
        id: string
    }]
    timezone: string | null;
    language: string | null;
    gender: "male" | "female" | "other";
    enjoySmell:[string];
    reasonForWearPerfume: string;
    perfumeStrength: number;
    perfumeBudget: string;
    referralSource: string;
    referralCode: string;
    referredBy: ObjectId | null;
    step: number;
    isNotificationOn: boolean;
    dob: Date;
    jti: string | null;
    otp: string | null;
    otpExpireAt: Date | null;
    isVerified: boolean;
    isBlocked: boolean;
    isDeleted: boolean;
    deviceToken: string | null;
    deviceType: string | null;
    createdAt: Date;
    updatedAt: Date;
}
export interface IQuiz extends Document {
    _id: ObjectId;
    question: string;
    options: string[];
    quizPosition: number;
}