import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import ApiResponse from "../utils/ApiResponse.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import {
    emailVerificationMailgenContent,
    forgotPasswordMailgenContent,
    sendEmail,
} from "../utils/mail.js";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access tokens"
        );
    }
};

const registerUser = asyncHandler(async (req, res) => {
    const { userName, fullName, email, password, phoneNumber } = req.body;

    // Validate required fields
    if (
        [userName, fullName, email, password].some(
            (field) => !field || field.trim() === ""
        )
    ) {
        throw new ApiError(
            400,
            "Username, full name, email, and password are required"
        );
    }

    // Check if user already exists
    const existingEmail = await User.findOne({ email }).select('_id').lean().maxTimeMS(5000);
    if (existingEmail) {
        throw new ApiError(409, "Email already exists");
    }

    const existingUserName = await User.findOne({ userName: userName.toLowerCase() }).select('_id').lean().maxTimeMS(5000);
    if (existingUserName) {
        throw new ApiError(409, "Username already exists");
    }

    // Handle optional avatar upload
    let avatarUrl = "";
    if (req.files?.avatar?.[0]) {
        try {
            const avatar = await uploadOnCloudinary(req.files.avatar[0].path);
            if (avatar?.url) {
                avatarUrl = avatar.url;
            }
        } catch (error) {
            console.error("Avatar upload error:", error);
            // Continue without avatar
        }
    }

    // Create user in the database
    const user = await User.create({
        fullName,
        avatar: avatarUrl,
        email,
        password,
        userName: userName.toLowerCase(),
        phoneNumber: phoneNumber || "",
        // address: address || "",
    });

    const emailVerificationToken = user.generateTemporaryToken();
    await user.save();

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken -role -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry "
    );

    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    const emailVerificationUrl = `${process.env.BASE_URL}/api/v1/auth/verify-email/${emailVerificationToken}`;

    // await sendEmail({
    //     email: user.email,
    //     subject: "Verify your email address",
    //     mailgenContent: emailVerificationMailgenContent(
    //         user.userName,
    //         emailVerificationUrl
    //     ),
    // });

    return res
        .status(201)
        .json(
            new ApiResponse(201, createdUser, "User registered successfully")
        );
});

export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    if (!token) {
        throw new ApiError(400, "Token is required to verify email");
    }

    const user = await User.findOne({
        emailVerificationToken: { $exists: true },
        emailVerificationExpiry: { $gt: Date.now() },
    });

    if (!user || !(await bcrypt.compare(token, user.emailVerificationToken))) {
        throw new ApiError(400, "Invalid or expired token");
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
        message: "User verified successfully",
        success: true,
    });
});

const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const user = await User.findOne({ email }).maxTimeMS(5000);

    if (!user) {
        throw new ApiError(401, "Invalid email or password");
    }

    const isValidPassword = await user.isPasswordCorrect(password);

    if (!isValidPassword) {
        throw new ApiError(401, "Invalid password");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    const loggedinUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry"
    );

    // const options = {
    //   httpOnly: true,
    //   secure: true,
    // };

    const isProduction = process.env.NODE_ENV === 'production';
    const cookieDomain = isProduction ? '.marwarsaheli.com' : undefined;

    const accessTokenOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 15 * 60 * 1000, // 15 minutes
        domain: cookieDomain, // Allow subdomains in production
    };

    const refreshTokenOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        domain: cookieDomain,
    };

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .cookie("accessToken", accessToken, accessTokenOptions)
        .cookie("refreshToken", refreshToken, refreshTokenOptions)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedinUser,
                },
                "User logged in successfully"
            )
        );
});

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1,
            },
        },
        {
            new: true,
        }
    );

    // const options = {
    //   httpOnly: true,
    //   secure: true,
    // };

    return res
        .status(200)
        .clearCookie("accessToken")
        .clearCookie("refreshToken")
        .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken =
        req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh Token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }

        const isProduction = process.env.NODE_ENV === 'production';
        const cookieDomain = isProduction ? '.marwarsaheli.com' : undefined;

        const accessTokenOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 15 * 60 * 1000, // 15 minutes
            domain: cookieDomain, // Allow subdomains in production
        };

        const refreshTokenOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            domain: cookieDomain,
        };

        const { accessToken, newRefreshToken } =
            await generateAccessAndRefreshTokens(user._id);

        return res
            .status(200)
            .cookie("accessToken", accessToken, accessTokenOptions)
            .cookie("refreshToken", newRefreshToken, refreshTokenOptions)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh Token");
    }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required");
    }

    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(404, "user not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(
            new ApiResponse(200, req.user, "Current user fetched successfully")
        );
});

export const resendEmailVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new ApiError(404, "User does not exists", []);
    }

    // if email is already verified throw an error
    if (user.isEmailVerified) {
        throw new ApiError(409, "Email is already verified!");
    }

    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken(); // generate email verification creds

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });
    const emailVerificationUrl = `${process.env.BASE_URL}/api/v1/auth/verify-email/${unHashedToken}`;

    // await sendEmail({
    //     email: user?.email,
    //     subject: "Please verify your email",
    //     mailgenContent: emailVerificationMailgenContent(
    //         user.userName,
    //         emailVerificationUrl
    //     ),
    // });
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Mail has been sent to your mail ID"));
});

export const forgotPasswordRequest = asyncHandler(async (req, res) => {
    const { email } = req.body;

    // Get email from the client and check if user exists
    const user = await User.findOne({ email });

    if (!user) {
        // For security reasons, don't reveal that the user does not exist
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been sent on your mail id"
            )
        );
    }

    // Generate a temporary token
    const { unHashedToken, hashedToken, tokenExpiry } =
        user.generateTemporaryToken(); // generate password reset creds

    // save the hashed version a of the token and expiry in the DB
    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;
    await user.save({ validateBeforeSave: false });

    // Send mail with the password reset link. It should be the link of the frontend url with token
    // await sendEmail({
    //     email: user?.email,
    //     subject: "Password reset request",
    //     mailgenContent: forgotPasswordMailgenContent(
    //         user.userName,
    //         // ! NOTE: Following link should be the link of the frontend page responsible to request password reset
    //         // ! Frontend will send the below token with the new password in the request body to the backend reset password endpoint
    //         `${process.env.FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
    //     ),
    // });
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                {},
                "Password reset mail has been sent on your mail id"
            )
        );
});

export const resetForgottenPassword = asyncHandler(async (req, res) => {
    const { resetToken } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
        forgotPasswordToken: { $exists: true },
        forgotPasswordExpiry: { $gt: Date.now() },
    });

    if (!user || !(await bcrypt.compare(resetToken, user.forgotPasswordToken))) {
        throw new ApiError(400, "Token is invalid or expired");
    }

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password reset successfully"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email, phoneNumber, address } = req.body;

    if (!fullName && !email && !phoneNumber && !address) {
        throw new ApiError(400, "At least one field is required to update");
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (address) updateData.address = address;
    
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        { $set: updateData },
        { new: true }
    ).select(
        "-password -refreshToken -role -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry "
    );

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Account details updated successfully")
        );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading avatar");
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            },
        },
        {
            new: true,
        }
    ).select(
        "-password -refreshToken -role -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry "
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar updated successfully"));
});

const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, q = "", role } = req.query;

    const query = {};
    if (q) {
        query.$or = [
            { fullName: { $regex: q, $options: "i" } },
            { userName: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
        ];
    }
    if (role) {
        query.role = role;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
        User.find(query)
            .select(
                "-password -refreshToken -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry"
            )
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        User.countDocuments(query),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                users,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalItems: total,
                },
            },
            "Users fetched successfully"
        )
    );
});

export {
    registerUser,
    loginUser,
    logOutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    getAllUsers,
};
