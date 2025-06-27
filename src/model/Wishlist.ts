import mongoose from "mongoose";
import { Schema } from "mongoose";
const WishlistSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    perfumeId: { type: Schema.Types.ObjectId, ref: "Perfume" },
    createdAt: { type: Date, default: Date.now },
});

const WishlistModel = mongoose.model("Wishlist", WishlistSchema, 'Wishlist');

export default WishlistModel;


