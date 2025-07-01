import mongoose from "mongoose";
import { Schema } from "mongoose";
const PerfumersSchema = new mongoose.Schema({
    name: { type: String, default: null },
    bigImage: { type: String, default: null },
    smallImage: { type: String, default: null },
    description: { type: String, default: null },
    url: { type: String, default: null },
}, { timestamps: true });

const PerfumersModel = mongoose.model("Perfumers", PerfumersSchema, 'Perfumers');

export default PerfumersModel;