import mongoose from "mongoose";
import { Schema } from "mongoose";
const BadgesSchema = new mongoose.Schema({
    name: { type: String, default: null },
    image: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});

const BadgesModel = mongoose.model("Badges", BadgesSchema, 'Badges');

export default BadgesModel;