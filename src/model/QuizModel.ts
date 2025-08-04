// models/QuizModel.ts
import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mode: {
    type: String,
    enum: ["quick", "ranked"],
  },

  type: {
    type: String,
    enum: ["classic", "scent_or_not", "guess_bottle"],
  },

  questions: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      correctAnswer: String,
      selectedAnswer: String,
      isCorrect: Boolean,
   
    },
  ],
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  correctAnswers: { type: Number, default: 0 },
  status: { type: String, enum: ["pass", "fail"], },
  pointsEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const QuizModel = mongoose.model("Quiz", QuizSchema, "Quiz");
export default QuizModel;
