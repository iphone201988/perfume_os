// models/QuestionModel.ts
import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["trivia", "scent", "guess"],
    required: true,
  },
  questionText: { type: String, required: true },
  options: [{ type: String }],
  correctAnswer: { type: String, required: true },
  image: { type: String, default: null }, // Only used in guess_bottle
  explanation: { type: String, default: null }, // Optional
  isDeleted: { type: Boolean, default: false },
}, { timestamps: true });

const QuestionModel = mongoose.model("Question", QuestionSchema, "Question");

export default QuestionModel;