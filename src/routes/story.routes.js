import { Router } from "express";
import multer from "multer";
import {
    getStories,
    getStoryById,
    createStory,
    updateStory,
    deleteStory,
} from "../controllers/story.controller.js";
import { verifyJWT, authorizeRoles } from "../middlewares/auth.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

// Adjust roles/middleware as per your project (example uses admin roles)
router
    .route("/")
    .get(getStories)
    .post(
        verifyJWT,
        authorizeRoles("SUPER_ADMIN", "ADMIN", "SUB_ADMIN"),
        upload.single("image"),
        createStory
    );

router
    .route("/:id")
    .get(getStoryById)
    .put(
        verifyJWT,
        authorizeRoles("SUPER_ADMIN", "ADMIN", "SUB_ADMIN"),
        upload.single("image"),
        updateStory
    )
    .delete(
        verifyJWT,
        authorizeRoles("SUPER_ADMIN", "ADMIN", "SUB_ADMIN"),
        deleteStory
    );

export default router;
