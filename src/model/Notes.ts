import mongoose from "mongoose";
import { Schema } from "mongoose";
const NotesSchema = new mongoose.Schema({
    name: { type: String, default: null },
    image: { type: String, default: null },
    bgUrl: { type: String, default: null },
    group: { type: String, default: null },
    odorProfile: { type: String, default: null },
    scientificName: { type: String, default: null },
    otherNames: { type: [String], default: null },
    thumbnails: { type: [String], default: null },
    url: { type: String, default: null },
}, { timestamps: true });

const NotesModel = mongoose.model("Notes", NotesSchema, 'Notes');

export default NotesModel;