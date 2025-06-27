import mongoose from "mongoose";
import { Schema } from "mongoose";
const FollowSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    followId: { type: Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
});

const FollowModel = mongoose.model("Follow", FollowSchema, 'Follow');

export default FollowModel;


