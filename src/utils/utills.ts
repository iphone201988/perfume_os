import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import UserModel from '../model/User';
import axios from 'axios';
import path from 'path';
import os from 'os';
import fs from 'fs';
import otpGenerator from 'otp-generator';
import crypto from 'crypto';
import { IUser } from '../types/database/type';
import PerfumeModel from '../model/Perfume';


export const hashPassword = async (password: string) => await bcrypt.hash(password, 10);
export const comparePassword = async (password: string, hash: string) => await bcrypt.compare(password, hash);
export const signToken = (payload: any) => jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });
export const verifyToken = (token: string) => jwt.verify(token, process.env.JWT_SECRET as string);



export const findUserBySocialId = async (id: string, provider: number) => await UserModel.findOne({
    socialLinkedAccounts: {
        $elemMatch: { id, provider }
    }
});
export const findUserByReferral = async (referralCode: string) => await UserModel.findOne({ referralCode });
export const findUserByEmail = async (email: string) => await UserModel.findOne({ email });
export const findUserByUsername = async (username: string) => await UserModel.findOne({ username });
export const findUserById = async (id: string) => await UserModel.findById(id);
export const findPerfumeById = async (id: string) => await PerfumeModel.findById(id);
export const publicViewData = (user: IUser) => {
  return {
    _id: user._id, username: user.username, fullname: user.fullname, email: user.email, profileImage: user.profileImage, timezone: user.timezone, gender: user.gender, language: user.language, step: user.step, isNotificationOn: user.isNotificationOn, dob: user.dob, socialLinkedAccounts: user.socialLinkedAccounts, isVerified: user.isVerified, isBlocked: user.isBlocked, isDeleted: user.isDeleted,
    perfumeStrength: user.perfumeStrength,
    perfumeBudget: user.perfumeBudget,
    enjoySmell: user.enjoySmell,
    reasonForWearPerfume: user.reasonForWearPerfume,
    referralSource: user.referralSource,
    referralCode: user.referralCode,
    rankPoints: user.rankPoints,
    tutorialProgess: user.tutorialProgess,
    theme: user.theme

  }
};


export const downloadImage = async (url: string): Promise<string> => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const ext = path.extname(url).split('?')[0] || '.jpg';
  const tempFileName = crypto.randomBytes(16).toString('hex') + ext;
  const tempFilePath = path.join(os.tmpdir(), tempFileName);
  fs.writeFileSync(tempFilePath, response.data);
  return tempFilePath;
};

export const generateOtp = (number: number = 4, upperCaseAlphabets: boolean = false, specialChars: boolean = false) => otpGenerator.generate(number, { upperCaseAlphabets: upperCaseAlphabets, specialChars: specialChars, lowerCaseAlphabets: upperCaseAlphabets });
export const otpExpiry = (time: number = 10) => new Date(Date.now() + time * 60 * 1000);

export const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

