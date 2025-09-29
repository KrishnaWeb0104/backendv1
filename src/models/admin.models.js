import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "SUB_ADMIN"],
      required: true,
      default: "ADMIN",
      index: true,
    },
    permissions: {
      type: [
        {
          module: {
            type: String,
            enum: [
              "CMS",
              "CUSTOMERS",
              "CATEGORIES",
              "PRODUCTS",
              "ORDERS",
              "PAYMENTS",
              "SHIPPING",
              "NOTIFICATIONS",
              "REPORTS",
              "CHAT",
              "ADMINS"
            ],
            required: true,
          },
          rights: {
            type: [String],
            enum: ["VIEW", "CREATE", "UPDATE", "DELETE", "ACTIVATE", "DEACTIVATE", "APPROVE", "DISAPPROVE"],
            default: ["VIEW"],
          },
        },
      ],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
