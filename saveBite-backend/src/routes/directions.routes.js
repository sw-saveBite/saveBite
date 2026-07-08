import { Router } from "express";

import { getDirections } from "../controllers/directions.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/directions", asyncHandler(getDirections));

export default router;
