import mongoose, { Schema } from "mongoose";
const NotificationsSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, default: null },
    followId: { type: Schema.Types.ObjectId, ref: "Follow" },
    title: { type: String, default: null },
    message: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

const NotificationsModel = mongoose.model("Notifications", NotificationsSchema, 'Notifications');

export default NotificationsModel;