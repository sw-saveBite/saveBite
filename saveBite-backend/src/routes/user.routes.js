import { Router } from "express";

import {
  cancelReservation,
  createReservation,
  getNearbyStores,
  getStoreProducts,
  getUserReservations,
} from "../controllers/user.controller.js";
import { authenticate, requireRole } from "../middlewares/auth.middleware.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/stores", asyncHandler(getNearbyStores));
router.get("/stores/:store_id/products", asyncHandler(getStoreProducts));

router.use(authenticate, requireRole("user"));

router.post("/reservations", asyncHandler(createReservation));
router.get("/reservations", asyncHandler(getUserReservations));
router.patch("/reservations/:reservation_id/cancel", asyncHandler(cancelReservation));

export default router;
