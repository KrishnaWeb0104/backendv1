import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { config } from "dotenv";
config({ path: "../.env" });

const app = express();

// ✨ Multi-origin CORS (supports 2+ frontends) — put this BEFORE routes
const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL_1, // e.g. http://localhost:5173
    process.env.DASHBOARD_FRONTEND, // e.g. http://localhost:5174
].filter(Boolean);

app.use(
    cors({
        origin(origin, cb) {
            // allow server-to-server/no-origin tools (Postman/cURL)
            if (!origin) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            return cb(new Error(`CORS blocked: ${origin}`));
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import healthcheckRouter from "./routes/health.routes.js";
import userRouter from "./routes/user.router.js";
import categoryRouter from "./routes/category.router.js";
import productRouter from "./routes/product.router.js";
import brandRouter from "./routes/brand.routes.js";
import orderRoute from "./routes/order.routes.js";
import reviewRouter from "./routes/review.routes.js";
import pageRouter from "./routes/page.routes.js";
import reportRouter from "./routes/report.routes.js";
import shippingRouter from "./routes/shipping.routes.js";
import cartRouter from "./routes/cart.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js";
import orderRoutes from "./routes/order.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import addressRouter from "./routes/address.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import storyRoutes from "./routes/story.routes.js";
import messageRoutes from "./routes/message.routes.js";
import contactSettingRoutes from "./routes/contactSetting.routes.js";

// routes declaration
app.use("/api/v1/healthcheck", healthcheckRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/brands", brandRouter);
app.use("/api/v1/orders", orderRoute);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/pages", pageRouter);
app.use("/api/v1/reports", reportRouter);
app.use("/api/v1/shipping", shippingRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/wishlist", wishlistRoutes);
app.use("/api/v1/order", orderRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/payment", paymentRoutes);
app.use("/api/v1/address", addressRouter);
app.use("/api/v1/admins", adminRoutes);
app.use("/api/v1/story", storyRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/contact", contactSettingRoutes);

//  centralised error handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message,
        errors: err.errors || [],
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
});

export default app;
