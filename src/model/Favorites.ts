import mongoose from "mongoose";
import { Schema } from "mongoose";
const FavoritesSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, default: null },
    perfumeId: { type: Schema.Types.ObjectId, ref: "Perfume" , default: null },
    perfumerId: { type: Schema.Types.ObjectId, ref: "Perfumers" , default: null },
    noteId: { type: Schema.Types.ObjectId, ref: "Notes" , default: null },
    articleId: { type: Schema.Types.ObjectId, ref: "Articles" , default: null },
    createdAt: { type: Date, default: Date.now },
});

const FavoritesModel = mongoose.model("Favorites", FavoritesSchema, 'Favorites');

export default FavoritesModel;


