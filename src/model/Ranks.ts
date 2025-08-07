import mongoose from "mongoose";
import { Schema } from "mongoose";
const RanksSchema = new mongoose.Schema({
    name: { type: String, default: null },
    image: { type: String, default: null },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
});

const RanksModel = mongoose.model("Ranks", RanksSchema, 'Ranks');

export default RanksModel;