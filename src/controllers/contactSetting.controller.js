import ContactSetting from "../models/contactSetting.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";

// Public (frontend display) – get latest active
export const getContactSetting = asyncHandler(async (_req, res) => {
    const doc = await ContactSetting.findOne({ isActive: true })
        .sort({ createdAt: -1 })
        .lean();
    return res
        .status(200)
        .json(new ApiResponse(200, doc || {}, "Contact settings fetched"));
});

// Admin: list all (optional history view)
export const listContactSettings = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const p = Math.max(1, parseInt(page));
    const l = Math.min(100, Math.max(1, parseInt(limit)));
    const [total, items] = await Promise.all([
        ContactSetting.countDocuments(),
        ContactSetting.find()
            .sort({ createdAt: -1 })
            .skip((p - 1) * l)
            .limit(l),
    ]);
    return res.status(200).json(
        new ApiResponse(200, {
            items,
            pagination: {
                total,
                page: p,
                limit: l,
                pages: Math.ceil(total / l),
            },
        })
    );
});

// Admin: create (prevent duplicate active if one already exists)
export const createContactSetting = asyncHandler(async (req, res) => {
    const existing = await ContactSetting.findOne({ isActive: true });
    if (existing) {
        throw new ApiError(
            409,
            "Active contact settings already exist. Deactivate or update the existing record."
        );
    }
    const doc = await ContactSetting.create(req.body || {});
    return res
        .status(201)
        .json(new ApiResponse(201, doc, "Contact settings created"));
});

// Admin: update (by id)
export const updateContactSetting = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const doc = await ContactSetting.findById(id);
    if (!doc) throw new ApiError(404, "Contact settings not found");
    Object.assign(doc, req.body || {});
    await doc.save();
    return res
        .status(200)
        .json(new ApiResponse(200, doc, "Contact settings updated"));
});

// Admin: soft toggle active (optional)
export const toggleContactSetting = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const doc = await ContactSetting.findById(id);
    if (!doc) throw new ApiError(404, "Contact settings not found");
    doc.isActive = !doc.isActive;
    await doc.save();
    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                doc,
                `Contact settings ${doc.isActive ? "activated" : "deactivated"}`
            )
        );
});

// Admin: delete (hard)
export const deleteContactSetting = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const deleted = await ContactSetting.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Contact settings not found");
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Contact settings deleted"));
});

// Admin: upsert (KEEP for existing frontend PUT /settings/contact)
export const upsertContactSetting = asyncHandler(async (req, res) => {
    let doc = await ContactSetting.findOne({ isActive: true }).sort({
        createdAt: -1,
    });
    if (!doc) {
        doc = await ContactSetting.create(req.body || {});
    } else {
        Object.assign(doc, req.body || {});
        await doc.save();
    }
    return res
        .status(200)
        .json(new ApiResponse(200, doc, "Contact settings saved"));
});
