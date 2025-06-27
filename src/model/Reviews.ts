import mongoose, { Schema } from "mongoose";

const ReviewSchema = new mongoose.Schema({
    perfumeId: { type: Schema.Types.ObjectId, ref: "Perfume"},
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    review: { type: String, default: null },
    rating: { type: Number, default: 0 },
    authorName: { type: String, default: null },
    authorImage: { type: String, default: null },
    datePublished: { type: Date, default: null },

}, { timestamps: true });


const ReviewModel = mongoose.model("Review", ReviewSchema, 'Review');

export default ReviewModel;


