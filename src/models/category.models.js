// src/models/category.models.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        // optional numeric ID for external refs
        category_id: { type: Number, unique: true },

        name: { type: String, required: true, trim: true },
        slug: { type: String, unique: true, trim: true },
        description: { type: String, default: "", trim: true },
        image: { type: String, default: "" }, // Cloudinary URL
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

// auto-generate slug if missing
categorySchema.pre("save", function (next) {
    if (!this.slug && this.name) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    }
    next();
});

export const Category = mongoose.model("Category", categorySchema);
