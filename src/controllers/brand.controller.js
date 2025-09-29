import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { Brand } from "../models/brand.model.js";
import Product from "../models/product.models.js";
import mongoose from "mongoose";

// @desc    Get all brands with pagination + search
export const getBrands = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (page - 1) * limit;
    const [brands, total] = await Promise.all([
        Brand.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        Brand.countDocuments(query),
    ]);

    const pagination = {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalBrands: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            { brands, pagination },
            "Brands fetched successfully"
        )
    );
});

// @desc    Get single brand
export const getBrandById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Valid Brand ID is required");
    }
    const brand = await Brand.findById(id);
    if (!brand) throw new ApiError(404, "Brand not found");
    res.status(200).json(
        new ApiResponse(200, brand, "Brand fetched successfully")
    );
});

// @desc    Create new brand
export const createBrand = asyncHandler(async (req, res) => {
    const { name, description, brand_id } = req.body;
    if (!name?.trim()) {
        throw new ApiError(400, "Brand name is required");
    }
    if (brand_id !== undefined && isNaN(Number(brand_id))) {
        throw new ApiError(400, "brand_id must be a number");
    }

    // uniqueness check
    const conflict = await Brand.findOne({
        $or: [
            { name: { $regex: `^${name.trim()}$`, $options: "i" } },
            ...(brand_id !== undefined ? [{ brand_id: Number(brand_id) }] : []),
        ],
    });
    if (conflict) {
        throw new ApiError(409, "Brand name or ID already exists");
    }

    const brand = await Brand.create({
        name: name.trim(),
        description: description?.trim() || "",
        ...(brand_id !== undefined && { brand_id: Number(brand_id) }),
    });

    res.status(201).json(
        new ApiResponse(201, brand, "Brand created successfully")
    );
});

// @desc    Update brand
export const updateBrand = asyncHandler(async (req, res) => {
    const rawId = req.params.id?.trim();
    if (!mongoose.isValidObjectId(rawId)) {
        throw new ApiError(400, "Valid Brand ID is required");
    }

    const { name, description, brand_id } = req.body;
    const brand = await Brand.findById(rawId);
    if (!brand) throw new ApiError(404, "Brand not found");
    if (brand_id !== undefined && isNaN(Number(brand_id))) {
        throw new ApiError(400, "brand_id must be a number");
    }

    // uniqueness check
    const conflict = await Brand.findOne({
        _id: { $ne: rawId },
        $or: [
            ...(name
                ? [{ name: { $regex: `^${name.trim()}$`, $options: "i" } }]
                : []),
            ...(brand_id !== undefined ? [{ brand_id: Number(brand_id) }] : []),
        ],
    });
    if (conflict) {
        throw new ApiError(409, "Brand name or ID already exists");
    }

    // build update payload
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (brand_id !== undefined) updateData.brand_id = Number(brand_id);

    const updated = await Brand.findByIdAndUpdate(
        rawId,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    res.status(200).json(
        new ApiResponse(200, updated, "Brand updated successfully")
    );
});

// @desc    Delete brand
export const deleteBrand = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        throw new ApiError(400, "Valid Brand ID is required");
    }

    // Prevent deletion if products reference this brand
    const linked = await Product.countDocuments({ brand: id });
    if (linked) {
        throw new ApiError(
            400,
            `Cannot delete; ${linked} products linked to this brand`
        );
    }

    const deleted = await Brand.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Brand not found");

    res.status(200).json(
        new ApiResponse(200, {}, "Brand deleted successfully")
    );
});
