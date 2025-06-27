import mongoose from "mongoose";
import { Schema } from "mongoose";
const CollectionSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    perfumeId: { type: Schema.Types.ObjectId, ref: "Perfume" },
    createdAt: { type: Date, default: Date.now },
});

const CollectionModel = mongoose.model("Collection", CollectionSchema, 'Collection');

export default CollectionModel;


