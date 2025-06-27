import mongoose from "mongoose";
import { Schema } from "mongoose";
const UserBadgesSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    badgeId: { type: Schema.Types.ObjectId, ref: "Badges" },
    createdAt: { type: Date, default: Date.now },
});

const UserBadgesModel = mongoose.model("UserBadges", UserBadgesSchema, 'UserBadges');

export default UserBadgesModel;