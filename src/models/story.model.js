import mongoose from "mongoose";

const StorySchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            minlength: 2,
            maxlength: 180,
        },
        image: {
            type: String,
            default: "",
        },
        date: {
            type: Date,
            default: Date.now,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            minlength: 10,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Story = mongoose.model("Story", StorySchema);
export default Story;
