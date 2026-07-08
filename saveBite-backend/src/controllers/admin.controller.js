import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { isBlank, isNonNegativeNumber, isPositiveInteger } from "../utils/validation.js";

const ACTIVE_RESERVATION_STATUSES = ["예약대기", "예약확정", "준비중", "준비완료"];

const getAdminStore = async (adminId) => {
  const { data, error } = await supabase
    .from("store")
    .select("store_id")
    .eq("admin_id", adminId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new ApiError(404, "등록된 가게가 없습니다.");
  }

  return data;
};

const getOwnedProduct = async (adminId, productId) => {
  const store = await getAdminStore(adminId);
  const { data: product, error } = await supabase
    .from("product")
    .select("*")
    .eq("product_id", productId)
    .eq("store_id", store.store_id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!product) {
    throw new ApiError(404, "상품을 찾을 수 없습니다.");
  }

  return product;
};

const toAdminProductResponse = (product) => ({
  product_id: product.product_id,
  product_name: product.product_name,
  price: product.price,
  product_quantity: product.quantity,
  current_quantity: product.count_quantity,
  status: product.status,
  store_id: product.store_id,
});

const toDashboardProduct = (product) => {
  const total = Number(product.quantity) || 0;
  const reserved = Number(product.count_quantity) || 0;

  return {
    id: product.product_id,
    name: product.product_name,
    price: `${Number(product.price || 0).toLocaleString("ko-KR")}원`,
    total,
    stock: Math.max(total - reserved, 0),
    status: product.status,
    hidden: product.status === "삭제",
  };
};

const validateProductName = (productName) => {
  if (isBlank(productName)) {
    throw new ApiError(400, "상품 이름을 입력해 주세요.");
  }

  if (String(productName).trim().length > 30) {
    throw new ApiError(400, "상품 이름은 30자를 초과할 수 없습니다.");
  }
};

export const getAdminStoreProfile = async (req, res) => {
  const { data: store, error: storeError } = await supabase
    .from("store")
    .select("*")
    .eq("admin_id", req.auth.id)
    .maybeSingle();

  if (storeError) {
    throw storeError;
  }

  if (!store) {
    throw new ApiError(404, "등록된 가게가 없습니다.");
  }

  const { data: products, error: productError } = await supabase
    .from("product")
    .select("*")
    .eq("store_id", store.store_id)
    .neq("status", "삭제")
    .order("product_id", { ascending: false });

  if (productError) {
    throw productError;
  }

  res.json({
    id: store.store_id,
    name: store.store_name,
    address: [store.road_address, store.detail_address].filter(Boolean).join(" "),
    road_address: store.road_address,
    detail_address: store.detail_address,
    zip_code: store.zip_code,
    status: store.status,
    lat: store.latitude == null ? null : Number(store.latitude),
    lng: store.longitude == null ? null : Number(store.longitude),
    items: (products || []).map(toDashboardProduct),
  });
};

export const getAdminProducts = async (req, res) => {
  const store = await getAdminStore(req.auth.id);
  const { data, error } = await supabase
    .from("product")
    .select("*")
    .eq("store_id", store.store_id)
    .neq("status", "삭제")
    .order("product_id", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data?.length) {
    throw new ApiError(404, "아직 등록된 상품이 없습니다. 첫 상품을 추가해 보세요!");
  }

  res.json(data.map(toAdminProductResponse));
};

export const createProduct = async (req, res) => {
  const { product_name, price, product_quantity } = req.body;

  validateProductName(product_name);

  if (!isNonNegativeNumber(price)) {
    throw new ApiError(400, "가격은 0원 이상이어야 합니다.");
  }

  if (!isPositiveInteger(product_quantity)) {
    throw new ApiError(400, "수량은 1개 이상이어야 합니다.");
  }

  const store = await getAdminStore(req.auth.id);
  const { error } = await supabase.from("product").insert({
    product_name,
    price: Number(price),
    quantity: Number(product_quantity),
    count_quantity: 0,
    status: "판매중",
    store_id: store.store_id,
  });

  if (error) {
    throw error;
  }

  res.status(201).json({
    message: "등록에 성공하였습니다.",
  });
};

export const updateProduct = async (req, res) => {
  const { product_id } = req.params;
  const { product_name, price } = req.body;
  const product = await getOwnedProduct(req.auth.id, product_id);

  if (product.status === "품절") {
    throw new ApiError(400, "품절 상품이라 수정할 수 없습니다.");
  }

  validateProductName(product_name);

  if (!isNonNegativeNumber(price)) {
    throw new ApiError(400, "가격은 0원 이상이어야 합니다.");
  }

  const { error } = await supabase
    .from("product")
    .update({
      product_name,
      price: Number(price),
    })
    .eq("product_id", product.product_id);

  if (error) {
    throw error;
  }

  res.json({
    message: "수정 성공하였습니다.",
  });
};

export const deleteProduct = async (req, res) => {
  const { product_id } = req.params;
  const product = await getOwnedProduct(req.auth.id, product_id);

  if (product.status !== "품절") {
    throw new ApiError(400, "품절 상태의 상품만 삭제할 수 있습니다.");
  }

  const { data: reservations, error: reservationError } = await supabase
    .from("reservation")
    .select("reservation_id")
    .eq("product_id", product.product_id)
    .in("status", ACTIVE_RESERVATION_STATUSES);

  if (reservationError) {
    throw reservationError;
  }

  if (reservations.length > 0) {
    throw new ApiError(400, "진행 중인 예약이 있어 상품을 삭제할 수 없습니다.");
  }

  const { error } = await supabase
    .from("product")
    .update({
      status: "삭제",
    })
    .eq("product_id", product.product_id);

  if (error) {
    throw error;
  }

  res.json({
    message: "상품이 리스트에서 삭제되었습니다.",
  });
};

export const emergencySoldoutProduct = async (req, res) => {
  const { product_id } = req.params;
  const { cancel_reason } = req.body;
  const product = await getOwnedProduct(req.auth.id, product_id);

  if (isBlank(cancel_reason)) {
    throw new ApiError(400, "취소 사유를 입력해 주세요.");
  }

  const { error: productError } = await supabase
    .from("product")
    .update({
      status: "품절",
      count_quantity: product.quantity,
    })
    .eq("product_id", product.product_id);

  if (productError) {
    throw productError;
  }

  const { data: activeReservations, error: activeReservationError } = await supabase
    .from("reservation")
    .select("reservation_id")
    .eq("product_id", product.product_id)
    .in("status", ACTIVE_RESERVATION_STATUSES);

  if (activeReservationError) {
    throw activeReservationError;
  }

  const { error: reservationError } = await supabase
    .from("reservation")
    .update({
      status: "예약취소",
      cancle_reason: cancel_reason,
    })
    .eq("product_id", product.product_id)
    .in("status", ACTIVE_RESERVATION_STATUSES);

  if (reservationError) {
    throw reservationError;
  }

  res.json({
    message: "긴급 품절 처리되었으며, 예약자에게 취소 안내가 발송되었습니다.",
    canceled_count: activeReservations?.length || 0,
  });
};

export const getAdminReservations = async (req, res) => {
  const store = await getAdminStore(req.auth.id);
  const { data: products, error: productError } = await supabase
    .from("product")
    .select("product_id")
    .eq("store_id", store.store_id);

  if (productError) {
    throw productError;
  }

  const productIds = products.map((product) => product.product_id);

  if (productIds.length === 0) {
    return res.json([]);
  }

  const { data, error } = await supabase
    .from("reservation")
    .select("reservation_id,user_id,product_id,status,cancle_reason,create_at")
    .in("product_id", productIds)
    .order("create_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return res.json([]);
  }

  const userIds = [...new Set(data.map((reservation) => reservation.user_id).filter(Boolean))];
  const { data: users, error: userError } = userIds.length
    ? await supabase.from("user").select("user_id,email,phone_number").in("user_id", userIds)
    : { data: [], error: null };

  if (userError) {
    throw userError;
  }

  const emailByUserId = new Map((users || []).map((user) => [user.user_id, user.email]));
  const phoneByUserId = new Map((users || []).map((user) => [user.user_id, user.phone_number]));

  res.json(
    data.map((reservation) => ({
      ...reservation,
      user_email: emailByUserId.get(reservation.user_id) || null,
      user_phone: phoneByUserId.get(reservation.user_id) || null,
    })),
  );
};
