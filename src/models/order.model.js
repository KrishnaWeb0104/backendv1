// src/models/order.models.js
import mongoose from "mongoose";
import { Address } from "./address.model.js";

const orderSchema = new mongoose.Schema(
    {
        // optional numeric ID if you need it
        // order_id: {
        //     type: Number,
        //     unique: true,
        // },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                quantity: {
                    // Add quantity field
                    type: Number,
                    required: true,
                    min: 1,
                    default: 1,
                },
            },
        ],
        totalAmount: {
            type: mongoose.Decimal128,
            required: true,
            get: (v) => parseFloat(v.toString()),
            set: (v) =>
                mongoose.Types.Decimal128.fromString(Number(v).toFixed(2)),
        },
        status: {
            type: String,
            enum: [
                "pending",
                "processing",
                "shipped",
                "delivered",
                "cancelled",
            ],
            default: "pending",
        },
        orderDate: {
            type: Date,
            default: Date.now,
        },
        shippingAddress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address",
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ["cod", "online"],
            required: true,
            default: "cod",
        },
        returnStatus: {
            type: String,
            enum: ["none", "requested", "approved", "rejected", "returned"],
            default: "none",
        },
        returnReason: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    }
);

export const Order = mongoose.model("Order", orderSchema);
