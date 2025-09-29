// require('dotenv').config({path: '../.env'})
import connectDB from "./db/index.js";
import dotenv from "dotenv";
import { config } from "dotenv";
import app from "./app.js";
config({ path: "../.env" });

const Port = process.env.PORT || 8000;
connectDB()
    .then(() => {
        app.listen(Port, () => {
            console.log(`server is running at port : ${Port}`);
        });
    })
    .catch((err) => {
        console.log("mongo db connection failed", err);
    });
