import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export const hashPassword = (password) => bcrypt.hash(password, 12);

export const verifyPassword = async (password, storedPassword) => {
  if (!storedPassword) {
    return false;
  }

  if (storedPassword.startsWith("$2a$") || storedPassword.startsWith("$2b$")) {
    return bcrypt.compare(password, storedPassword);
  }

  return password === storedPassword;
};

export const createToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};
