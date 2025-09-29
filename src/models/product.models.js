import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
    {
        // optional numeric ID (you can drop this and just use _id)
        product_id: {
            type: Number,
            unique: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },

        price: {
            type: mongoose.Decimal128,
            required: true,
            get: (v) => parseFloat(v.toString()),
            set: (v) =>
                mongoose.Types.Decimal128.fromString(Number(v).toFixed(2)),
        },
        discount: {
            type: Number,
        },

        stock_quantity: {
            type: Number,
            default: 0,
            min: 0,
        },
        sku: {
            type: String,
            unique: true,
            trim: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
        },
        brand: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Brand",
        },

        image_url: {
            type: String,
            default: "",
            trim: true,
        },
        additional_images: {
            type: [String],
            default: [],
        },

        weight: {
            type: mongoose.Decimal128,
            get: (v) => (v ? parseFloat(v.toString()) : undefined),
            set: (v) =>
                mongoose.Types.Decimal128.fromString(Number(v).toFixed(2)),
        },
        dimensions: {
            type: String,
            trim: true,
            default: "",
        },
        color: {
            type: String,
            trim: true,
            default: "",
        },
        size: {
            type: String,
            trim: true,
            default: "",
        },

        status: {
            type: String,
            enum: ["active", "inactive", "archived"],
            default: "active",
        },
        rating: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Review",
        },
    },
    {
        timestamps: true,
        toJSON: { getters: true },
        toObject: { getters: true },
    }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
