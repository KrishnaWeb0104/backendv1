import { Router } from "express";
import {
    getContactSetting,
    listContactSettings,
    createContactSetting,
    updateContactSetting,
    deleteContactSetting,
    toggleContactSetting,
    upsertContactSetting, // legacy endpoint for existing frontend
} from "../controllers/contactSetting.controller.js";
import {
    verifyJWT,
    requireAdminAccess,
    requirePermission,
} from "../middlewares/auth.js";

const router = Router();

// Public read (frontend display)
router.get("/", getContactSetting);

// Admin list all
router.get(
    "/all",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "READ"),
    listContactSettings
);

// Admin create
router.post(
    "/",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "CREATE"),
    createContactSetting
);

// Admin update by id
router.put(
    "/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "UPDATE"),
    updateContactSetting
);

// Admin toggle active
router.post(
    "/:id/toggle",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "UPDATE"),
    toggleContactSetting
);

// Admin delete
router.delete(
    "/:id",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "DELETE"),
    deleteContactSetting
);

// Legacy upsert (used by dashboard PUT /settings/contact)
router.put(
    "/",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CMS", "UPDATE"),
    upsertContactSetting
);

export default router;
