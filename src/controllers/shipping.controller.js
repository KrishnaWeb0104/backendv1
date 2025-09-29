import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import Shipping from "../models/shipping.model.js";
import { Order } from "../models/order.model.js";
import { Address } from "../models/address.model.js";
import mongoose from "mongoose";

export const createShipping = asyncHandler(async (req, res) => {
    const { orderId, address, carrier, trackingNumber, trackingUrl, notes } =
        req.body;

    if (!orderId || !mongoose.isValidObjectId(orderId))
        throw new ApiError(400, "Order ID is required and must be valid");
    if (!carrier || !trackingNumber)
        throw new ApiError(400, "Carrier and tracking number are required");
    if (address && !mongoose.isValidObjectId(address))
        throw new ApiError(400, "Address ID must be valid");

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    if (address) {
        const addressExists = await Address.findById(address);
        if (!addressExists) throw new ApiError(404, "Address not found");
    }

    const exists = await Shipping.findOne({ orderId });
    if (exists)
        throw new ApiError(409, "Shipping entry already exists for this order");

    const shipping = await Shipping.create({
        orderId,
        address,
        carrier,
        trackingNumber,
        trackingUrl,
        notes,
        shippedAt: new Date(),
        status: "in_transit",
    });

    res.status(201).json(
        new ApiResponse(201, shipping, "Shipping entry created")
    );
});

export const getShippingByOrder = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId?.trim();
    if (!mongoose.isValidObjectId(orderId))
        throw new ApiError(400, "Invalid order ID");

    const shipping = await Shipping.findOne({ orderId })
        .populate("orderId")
        .populate("address");
    if (!shipping) throw new ApiError(404, "Shipping info not found");
    res.status(200).json(
        new ApiResponse(200, shipping, "Shipping info fetched")
    );
});

export const updateShipping = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId?.trim();
    if (!mongoose.isValidObjectId(orderId))
        throw new ApiError(400, "Invalid order ID");
    const { status, deliveredAt, trackingUrl, notes, address } = req.body;

    const shipping = await Shipping.findOne({ orderId });
    if (!shipping) throw new ApiError(404, "Shipping info not found");

    if (status) shipping.status = status;
    if (trackingUrl !== undefined) shipping.trackingUrl = trackingUrl;
    if (notes !== undefined) shipping.notes = notes;
    if (status === "delivered")
        shipping.deliveredAt = deliveredAt || new Date();
    if (address) {
        if (!mongoose.isValidObjectId(address))
            throw new ApiError(400, "Address ID must be valid");
        const addressExists = await Address.findById(address);
        if (!addressExists) throw new ApiError(404, "Address not found");
        shipping.address = address;
    }

    await shipping.save();

    res.status(200).json(
        new ApiResponse(200, shipping, "Shipping info updated")
    );
});

export const deleteShipping = asyncHandler(async (req, res) => {
    const orderId = req.params.orderId?.trim();
    if (!mongoose.isValidObjectId(orderId))
        throw new ApiError(400, "Invalid order ID");

    const shipping = await Shipping.findOneAndDelete({ orderId });
    if (!shipping) throw new ApiError(404, "Shipping info not found");
    res.status(200).json(new ApiResponse(200, {}, "Shipping info deleted"));
});

export const getAllShipping = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;
    const shippingList = await Shipping.find(query)
        .sort({ createdAt: -1 })
        .populate("orderId")
        .populate("address");
    res.status(200).json(
        new ApiResponse(200, shippingList, "All shipping info fetched")
    );
});
