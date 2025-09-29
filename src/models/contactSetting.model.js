import mongoose from "mongoose";

const ContactSettingSchema = new mongoose.Schema(
    {
        headline: { type: String, trim: true, default: "Get in touch" },
        subheading: { type: String, trim: true },
        address: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true },
        hours: { type: String, trim: true },
        mapEmbed: { type: String, trim: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

ContactSettingSchema.index({ createdAt: -1 });
export default mongoose.model("ContactSetting", ContactSettingSchema);
