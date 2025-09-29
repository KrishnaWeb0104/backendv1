import Razorpay from "razorpay";
import crypto from "crypto";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Payment from "../models/payment.model.js";
import { Order } from "../models/order.model.js";

// 🔵 Create Razorpay Order
export const createOrder = asyncHandler(async (req, res) => {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
        throw new ApiError(400, "Amount must be a positive number");
    }

    const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json(
        new ApiResponse(200, { order }, "Razorpay order created successfully")
    );
});

// 🟢 Verify Payment (Frontend)
export const verifyPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
        req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new ApiError(400, "Missing Razorpay credentials");
    }

    const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        throw new ApiError(400, "Invalid payment signature");
    }

    res.status(200).json(
        new ApiResponse(200, {}, "Payment verified successfully")
    );
});

// 🟣 Webhook for Razorpay
export const webhookVerification = asyncHandler(async (req, res) => {
    const signature = req.headers["x-razorpay-signature"];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const body = JSON.stringify(req.body);

    const expectedSignature = crypto
        .createHmac("sha256", secret)
        .update(body)
        .digest("hex");

    if (signature !== expectedSignature) {
        throw new ApiError(400, "Invalid webhook signature");
    }

    if (req.body.event === "payment.captured") {
        const payment = req.body.payload.payment.entity;

        const existing = await Payment.findOne({ paymentId: payment.id });
        if (existing) {
            return res
                .status(200)
                .json({ success: true, message: "Already processed" });
        }

        const newPayment = await Payment.create({
            orderId: payment.notes?.orderId, // <-- you can set this in frontend when creating payment
            paymentId: payment.id,
            amount: payment.amount / 100,
            currency: payment.currency,
            method: "online",
            status: payment.status,
            processedBy: req.user?._id || null,
        });

        await Order.findByIdAndUpdate(payment.notes?.orderId, {
            paymentStatus: "paid",
        });

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { payment: newPayment },
                    "Webhook processed"
                )
            );
    }

    res.status(200).json({ success: true });
});

// 🟡 Handle Cash Payments
export const processCashPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) throw new ApiError(400, "Order ID is required");

    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");

    if (order.paymentStatus === "paid") {
        throw new ApiError(400, "Order already paid");
    }

    const payment = await Payment.create({
        orderId,
        paymentId: `cash_${Date.now()}`,
        amount: order.totalAmount,
        currency: "INR",
        method: "cash",
        status: "paid",
        processedBy: req.user?._id,
    });

    order.paymentStatus = "paid";
    await order.save();

    res.status(200).json(
        new ApiResponse(200, { payment }, "Cash payment successful")
    );
});
