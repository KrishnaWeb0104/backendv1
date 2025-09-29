import mongoose from "mongoose";

const shippingSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
            unique: true, // one shipping entry per order
        },
        address: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address",
        },
        carrier: {
            type: String,
            trim: true,
            required: true,
        },
        trackingNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        status: {
            type: String,
            enum: [
                "pending",
                "in_transit",
                "delivered",
                "cancelled",
                "returned",
            ],
            default: "pending",
        },
        shippedAt: Date,
        deliveredAt: Date,
        trackingUrl: String, // for clickable tracking
        notes: String, // for admin comments
    },
    { timestamps: true }
);

const Shipping = mongoose.model("Shipping", shippingSchema);
export default Shipping;
