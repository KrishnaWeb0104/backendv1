import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // can be user or admin
        required: true,
    },
    message: { type: String, required: true },
    sentAt: { type: Date, default: Date.now },
});

const chatSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User", // user + admin
            },
        ],
        messages: [messageSchema],
        isClosed: { type: Boolean, default: false }, // for resolved queries
    },
    { timestamps: true }
);

export const Chat = mongoose.model("Chat", chatSchema);
