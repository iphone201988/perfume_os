import mongoose from "mongoose";
import { Schema } from "mongoose";
const SearchSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    perfumeId: { type: Schema.Types.ObjectId, ref: "Perfume" },
    createdAt: { type: Date, default: Date.now },
});

const SearchModel = mongoose.model("Search", SearchSchema, 'Search');

export default SearchModel;