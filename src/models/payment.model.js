import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        paymentId: {
            type: String,
            unique: true,
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        method: {
            type: String,
            enum: ["cash", "online"],
            required: true,
        },
        status: {
            type: String,
            enum: ["unpaid", "paid", "failed", "refunded"],
            default: "unpaid",
        },
        processedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
