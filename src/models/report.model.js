import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["customer", "order", "payment"],
            required: true,
        },
        generatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        filters: {
            type: Object,
            default: {},
        },
        reportData: {
            type: Object, // Could be a snapshot, export file link, etc.
            default: {},
        },
    },
    { timestamps: true }
);

const Report = mongoose.model("Report", reportSchema);
export default Report;
