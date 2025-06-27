import mongoose from "mongoose";

export function connectDataBase(){
    mongoose.connect(process.env.MONGO_URL as string).then(() => {
        console.log("Database connected")
    }).catch((err) => {
        console.log("error in connecting database", err)
    })
}