import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { Review } from "../models/review.model.js";

// Helpers
const isAdminRole = (user) => {
    const role = user?.role;
    return (
        typeof role === "string" &&
        ["admin", "super-admin", "sub-admin"].includes(role.toLowerCase())
    );
};
const ensureOwnerOrAdmin = (review, user) => {
    const isOwner = String(review.userId) === String(user?._id);
    if (!isOwner && !isAdminRole(user)) {
        throw new ApiError(403, "Not authorized");
    }
};

// @desc    Create new review
// @route   POST /api/v1/reviews
// @access  Auth
export const createReview = asyncHandler(async (req, res) => {
    const { productId, rating, comment } = req.body;
    if (!productId) throw new ApiError(400, "productId is required");
    if (rating == null) throw new ApiError(400, "rating is required");

    const review = await Review.create({
        userId: req.user._id,
        productId,
        rating,
        comment,
    });

    return res.status(201).json(new ApiResponse(201, review, "Review created"));
});

// @desc    Get reviews list (filter by productId or userId)
// @route   GET /api/v1/reviews?productId=...&userId=...&page=1&limit=10
// @access  Public
export const getReviews = asyncHandler(async (req, res) => {
    const { productId, userId } = req.query;
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.max(parseInt(req.query.limit || "10", 10), 1);
    const skip = (page - 1) * limit;

    const filter = {};
    if (productId) filter.productId = productId;
    if (userId) filter.userId = userId;

    const [items, total] = await Promise.all([
        Review.find(filter)
            .populate("userId", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit),
        Review.countDocuments(filter),
    ]);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                reviews: items,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            },
            "Reviews fetched"
        )
    );
});

// @desc    Get a single review by its id
// @route   GET /api/v1/reviews/:id
// @access  Public
export const getReviewById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const review = await Review.findById(id).populate("userId", "name");
    if (!review) throw new ApiError(404, "Review not found");
    return res.status(200).json(new ApiResponse(200, review, "Review fetched"));
});

// @desc    Get reviews for a product
// @route   GET /api/v1/reviews/product/:productId
// @access  Public
export const getReviewsByProduct = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ productId: req.params.productId })
        .populate("userId", "name")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, reviews, "Product reviews fetched"));
});

// @desc    Get reviews for a user
// @route   GET /api/v1/reviews/user/:userId
// @access  Public
export const getReviewsByUser = asyncHandler(async (req, res) => {
    const reviews = await Review.find({ userId: req.params.userId })
        .populate("userId", "name")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, reviews, "User reviews fetched"));
});

// @desc    Update a review (owner or admin)
// @route   PATCH /api/v1/reviews/:id
// @access  Auth (owner) or Admin
export const updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) throw new ApiError(404, "Review not found");

    ensureOwnerOrAdmin(review, req.user);

    if (rating != null) review.rating = rating;
    if (comment != null) review.comment = comment;

    await review.save();

    const populated = await Review.findById(review._id).populate(
        "userId",
        "name"
    );
    return res
        .status(200)
        .json(new ApiResponse(200, populated, "Review updated successfully"));
});

// @desc    Delete a review by ID
// @route   DELETE /api/v1/reviews/:id
// @access  Auth (owner) or Admin
export const deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    if (!id) throw new ApiError(400, "Review id is required");

    const review = await Review.findById(id);
    if (!review) throw new ApiError(404, "Review not found");

    ensureOwnerOrAdmin(review, req.user);

    await review.deleteOne();

    return res
        .status(200)
        .json(new ApiResponse(200, { _id: id }, "Review deleted successfully"));
});
