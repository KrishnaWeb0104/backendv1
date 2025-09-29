import express from "express";
import {
    createPage,
    getPages,
    getPageBySlug,
    updatePage,
    deletePage,
    togglePageStatus,
} from "../controllers/page.controller.js";
import { verifyJWT } from "../middlewares/auth.js";
import { requireAdminAccess, requirePermission } from "../middlewares/auth.js";

const router = express.Router();

router.get("/", getPages);
router.post(
    "/create-page",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "CREATE"),
    createPage
);
router.get("/:slug", getPageBySlug);
router.put(
    "/update-page/:slug",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "UPDATE"),
    updatePage
);
router.patch(
    "/:slug/toggle",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "UPDATE"),
    togglePageStatus
);
router.delete(
    "/:slug",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "DELETE"),
    deletePage
);

export default router;
