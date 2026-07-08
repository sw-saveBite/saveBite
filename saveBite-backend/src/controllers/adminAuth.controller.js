import { supabase } from "../config/supabase.js";
import { normalizeBusinessNumber } from "../services/publicData.service.js";
import { ApiError } from "../utils/ApiError.js";
import { createToken, hashPassword, verifyPassword } from "../utils/auth.js";
import { isBlank, isEmail, hasBlank } from "../utils/validation.js";

const findAdminByEmail = async (email) => {
  const { data, error } = await supabase
    .from("admin")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
};

export const checkAdminEmail = async (req, res) => {
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

  const admin = await findAdminByEmail(email);

  if (admin) {
    throw new ApiError(409, "이미 사용 중인 이메일입니다.");
  }

  res.json({
    available: true,
    message: "사용 가능한 이메일입니다.",
  });
};

export const signupAdmin = async (req, res) => {
  const {
    email,
    password,
    phone_number,
    store_name,
    business_number,
    zip_code,
    road_address,
    detail_address,
    latitude,
    longitude,
  } = req.body;

  const requiredValues = [
    email,
    password,
    phone_number,
    store_name,
    business_number,
    zip_code,
    road_address,
    detail_address,
    latitude,
    longitude,
  ];

  if (requiredValues.some(isBlank) || !isEmail(email)) {
    throw new ApiError(400, "필수 항목을 모두 올바르게 입력해 주세요.");
  }

  if (hasBlank(email)) {
    throw new ApiError(400, "이메일에 공백이 포함되어있습니다.");
  }

  if (String(password).length < 8) {
    throw new ApiError(400, "비밀번호는 8자 이상이어야 합니다.");
  }

  if (String(detail_address).trim() === "") {
    throw new ApiError(400, "상세 주소를 정확히 입력해 주세요. (공백만 입력 불가)");
  }

  const normalizedBusinessNumber = normalizeBusinessNumber(business_number);

  if (normalizedBusinessNumber.length !== 10) {
    throw new ApiError(400, "사업자등록번호는 숫자 10자리로 입력해 주세요.");
  }

  const existingAdmin = await findAdminByEmail(email);

  if (existingAdmin) {
    throw new ApiError(409, "이미 사용 중인 이메일입니다.");
  }

  const { data: admin, error: adminError } = await supabase
    .from("admin")
    .insert({
      email,
      password: await hashPassword(password),
      phone_number,
    })
    .select("admin_id")
    .single();

  if (adminError) {
    throw adminError;
  }

  const { error: storeError } = await supabase.from("store").insert({
    business_number: normalizedBusinessNumber,
    store_name,
    zip_code,
    road_address,
    detail_address,
    latitude: Number(latitude),
    longitude: Number(longitude),
    status: "영업중",
    admin_id: admin.admin_id,
  });

  if (storeError) {
    await supabase.from("admin").delete().eq("admin_id", admin.admin_id);
    throw storeError;
  }

  res.status(201).json({
    message: "정상적으로 회원가입이 완료되었습니다.",
  });
};

export const loginAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (isBlank(email) || isBlank(password)) {
    throw new ApiError(400, "이메일과 비밀번호를 입력해 주세요.");
  }

  const admin = await findAdminByEmail(email);

  if (!admin) {
    throw new ApiError(404, "존재하지 않는 이메일입니다.");
  }

  const isValidPassword = await verifyPassword(password, admin.password);

  if (!isValidPassword) {
    throw new ApiError(401, "비밀번호가 틀렸습니다.");
  }

  res.json({
    token: createToken({ id: admin.admin_id, role: "admin" }),
    message: "로그인에 성공하였습니다.",
  });
};
