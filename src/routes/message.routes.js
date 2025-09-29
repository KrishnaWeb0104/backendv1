import { Router } from "express";
import multer from "multer";
import {
    createMessage,
    getMessages,
    getMessage,
    updateMessage,
    markMessageRead,
    archiveMessage,
    deleteMessage,
} from "../controllers/message.controller.js";
import {
    verifyJWT,
    requireAdminAccess,
    requirePermission,
} from "../middlewares/auth.js";

const router = Router();
const upload = multer(); // memory storage for simple text fields

/**
 * Public endpoint: Contact form submission (supports form-data & JSON)
 * POST /message
 */
router.post("/", upload.none(), createMessage);

/**
 * Admin / RBAC protected endpoints
 * Pattern follows product.router.js using requireAdminAccess + requirePermission
 */

// List messages (with filters/pagination)
router.get(
    "/",
    verifyJWT,
    requireAdminAccess,
    requirePermission("MESSAGES", "READ"),
    getMessages
);

// Get single message
router.get(
    "/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("MESSAGES", "READ"),
    getMessage
);

// Generic update (status, handledBy, subject/body edits)
router.patch(
    "/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("MESSAGES", "UPDATE"),
    updateMessage
);

// Mark as read
router.post(
    "/:id/read",
    verifyJWT,
    requireAdminAccess,
    requirePermission("MESSAGES", "UPDATE"),
    markMessageRead
);

// Archive
router.post(
    "/:id/archive",
    verifyJWT,
    requireAdminAccess,
    requirePermission("MESSAGES", "UPDATE"),
    archiveMessage
);

// Delete
router.delete(
    "/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("MESSAGES", "DELETE"),
    deleteMessage
);

export default router;
