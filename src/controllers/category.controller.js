// src/controllers/category.controller.js
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { Category } from "../models/category.models.js";
import Product from "../models/product.models.js";
import mongoose from "mongoose";

// GET /api/categories
export const getCategories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { slug: { $regex: search, $options: "i" } },
        ];
    }
    const skip = (page - 1) * limit;
    const [categories, total] = await Promise.all([
        Category.find(query)
            .skip(skip)
            .limit(Number(limit))
            .sort({ createdAt: -1 }),
        Category.countDocuments(query),
    ]);
    const pagination = {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalCategories: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };
    res.status(200).json(
        new ApiResponse(
            200,
            { categories, pagination },
            "Categories fetched successfully"
        )
    );
});

// GET /api/categories/:id
export const getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Valid Category ID is required");
    const category = await Category.findById(id);
    if (!category) throw new ApiError(404, "Category not found");
    res.status(200).json(
        new ApiResponse(200, category, "Category fetched successfully")
    );
});

// POST /api/categories/add-category
export const createCategory = asyncHandler(async (req, res) => {
    const { name, description, slug, category_id, image } = req.body;
    if (!name?.trim()) throw new ApiError(400, "Category name is required");
    if (category_id !== undefined && isNaN(Number(category_id))) {
        throw new ApiError(400, "category_id must be a number");
    }
    const categorySlug =
        slug?.trim() ||
        name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

    // check uniqueness
    const conflict = await Category.findOne({
        $or: [
            { name: { $regex: `^${name.trim()}$`, $options: "i" } },
            { slug: categorySlug },
            ...(category_id !== undefined
                ? [{ category_id: Number(category_id) }]
                : []),
        ],
    });
    if (conflict)
        throw new ApiError(409, "Category name, slug, or ID already exists");

    // image upload
    let imageUrl = "";
    if (req.files?.image?.[0]) {
        try {
            const { url } = await uploadOnCloudinary(req.files.image[0].path);
            imageUrl = url || "";
        } catch (err) {
            console.error("Cloudinary error:", err);
        }
    }

    const category = await Category.create({
        name: name.trim(),
        slug: categorySlug,
        description: description?.trim() || "",
        image: imageUrl,
        ...(category_id !== undefined && { category_id: Number(category_id) }),
    });

    res.status(201).json(
        new ApiResponse(201, category, "Category created successfully")
    );
});

// PATCH /api/categories/update-category/:id
export const updateCategory = asyncHandler(async (req, res) => {
    const rawId = req.params.id?.trim();
    if (!mongoose.isValidObjectId(rawId))
        throw new ApiError(400, "Valid Category ID is required");

    const { name, description, slug, category_id } = req.body;
    const category = await Category.findById(rawId);
    if (!category) throw new ApiError(404, "Category not found");
    if (category_id !== undefined && isNaN(Number(category_id))) {
        throw new ApiError(400, "category_id must be a number");
    }

    const updatedSlug =
        slug?.trim() ||
        (name
            ? name
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/(^-|-$)/g, "")
            : category.slug);

    const conflict = await Category.findOne({
        _id: { $ne: rawId },
        $or: [
            ...(name
                ? [{ name: { $regex: `^${name.trim()}$`, $options: "i" } }]
                : []),
            { slug: updatedSlug },
            ...(category_id !== undefined
                ? [{ category_id: Number(category_id) }]
                : []),
        ],
    });
    if (conflict)
        throw new ApiError(409, "Category name, slug, or ID already exists");

    // image upload
    let newImage = category.image;
    if (req.files?.image?.[0]) {
        try {
            const { url } = await uploadOnCloudinary(req.files.image[0].path);
            if (url) newImage = url;
        } catch (err) {
            console.error("Cloudinary error:", err);
        }
    }

    // build update payload
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (slug || name) updateData.slug = updatedSlug;
    if (description !== undefined) updateData.description = description.trim();
    if (newImage !== category.image) updateData.image = newImage;
    if (category_id !== undefined) updateData.category_id = Number(category_id);

    const updated = await Category.findByIdAndUpdate(
        rawId,
        { $set: updateData },
        { new: true, runValidators: true }
    );

    res.status(200).json(
        new ApiResponse(200, updated, "Category updated successfully")
    );
});

// DELETE /api/categories/delete-category/:id
export const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Valid Category ID is required");
    const linked = await Product.countDocuments({ category: id });
    if (linked)
        throw new ApiError(
            400,
            `Cannot delete; ${linked} products linked to this category`
        );
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Category not found");
    res.status(200).json(
        new ApiResponse(200, {}, "Category deleted successfully")
    );
});

// GET /api/categories/:id/products
export const getCategoryProducts = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Valid Category ID is required");
    const category = await Category.findById(id);
    if (!category) throw new ApiError(404, "Category not found");

    const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };

    const [products, total] = await Promise.all([
        Product.find({ category: id })
            .populate("category")
            .skip(skip)
            .limit(Number(limit))
            .sort(sort),
        Product.countDocuments({ category: id }),
    ]);

    const pagination = {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            { category, products, pagination },
            "Category products fetched successfully"
        )
    );
});

// GET /api/categories/:id/stats
export const getCategoryStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Valid Category ID is required");
    const category = await Category.findById(id);
    if (!category) throw new ApiError(404, "Category not found");

    const stats = await Product.aggregate([
        { $match: { category: mongoose.Types.ObjectId(id) } },
        {
            $group: {
                _id: null,
                totalProducts: { $sum: 1 },
                totalStock: { $sum: "$stock" },
                averagePrice: { $avg: "$price" },
                minPrice: { $min: "$price" },
                maxPrice: { $max: "$price" },
                inStockProducts: {
                    $sum: { $cond: [{ $gt: ["$stock", 0] }, 1, 0] },
                },
                outOfStockProducts: {
                    $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] },
                },
            },
        },
    ]);

    const result = stats[0] || {
        totalProducts: 0,
        totalStock: 0,
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        inStockProducts: 0,
        outOfStockProducts: 0,
    };

    res.status(200).json(
        new ApiResponse(
            200,
            { category, stats: result },
            "Category statistics fetched successfully"
        )
    );
});
