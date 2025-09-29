import express from "express";
import { verifyJWT } from "../middlewares/auth.js";
import {
    getOrCreateChat,
    sendMessage,
    getAllChats,
    closeChat,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/", verifyJWT, getOrCreateChat); // User: get or start chat
router.post("/send", verifyJWT, sendMessage); // User/Admin: send message
router.get("/all", verifyJWT, getAllChats); // Admin: see all chats
router.post("/close", verifyJWT, closeChat); // Admin: close chat

export default router;
