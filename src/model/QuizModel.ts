// models/QuizModel.ts
import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mode: {
    type: String,
    enum: ["quick", "ranked"],
  },
  quizType: {
    type: String,
    enum: ["trivia", "scent", "guess"],
  },
  playType: {
    type: String,
    enum: ["solo", "multiple"],
  },
  roomId: { type: Number, required: true },
  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    answers: [{
      questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question" },
      correctAnswer: String,
      selectedAnswer: String,
      isCorrect: Boolean,
    }],
    score: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["pass", "fail"], },
    isActive: { type: Boolean, default: true },
    correctAnswers: { type: Number, default: 0 },
    pointsEarned: { type: Number, default: 0 },
  }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  totalQuestions: { type: Number, default: 0 },
  status: { type: String, enum: ["waiting", "active", "finished"], default: "waiting" },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  indexes: [
    { key: { hostId: 1 } },
    { key: { roomId: 1 } },
    { key: { createdAt: -1 } },
    { key: { "players.userId": 1 } },
  ]
});

const QuizModel = mongoose.model("Quiz", QuizSchema, "Quiz");
export default QuizModel;
