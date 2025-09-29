import mongoose from "mongoose";

export const addressSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phoneNumber: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            required: true,
            trim: true,
        },
        address2: {
            type: String,
            trim: true,
        },
        zipCode: {
            type: String,
            required: true,
            trim: true,
        },
        //City add karni hai isme
        landmark: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        country: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: false }
);

export const Address = mongoose.model("Address", addressSchema);
