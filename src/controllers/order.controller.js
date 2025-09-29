import { Order } from "../models/order.model.js";
import Product from "../models/product.models.js";
import mongoose from "mongoose";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Shipping from "../models/shipping.model.js";
import { Address } from "../models/address.model.js";
import {
    sendEmail,
    orderCancelledMailgenContent,
    orderConfirmationMailgenContent,
    orderReturnRequestedMailgenContent,
} from "../utils/mail.js";

export const createOrder = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0)
        throw new ApiError(400, "Items are required to create an order");

    if (!shippingAddress || !mongoose.isValidObjectId(shippingAddress))
        throw new ApiError(
            400,
            "Shipping address ID is required and must be valid"
        );

    if (!paymentMethod || !["cod", "online"].includes(paymentMethod))
        throw new ApiError(400, "Payment method is required and must be 'cod' or 'online'");

    let totalAmount = 0;

    for (const item of items) {
        const product = await Product.findById(item.productId);
        if (!product) throw new ApiError(404, `Product not found`);
        if (item.quantity <= 0)
            throw new ApiError(400, `Invalid quantity for product`);
        if (item.quantity > product.stock_quantity)
            throw new ApiError(400, `Insufficient stock for product`);
        totalAmount += item.quantity * parseFloat(product.price.toString());
    }

    for (const item of items) {
        await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock_quantity: -item.quantity },
        });
    }

    const order = await Order.create({
        userId,
        items,
        totalAmount,
        shippingAddress,
        paymentMethod,
    });

    console.log("Order created for user:", userId, "order ID:", order._id, "items:", items.length);

    if (!order) throw new ApiError(500, "Failed to create order");

    // Send email asynchronously to not block order creation
    setImmediate(async () => {
        try {
            await sendEmail({
                email: req.user.email,
                subject: "Order Confirmed – Thanks for shopping with us!",
                mailgenContent: orderConfirmationMailgenContent(
                    req.user.fullName,
                    order
                ),
            });
        } catch (err) {
            console.error("Order email send error:", err);
        }
    });

    res.status(201).json(
        new ApiResponse(
            201,
            order,
            "Order created successfully & confirmation email sent"
        )
    );
});

export const getUserOrders = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    console.log("Fetching orders for user:", userId);
    const orders = await Order.find({ userId })
        .populate("items.productId")
        .populate("shippingAddress")
        .populate({
            path: "userId",
            select: "-password -refreshToken -role -emailVerificationToken -emailVerificationExpiry -forgotPasswordToken -forgotPasswordExpiry",
        });

    console.log("Found orders count:", orders.length);

    // For each order, enrich shippingAddress if no Shipping doc
    for (const order of orders) {
        try {
            const shippingDoc = await Shipping.findOne({
                orderId: order._id,
            }).populate({
                path: "address",
                select: "name phoneNumber address address2 zipCode landmark state country",
            });
            if (shippingDoc) {
                order.shippingAddress = shippingDoc;
            }
            // Else, shippingAddress is already populated as Address
        } catch (e) {
            console.warn("shippingAddress enrichment skipped for order:", order._id, e?.message);
        }
    }

    res.status(200).json(
        new ApiResponse(200, orders, "Orders retrieved successfully")
    );
});

export const getOrderById = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();
    if (!id || !mongoose.isValidObjectId(id))
        throw new ApiError(400, "Invalid order ID");

    let order = await Order.findById(id).populate("items.productId").populate({
        path: "userId",
        select: "fullName userName email phone",
    });

    if (!order) throw new ApiError(404, "Order not found");

    // Check if user owns the order or is admin
    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== "ADMIN" && req.user.role !== "SUPER_ADMIN") {
        throw new ApiError(403, "You are not authorized to view this order");
    }

    // Enrich shippingAddress for UI:
    // 1) If a Shipping doc exists for this order, prefer it and populate its address.
    // 2) Else, populate the shippingAddress as Address.
    try {
        const shippingDoc = await Shipping.findOne({
            orderId: order._id,
        }).populate({
            path: "address",
            select: "name phoneNumber address address2 zipCode landmark state country",
        });
        if (shippingDoc) {
            order.shippingAddress = shippingDoc;
        } else {
            // Populate the shippingAddress directly as Address
            await order.populate({
                path: "shippingAddress",
                select: "name phoneNumber address address2 zipCode landmark state country",
            });
        }
    } catch (e) {
        // non-fatal; keep original order if enrichment fails
        console.warn("shippingAddress enrichment skipped:", e?.message);
    }

    res.status(200).json(
        new ApiResponse(200, order, "Order retrieved successfully")
    );
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();
    const { status } = req.body;
    if (!id || !mongoose.isValidObjectId(id) || !status)
        throw new ApiError(400, "Order ID and status are required");

    const order = await Order.findOneAndUpdate(
        {
            _id: id,
            userId: req.user._id,
        },
        { status },
        { new: true }
    );

    if (!order) throw new ApiError(404, "Order not found");

    res.status(200).json(
        new ApiResponse(200, order, "Order status updated successfully")
    );
});

export const deleteOrder = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();
    if (!id || !mongoose.isValidObjectId(id))
        throw new ApiError(400, "Order ID is required");

    const order = await Order.findOneAndDelete({
        _id: id,
        userId: req.user._id,
    });

    if (!order)
        return res
            .status(404)
            .json(new ApiResponse(404, null, "Order not found."));

    res.status(200).json(
        new ApiResponse(200, null, "Order deleted successfully")
    );
});

export const updateOrder = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();
    const { items, shippingAddress } = req.body;

    if (!id || !mongoose.isValidObjectId(id))
        throw new ApiError(400, "Invalid order ID");

    const order = await Order.findById(id);
    if (!order) throw new ApiError(404, "Order not found");
    if (order.userId.toString() !== req.user._id.toString())
        throw new ApiError(403, "You are not authorized to update this order");

    // Validate and check stock if items are being updated
    if (items) {
        for (const item of items) {
            if (!item.productId || !mongoose.isValidObjectId(item.productId))
                throw new ApiError(400, "Invalid product ID");

            const product = await Product.findById(item.productId);
            if (!product)
                throw new ApiError(404, `Product not found: ${item.productId}`);
            if (item.quantity > product.stock_quantity)
                throw new ApiError(
                    400,
                    `Requested quantity exceeds stock for product: ${product.name}`
                );
        }
        order.items = items;
    }

    if (shippingAddress) {
        if (!mongoose.isValidObjectId(shippingAddress))
            throw new ApiError(400, "Invalid shipping address ID");
        order.shippingAddress = shippingAddress;
    }

    await order.save();

    res.status(200).json(
        new ApiResponse(200, order, "Order updated successfully")
    );
});

export const returnOrder = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();
    const { reason } = req.body;

    if (!id || !mongoose.isValidObjectId(id))
        throw new ApiError(400, "Invalid order ID");

    const order = await Order.findOne({
        _id: id,
        userId: req.user._id,
        status: "delivered",
    });

    if (!order)
        throw new ApiError(
            404,
            "Delivered order not found or not eligible for return"
        );

    order.returnStatus = "requested";
    order.returnReason = reason || "";
    await order.save();

    // Send email asynchronously
    setImmediate(async () => {
        try {
            await sendEmail({
                email: req.user.email,
                subject: "Return Request Received – Marwar Saheli",
                mailgenContent: orderReturnRequestedMailgenContent(
                    req.user.fullName,
                    order,
                    reason
                ),
            });
        } catch (err) {
            console.error("Return order email error:", err);
        }
    });

    res.status(200).json(
        new ApiResponse(200, order, "Return request submitted")
    );
});

export const cancelOrder = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();

    if (!id || !mongoose.isValidObjectId(id))
        throw new ApiError(400, "Invalid order ID");

    const order = await Order.findOne({
        _id: id,
        userId: req.user._id,
        status: { $in: ["pending", "processing"] },
    });

    if (!order)
        throw new ApiError(404, "Order not found or cannot be cancelled");

    order.status = "cancelled";
    await order.save();

    // Restock products
    for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
            $inc: { stock_quantity: item.quantity },
        });
    }

    // Send email asynchronously
    setImmediate(async () => {
        try {
            await sendEmail({
                email: req.user.email,
                subject: "Order Cancelled",
                mailgenContent: orderCancelledMailgenContent(
                    req.user.fullName,
                    order
                ),
            });
        } catch (err) {
            console.error("Order cancellation email error:", err);
        }
    });

    res.status(200).json(
        new ApiResponse(200, order, "Order cancelled successfully")
    );
});
