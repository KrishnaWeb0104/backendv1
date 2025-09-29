import { Chat } from "../models/chat.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Start or get existing chat with admin
export const getOrCreateChat = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    // Find if user has any open chat
    let chat = await Chat.findOne({
        participants: userId,
        isClosed: false,
    }).populate("messages.sender", "fullName avatar");
    if (!chat) {
        chat = await Chat.create({ participants: [userId], messages: [] });
    }
    res.json(new ApiResponse(200, chat, "Chat found or started"));
});

// Send message (user or admin)
export const sendMessage = asyncHandler(async (req, res) => {
    const { chatId, message } = req.body;
    if (!message) throw new ApiError(400, "Message required");

    const chat = await Chat.findById(chatId);
    if (!chat) throw new ApiError(404, "Chat not found");

    chat.messages.push({ sender: req.user._id, message });
    await chat.save();

    res.json(new ApiResponse(200, chat, "Message sent"));
});

// Get all user chats (for admin/support panel)
export const getAllChats = asyncHandler(async (req, res) => {
    const chats = await Chat.find({}).populate(
        "participants",
        "fullName email"
    );
    res.json(new ApiResponse(200, chats, "All chats"));
});

// (Optional) Close chat
export const closeChat = asyncHandler(async (req, res) => {
    const { chatId } = req.body;
    await Chat.findByIdAndUpdate(chatId, { isClosed: true });
    res.json(new ApiResponse(200, {}, "Chat closed"));
});
