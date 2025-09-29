import { Router } from "express";
import {
    loginUser,
    logOutUser,
    registerUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    resendEmailVerification,
    resetForgottenPassword,
    verifyEmail,
    forgotPasswordRequest,
    getAllUsers,
} from "../controllers/user.controller.js";
import { upload } from "./../middlewares/multer.js";
import { verifyJWT } from "../middlewares/auth.js";
import { authorizeRoles } from "../middlewares/auth.js";
import { requireAdminAccess, requirePermission } from "../middlewares/auth.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/verify-email/:verificationToken").get(verifyEmail);
router
    .route("/reset-password/:resetToken")
    .post(resetForgottenPassword);

// List all users - permission based
router.get(
    "/",
    verifyJWT,
    requireAdminAccess,
    requirePermission("CUSTOMERS", "VIEW"),
    getAllUsers
);

// secure route

router.route("/logout").post(verifyJWT, logOutUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/current-user").get(verifyJWT, getCurrentUser);
router.route("/forgot-password").post(forgotPasswordRequest);
router.route("/update-account").patch(verifyJWT, updateAccountDetails);
router
    .route("/resend-email-verification")
    .post(verifyJWT, resendEmailVerification);
router
    .route("/avatar")
    .patch(verifyJWT, upload.single("avatar"), updateUserAvatar);

export default router;
