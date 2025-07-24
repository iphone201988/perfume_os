import mongoose from "mongoose";
const ArticlesSchema = new mongoose.Schema({
    title: { type: String, default: null },
    image: { type: String, default: null },
    content: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});

const ArticlesModel = mongoose.model("Articles", ArticlesSchema, 'Articles');

export default ArticlesModel;