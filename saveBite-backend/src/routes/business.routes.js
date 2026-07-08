import { Router } from "express";

import {
  getBoundary,
  getBusinessStatus,
  getStoresInDong,
  getStoresInRadius,
  searchStoresByName,
  validateBusiness,
} from "../controllers/business.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.post("/business/status", asyncHandler(getBusinessStatus));
router.post("/business/validate", asyncHandler(validateBusiness));
router.get("/commercial-stores/search", asyncHandler(searchStoresByName));
router.get("/commercial-stores/radius", asyncHandler(getStoresInRadius));
router.get("/commercial-stores/dong", asyncHandler(getStoresInDong));
router.get("/commercial-boundary", asyncHandler(getBoundary));

export default router;
