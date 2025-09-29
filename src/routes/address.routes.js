import express from "express";
import {
    createAddress,
    getAddresses,
    getAddressById,
    updateAddress,
    deleteAddress,
} from "../controllers/address.controller.js";
import { verifyJWT } from "../middlewares/auth.js";

const router = express.Router();

router.post("/create-address/", verifyJWT, createAddress);
router.get("/get-addresses/", verifyJWT, getAddresses);
router.get("/get-address/:id", verifyJWT, getAddressById);
router.put("/update-address/:id", verifyJWT, updateAddress);
router.delete("/delete-address/:id", verifyJWT, deleteAddress);

export default router;
