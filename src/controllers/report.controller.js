import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Order } from "../models/order.model.js";
import Payment from "../models/payment.model.js";
import Product from "../models/product.models.js";

export const getCustomerReport = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const query = { role: "customer" };
    if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) query.createdAt.$lte = new Date(to);
    }
    const customers = await User.find(query).sort({ createdAt: -1 });
    res.status(200).json(
        new ApiResponse(200, customers, "Customer report fetched")
    );
});

export const getOrderReport = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const query = {};
    if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) query.createdAt.$lte = new Date(to);
    }
    const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .populate("userId");
    res.status(200).json(new ApiResponse(200, orders, "Order report fetched"));
});

export const getPaymentReport = asyncHandler(async (req, res) => {
    const { from, to } = req.query;
    const query = {};
    if (from || to) {
        query.createdAt = {};
        if (from) query.createdAt.$gte = new Date(from);
        if (to) query.createdAt.$lte = new Date(to);
    }
    const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .populate("orderId userId");
    res.status(200).json(
        new ApiResponse(200, payments, "Payment report fetched")
    );
});

export const getDashboardCounts = asyncHandler(async (_req, res) => {
    const [totalProducts, totalOrders, totalCustomers, revenueAgg] =
        await Promise.all([
            Product.countDocuments({}),
            Order.countDocuments({}),
            User.countDocuments({ role: "CUSTOMER" }),
            Payment.aggregate([
                { $match: { status: "paid" } },
                { $group: { _id: null, total: { $sum: "$amount" } } },
            ]),
        ]);

    const totals = {
        products: totalProducts,
        orders: totalOrders,
        customers: totalCustomers,
        revenue: revenueAgg?.[0]?.total || 0,
    };

    return res
        .status(200)
        .json(new ApiResponse(200, totals, "Dashboard counts fetched"));
});

export const getTopProducts = asyncHandler(async (req, res) => {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 5));

    const top = await Order.aggregate([
        { $unwind: "$items" },
        {
            $group: {
                _id: "$items.productId",
                qty: { $sum: "$items.quantity" },
            },
        },
        { $sort: { qty: -1 } },
        { $limit: limit },
    ]);

    const ids = top.map((t) => t._id).filter(Boolean);
    const products = ids.length
        ? await Product.find({ _id: { $in: ids } }).select("name sku")
        : [];
    const map = new Map(products.map((p) => [String(p._id), p]));

    const result = top.map((t) => ({
        productId: t._id,
        name: map.get(String(t._id))?.name || "Unknown",
        sku: map.get(String(t._id))?.sku || "",
        quantity: t.qty,
    }));

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Top products fetched"));
});
