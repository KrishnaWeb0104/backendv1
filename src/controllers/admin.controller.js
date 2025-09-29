import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Admin from "../models/admin.models.js";
import User from "../models/user.models.js";

// Helper to ensure only SUPER_ADMIN can proceed (middleware covers this, kept for safety)
const ensureSuperAdmin = (req) => {
    if (!req.user || req.user.role !== "SUPER_ADMIN") {
        throw new ApiError(403, "SUPER_ADMIN only");
    }
};

const normalizePermissions = (permissions = []) => {
    if (!Array.isArray(permissions)) return [];
    return permissions
        .filter((p) => p && typeof p.module === "string")
        .map((p) => ({
            module: String(p.module).toUpperCase(),
            rights: Array.isArray(p.rights)
                ? [...new Set(p.rights.map((r) => String(r).toUpperCase()))]
                : ["VIEW"],
        }));
};

// Create Admin / Sub-Admin
export const createAdmin = asyncHandler(async (req, res) => {
    ensureSuperAdmin(req);
    const {
        userId,
        role = "ADMIN",
        permissions = [],
        isActive = true,
    } = req.body;

    if (!userId) throw new ApiError(400, "userId is required");

    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found");

    if (role !== "ADMIN" && role !== "SUB_ADMIN") {
        throw new ApiError(400, "Role must be either ADMIN or SUB_ADMIN");
    }

    // Normalize permissions
    const normalized = normalizePermissions(permissions);

    // Update user role
    user.role = role;
    await user.save({ validateBeforeSave: false });

    // Create or update Admin profile
    const admin = await Admin.findOneAndUpdate(
        { user: user._id },
        {
            user: user._id,
            role,
            permissions: normalized,
            isActive: Boolean(isActive),
            createdBy: req.user._id,
            updatedBy: req.user._id,
        },
        { new: true, upsert: true }
    ).populate("user", "fullName userName email role avatar");

    return res
        .status(201)
        .json(
            new ApiResponse(201, admin, "Admin created/updated successfully")
        );
});

// List Admins/Sub-Admins with filters
export const listAdmins = asyncHandler(async (req, res) => {
    ensureSuperAdmin(req);
    const { page = 1, limit = 10, role, q, isActive } = req.query;

    const query = {};
    if (role) query.role = role;
    if (typeof isActive !== "undefined") query.isActive = isActive === "true";
    if (q) {
        query.$or = [
            { "user.fullName": { $regex: q, $options: "i" } },
            { "user.userName": { $regex: q, $options: "i" } },
            { "user.email": { $regex: q, $options: "i" } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const admins = await Admin.find(query)
        .populate("user", "fullName userName email role avatar")
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 });

    const total = await Admin.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                admins,
                pagination: {
                    currentPage: Number(page),
                    totalPages: Math.ceil(total / Number(limit)),
                    totalItems: total,
                },
            },
            "Admins fetched successfully"
        )
    );
});

// Get single admin
export const getAdminById = asyncHandler(async (req, res) => {
    ensureSuperAdmin(req);
    const { id } = req.params;

    const admin = await Admin.findById(id).populate(
        "user",
        "fullName userName email role avatar"
    );
    if (!admin) throw new ApiError(404, "Admin not found");

    return res
        .status(200)
        .json(new ApiResponse(200, admin, "Admin fetched successfully"));
});

// Update admin (role/permissions/status)
export const updateAdmin = asyncHandler(async (req, res) => {
    ensureSuperAdmin(req);
    const { id } = req.params;
    const { role, permissions, isActive } = req.body;

    const admin = await Admin.findById(id);
    if (!admin) throw new ApiError(404, "Admin not found");

    if (role && (role !== "ADMIN" && role !== "SUB_ADMIN")) {
        throw new ApiError(400, "Role must be either ADMIN or SUB_ADMIN");
    }

    if (role) {
        admin.role = role;
        await User.findByIdAndUpdate(admin.user, { $set: { role } });
    }
    if (Array.isArray(permissions))
        admin.permissions = normalizePermissions(permissions);
    if (typeof isActive !== "undefined") admin.isActive = Boolean(isActive);
    admin.updatedBy = req.user._id;

    await admin.save();
    const updated = await Admin.findById(id).populate(
        "user",
        "fullName userName email role avatar"
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updated, "Admin updated successfully"));
});

// Delete admin (downgrade user to CUSTOMER)
export const deleteAdmin = asyncHandler(async (req, res) => {
    ensureSuperAdmin(req);
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) throw new ApiError(404, "Admin not found");

    if (admin.role === "SUPER_ADMIN") {
        throw new ApiError(403, "Cannot delete a super admin");
    }

    await User.findByIdAndUpdate(admin.user, { $set: { role: "CUSTOMER" } });
    await Admin.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Admin deleted successfully"));
});

// Toggle activation
export const toggleAdminStatus = asyncHandler(async (req, res) => {
    ensureSuperAdmin(req);
    const { id } = req.params;

    const admin = await Admin.findById(id);
    if (!admin) throw new ApiError(404, "Admin not found");

    admin.isActive = !admin.isActive;
    admin.updatedBy = req.user._id;
    await admin.save();

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                admin,
                `Admin ${admin.isActive ? "activated" : "deactivated"} successfully`
            )
        );
});

// Get my admin profile (for ADMIN/SUB_ADMIN) and SUPER_ADMIN meta profile
export const getMyAdminProfile = asyncHandler(async (req, res) => {
    if (!req.user) throw new ApiError(401, "Unauthorized");

    if (req.user.role === "SUPER_ADMIN") {
        return res.status(200).json(
            new ApiResponse(
                200,
                {
                    user: req.user._id,
                    role: "SUPER_ADMIN",
                    isActive: true,
                    permissions: [{ module: "ALL", rights: ["*"] }],
                },
                "Profile fetched"
            )
        );
    }

    const admin = await Admin.findOne({ user: req.user._id });
    if (!admin) throw new ApiError(404, "Admin profile not found");
    if (admin.isActive === false)
        throw new ApiError(403, "Admin account is inactive");

    return res.status(200).json(new ApiResponse(200, admin, "Profile fetched"));
});
