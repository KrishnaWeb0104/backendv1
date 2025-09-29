import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Page from "../models/page.model.js";

// @desc    Create new CMS page
export const createPage = asyncHandler(async (req, res) => {
    const { title, slug, content } = req.body;
    if (!title?.trim()) throw new ApiError(400, "Title is required");
    if (!slug?.trim()) throw new ApiError(400, "Slug is required");

    const exists = await Page.findOne({ slug: slug.trim().toLowerCase() });
    if (exists) throw new ApiError(409, "Slug already exists");

    const page = await Page.create({
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        content,
    });

    res.status(201).json(
        new ApiResponse(201, page, "Page created successfully")
    );
});

// @desc    Get all CMS pages (with optional status filter)
export const getPages = asyncHandler(async (req, res) => {
    const { isActive } = req.query;
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === "true";
    const pages = await Page.find(query).sort({ createdAt: -1 });
    res.status(200).json(
        new ApiResponse(200, pages, "Pages fetched successfully")
    );
});

// @desc    Get single CMS page by slug
export const getPageBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const page = await Page.findOne({ slug: slug.toLowerCase() });
    if (!page) throw new ApiError(404, "Page not found");
    res.status(200).json(
        new ApiResponse(200, page, "Page fetched successfully")
    );
});

// @desc    Update CMS page
export const updatePage = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const { title, slug: newSlug, content, isActive } = req.body;

    const page = await Page.findOne({ slug: slug.toLowerCase() });
    if (!page) throw new ApiError(404, "Page not found");

    // If slug is being updated, check for conflicts
    if (newSlug && newSlug.trim().toLowerCase() !== page.slug) {
        const existingPage = await Page.findOne({ slug: newSlug.trim().toLowerCase() });
        if (existingPage) {
            throw new ApiError(409, "This slug is already in use.");
        }
        page.slug = newSlug.trim().toLowerCase();
    }

    if (title) page.title = title.trim();
    if (content !== undefined) page.content = content;
    if (isActive !== undefined) page.isActive = isActive;

    await page.save();

    res.status(200).json(
        new ApiResponse(200, page, "Page updated successfully")
    );
});

// @desc    Activate/deactivate CMS page
export const togglePageStatus = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const page = await Page.findOne({ slug: slug.toLowerCase() });
    if (!page) throw new ApiError(404, "Page not found");
    page.isActive = !page.isActive;
    await page.save();
    res.status(200).json(new ApiResponse(200, page, "Page status updated"));
});

// @desc    Delete CMS page
export const deletePage = asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const page = await Page.findOneAndDelete({ slug: slug.toLowerCase() });
    if (!page) throw new ApiError(404, "Page not found");
    res.status(200).json(new ApiResponse(200, {}, "Page deleted successfully"));
});
