import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new ApiError(401, "인증 토큰이 필요합니다."));
  }

  const token = authHeader.split(" ")[1];

  try {
    req.auth = jwt.verify(token, env.jwtSecret);
    return next();
  } catch {
    return next(new ApiError(401, "유효하지 않은 토큰입니다."));
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (req.auth?.role !== role) {
    return next(new ApiError(403, "접근 권한이 없습니다."));
  }

  return next();
};
