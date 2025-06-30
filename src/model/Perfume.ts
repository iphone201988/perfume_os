import mongoose, { Schema } from "mongoose";

const PerfumeSchema = new mongoose.Schema({
    name: { type: String, default: null },
    brand: { type: String, default: null },
    brandImage: { type: String, default: null },
    image: { type: String, default: null },
    description: { type: String, default: null },
    year: { type: Number, default: null },
    intendedFor: [String],
    sessions: [{ name: String, width: String }],
    occasions: [{ name: String, width: String }],
    quotes: String,
    mainAccords: [{ name: String, width: String, backgroundColor: String }],
    notes: {
        top: [{ noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Notes" }, name: String, image: String }],
        middle: [{ noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Notes" }, name: String, image: String }],
        base: [{ noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Notes" }, name: String, image: String }],
        notes: [{ noteId: { type: mongoose.Schema.Types.ObjectId, ref: "Notes" }, name: String, image: String }],
    },
    rating: {
        score: Number,
        votes: Number,
    },
    longevity: {
        eternal: { vote: Number, percentage: Number },
        "long lasting": { vote: Number, percentage: Number },
        moderate: { vote: Number, percentage: Number },
        "very weak": { vote: Number, percentage: Number },
        weak: { vote: Number, percentage: Number },
    },
    sillage: {
        intimate: { vote: Number, percentage: Number },
        moderate: { vote: Number, percentage: Number },
        strong: { vote: Number, percentage: Number },
        enormous: { vote: Number, percentage: Number },
    },

}, { timestamps: true });


const PerfumeModel = mongoose.model("Perfume", PerfumeSchema, 'Perfume');

export default PerfumeModel;


