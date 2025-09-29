import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/auth.js";
import { requireAdminAccess } from "../middlewares/auth.js";
import {
    createAdmin,
    listAdmins,
    getAdminById,
    updateAdmin,
    deleteAdmin,
    toggleAdminStatus,
    getMyAdminProfile,
} from "../controllers/admin.controller.js";

const router = Router();

// Super Admin only
router.post("/", verifyJWT, authorizeRoles("SUPER_ADMIN"), createAdmin);
router.get("/", verifyJWT, authorizeRoles("SUPER_ADMIN"), listAdmins);
router.get("/:id", verifyJWT, authorizeRoles("SUPER_ADMIN"), getAdminById);
router.patch("/:id", verifyJWT, authorizeRoles("SUPER_ADMIN"), updateAdmin);
router.delete("/:id", verifyJWT, authorizeRoles("SUPER_ADMIN"), deleteAdmin);
router.patch(
    "/:id/toggle",
    verifyJWT,
    authorizeRoles("SUPER_ADMIN"),
    toggleAdminStatus
);

// Self profile for ADMIN/SUB_ADMIN/SUPER_ADMIN
router.get("/me/profile", verifyJWT, requireAdminAccess, getMyAdminProfile);

export default router;
