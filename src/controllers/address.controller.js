import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";
import { Address } from "../models/address.model.js";

// @desc    Add a new address
export const createAddress = asyncHandler(async (req, res) => {
    const {
        name,
        phoneNumber,
        address,
        address2,
        zipCode,
        landmark,
        state,
        country,
    } = req.body;
    const userId = req.user._id; // Requires auth middleware

    // required fields
    if (![name, address, zipCode, state, country].every(Boolean)) {
        throw new ApiError(
            400,
            "Name, address, zip code, state, and country are required"
        );
    }

    const newAddress = await Address.create({
        userId,
        name: name.trim(),
        phoneNumber: phoneNumber?.trim() || "",
        address: address.trim(),
        address2: address2?.trim() || "",
        zipCode: zipCode.trim(),
        landmark: landmark?.trim() || "",
        state: state.trim(),
        country: country.trim(),
    });

    res.status(201).json(
        new ApiResponse(201, newAddress, "Address added successfully")
    );
});

// @desc    Get all addresses for current user
export const getAddresses = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const addresses = await Address.find({ userId });
    res.status(200).json(new ApiResponse(200, addresses, "Addresses fetched"));
});

// @desc    Get a single address by ID
export const getAddressById = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Invalid address ID");

    const address = await Address.findOne({ _id: id, userId: req.user._id });
    if (!address) throw new ApiError(404, "Address not found");

    res.status(200).json(new ApiResponse(200, address, "Address fetched"));
});

// @desc    Update an address
export const updateAddress = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Invalid address ID");

    const {
        name,
        phoneNumber,
        address,
        address2,
        zipCode,
        landmark,
        state,
        country,
    } = req.body;
    const existingAddress = await Address.findOne({
        _id: id,
        userId: req.user._id,
    });
    if (!existingAddress) throw new ApiError(404, "Address not found");

    if (name) existingAddress.name = name.trim();
    if (phoneNumber) existingAddress.phoneNumber = phoneNumber.trim();
    if (address) existingAddress.address = address.trim();
    if (address2) existingAddress.address2 = address2.trim();
    if (zipCode) existingAddress.zipCode = zipCode.trim();
    if (landmark) existingAddress.landmark = landmark.trim();
    if (state) existingAddress.state = state.trim();
    if (country) existingAddress.country = country.trim();

    await existingAddress.save();

    res.status(200).json(
        new ApiResponse(200, existingAddress, "Address updated")
    );
});

// @desc    Delete an address
export const deleteAddress = asyncHandler(async (req, res) => {
    const id = req.params.id?.trim();
    if (!mongoose.isValidObjectId(id))
        throw new ApiError(400, "Invalid address ID");

    const address = await Address.findOneAndDelete({
        _id: id,
        userId: req.user._id,
    });
    if (!address) throw new ApiError(404, "Address not found");

    res.status(200).json(new ApiResponse(200, {}, "Address deleted"));
});
