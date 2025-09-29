import mongoose from "mongoose";

const brandSchema = new mongoose.Schema(
    {
        // optional numeric ID
        brand_id: { type: Number, unique: true },

        name: { type: String, required: true, trim: true },
        description: { type: String },
        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

export const Brand = mongoose.model("Brand", brandSchema);
