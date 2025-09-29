import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Story from "../models/story.model.js";
import mongoose from "mongoose";

// @desc Get all stories (pagination + search)
export const getStories = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    if (search) {
        query.$or = [
            { title: { $regex: search, $options: "i" } },
            { content: { $regex: search, $options: "i" } },
        ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [stories, total] = await Promise.all([
        Story.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit)),
        Story.countDocuments(query),
    ]);

    const pagination = {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalStories: total,
        hasNextPage: Number(page) < Math.ceil(total / limit),
        hasPrevPage: Number(page) > 1,
    };

    res.status(200).json(
        new ApiResponse(200, { stories, pagination }, "Stories fetched")
    );
});

// @desc Get single story
export const getStoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Valid Story ID required");

    const story = await Story.findById(id);
    if (!story) throw new ApiError(404, "Story not found");

    res.status(200).json(
        new ApiResponse(200, story, "Story fetched successfully")
    );
});

// @desc Create new story
export const createStory = asyncHandler(async (req, res) => {
    const { title, content, date } = req.body;

    if (!title?.trim()) throw new ApiError(400, "Title is required");
    if (!content?.trim()) throw new ApiError(400, "Content is required");

    // Uniqueness by title
    const existing = await Story.findOne({ title: title.trim() });
    if (existing) throw new ApiError(409, "Title already exists");

    let imageUrl = "";
    if (req.file) {
        const { url } = await uploadOnCloudinary(req.file.path);
        imageUrl = url;
    }

    const story = await Story.create({
        title: title.trim(),
        content: content.trim(),
        date: date ? new Date(date) : undefined,
        image: imageUrl,
    });

    res.status(201).json(
        new ApiResponse(201, story, "Story created successfully")
    );
});

// @desc Update story
export const updateStory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Valid Story ID required");

    const story = await Story.findById(id);
    if (!story) throw new ApiError(404, "Story not found");

    const { title, content, date, isActive } = req.body;

    // Title uniqueness (if changed)
    if (title && title.trim() !== story.title) {
        const exists = await Story.findOne({
            title: title.trim(),
            _id: { $ne: id },
        });
        if (exists) throw new ApiError(409, "Title already exists");
        story.title = title.trim();
    }
    if (content) story.content = content.trim();
    if (date) story.date = new Date(date);
    if (typeof isActive === "boolean") story.isActive = isActive;

    if (req.file) {
        const { url } = await uploadOnCloudinary(req.file.path);
        story.image = url;
    }

    await story.save();

    res.status(200).json(
        new ApiResponse(200, story, "Story updated successfully")
    );
});

// @desc Delete story
export const deleteStory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Valid Story ID required");

    const deleted = await Story.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, "Story not found");

    res.status(200).json(
        new ApiResponse(200, {}, "Story deleted successfully")
    );
});
