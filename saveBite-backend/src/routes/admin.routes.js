import { Router } from "express";

import {
  createProduct,
  deleteProduct,
  emergencySoldoutProduct,
  getAdminProducts,
  getAdminReservations,
  getAdminStoreProfile,
  updateProduct,
} from "../controllers/admin.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.use(authenticate, requireRole("admin"));

router.get("/store", asyncHandler(getAdminStoreProfile));
router.get("/products", asyncHandler(getAdminProducts));
router.post("/products", asyncHandler(createProduct));
router.put("/products/:product_id", asyncHandler(updateProduct));
router.delete("/products/:product_id", asyncHandler(deleteProduct));
router.patch("/products/:product_id/emergency-soldout", asyncHandler(emergencySoldoutProduct));
router.get("/reservations", asyncHandler(getAdminReservations));

export default router;
