import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { createToken, hashPassword, verifyPassword } from "../utils/auth.js";
import { hasBlank, isBlank, isEmail } from "../utils/validation.js";

const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from("user")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const checkUserEmail = async (req, res) => {
  const { email } = req.body;

  if (isBlank(email)) {
    throw new ApiError(400, "이메일을 입력해 주세요.");
  }

  if (hasBlank(email)) {
    throw new ApiError(400, "이메일에 공백이 포함되어있습니다.");
  }

  if (!isEmail(email)) {
    throw new ApiError(400, "이메일 형식이 올바르지 않습니다.");
  }

  const user = await findUserByEmail(email);

  if (user) {
    throw new ApiError(409, "이미 사용 중인 이메일입니다.");
  }

  res.json({
    available: true,
    message: "사용 가능한 이메일입니다.",
  });
};

export const signupUser = async (req, res) => {
  const { email, password, phone_number } = req.body;

  if ([email, password, phone_number].some(isBlank) || !isEmail(email)) {
    throw new ApiError(400, "필수 항목을 모두 올바르게 입력해 주세요.");
  }

  if (hasBlank(email)) {
    throw new ApiError(400, "이메일에 공백이 포함되어있습니다.");
  }

  if (String(password).length < 8) {
    throw new ApiError(400, "비밀번호는 8자 이상이어야 합니다.");
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, "이미 사용 중인 이메일입니다.");
  }

  const { error } = await supabase.from("user").insert({
    email,
    password: await hashPassword(password),
    phone_number,
  });

  if (error) {
    throw error;
  }

  res.status(201).json({
    message: "정상적으로 회원가입이 완료되었습니다.",
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (isBlank(email) || isBlank(password)) {
    throw new ApiError(400, "이메일과 비밀번호를 입력해 주세요.");
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw new ApiError(404, "존재하지 않는 이메일입니다.");
  }

  const isValidPassword = await verifyPassword(password, user.password);

  if (!isValidPassword) {
    throw new ApiError(401, "비밀번호가 틀렸습니다.");
  }

  res.json({
    token: createToken({ id: user.user_id, role: "user" }),
    message: "로그인에 성공하였습니다.",
  });
};
