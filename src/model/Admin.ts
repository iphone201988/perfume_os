import mongoose, { Schema } from "mongoose";

const AdminSchema = new mongoose.Schema({
    fullname: { type: String, default: null },
    email: { type: String, required: true, unique: true },
    password: { type: String, },
    profileImage: { type: String, default: null },
    timezone: { type: String, default: null },
    language: { type: String, default: null },
    jti: { type: String, default: null },
    otp: { type: String, default: null },
    otpExpireAt: { type: Date, default: null },
    deviceToken: { type: String, default: null },
    deviceType: { type: String, default: null },
}, { timestamps: true });


const AdminModel = mongoose.model("Admin", AdminSchema, 'Admin');

export default AdminModel;


