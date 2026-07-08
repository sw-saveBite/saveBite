import { supabase } from "../config/supabase.js";
import { ApiError } from "../utils/ApiError.js";
import { getDistanceKm } from "../utils/distance.js";
import { isBlank } from "../utils/validation.js";

const CANCELLABLE_STATUSES = ["예약대기", "예약확정"];

export const getNearbyStores = async (req, res) => {
  const latitude = Number(req.query.latitude);
  const longitude = Number(req.query.longitude);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new ApiError(400, "위도와 경도를 올바르게 입력해 주세요.");
  }

  const { data, error } = await supabase
    .from("store")
    .select("store_id,store_name,road_address,status,latitude,longitude");

  if (error) {
    throw error;
  }

  const stores = data
    .filter((store) => Number.isFinite(Number(store.latitude)) && Number.isFinite(Number(store.longitude)))
    .filter((store) => {
      const distance = getDistanceKm(
        { latitude, longitude },
        { latitude: Number(store.latitude), longitude: Number(store.longitude) },
      );

      return distance <= 3;
    })
    .map((store) => ({
      ...store,
      latitude: Number(store.latitude),
      longitude: Number(store.longitude),
      distance_km: Number(
        getDistanceKm(
          { latitude, longitude },
          { latitude: Number(store.latitude), longitude: Number(store.longitude) },
        ).toFixed(1),
      ),
    }));

  res.json(stores);
};

export const getStoreProducts = async (req, res) => {
  const { store_id } = req.params;
  const { data, error } = await supabase
    .from("product")
    .select("product_id,product_name,price,quantity,count_quantity,status")
    .eq("store_id", store_id)
    .neq("status", "삭제")
    .order("product_id", { ascending: false });

  if (error) {
    throw error;
  }

  res.json(data);
};

export const createReservation = async (req, res) => {
  const { product_id } = req.body;

  if (isBlank(product_id)) {
    throw new ApiError(400, "상품을 선택해 주세요.");
  }

  const { data: product, error: productError } = await supabase
    .from("product")
    .select("*")
    .eq("product_id", product_id)
    .maybeSingle();

  if (productError) {
    throw productError;
  }

  if (!product || product.status === "품절" || Number(product.count_quantity) >= Number(product.quantity)) {
    throw new ApiError(400, "이 상품은 예약이 마감되었습니다.");
  }

  const nextCountQuantity = Number(product.count_quantity) + 1;

  const { error: reservationError } = await supabase.from("reservation").insert({
    user_id: req.auth.id,
    product_id: product.product_id,
    status: "예약확정",
    cancle_reason: "",
    create_at: new Date().toISOString(),
  });

  if (reservationError) {
    throw reservationError;
  }

  const { error: productUpdateError } = await supabase
    .from("product")
    .update({
      count_quantity: nextCountQuantity,
      status: nextCountQuantity >= Number(product.quantity) ? "품절" : product.status,
    })
    .eq("product_id", product.product_id);

  if (productUpdateError) {
    throw productUpdateError;
  }

  res.status(201).json({
    message: "예약이 성공적으로 완료되었습니다",
  });
};

export const getUserReservations = async (req, res) => {
  const { data: reservations, error } = await supabase
    .from("reservation")
    .select("reservation_id,product_id,status,cancle_reason,create_at")
    .eq("user_id", req.auth.id)
    .order("create_at", { ascending: false });

  if (error) {
    throw error;
  }

  if (!reservations.length) {
    return res.json([]);
  }

  const productIds = [...new Set(reservations.map((reservation) => reservation.product_id))];
  const { data: products, error: productError } = await supabase
    .from("product")
    .select("product_id,product_name,store_id")
    .in("product_id", productIds);

  if (productError) {
    throw productError;
  }

  const storeIds = [...new Set(products.map((product) => product.store_id).filter(Boolean))];
  const { data: stores, error: storeError } = storeIds.length
    ? await supabase.from("store").select("store_id,store_name").in("store_id", storeIds)
    : { data: [], error: null };

  if (storeError) {
    throw storeError;
  }

  const productById = new Map(products.map((product) => [product.product_id, product]));
  const storeNameById = new Map((stores || []).map((store) => [store.store_id, store.store_name]));

  res.json(
    reservations.map((reservation) => {
      const product = productById.get(reservation.product_id);
      return {
        reservation_id: reservation.reservation_id,
        product_id: reservation.product_id,
        product_name: product?.product_name || null,
        store_id: product?.store_id || null,
        store_name: product?.store_id ? storeNameById.get(product.store_id) || null : null,
        status: reservation.status,
        cancel_reason: reservation.cancle_reason,
        create_at: reservation.create_at,
      };
    }),
  );
};

export const cancelReservation = async (req, res) => {
  const { reservation_id } = req.params;
  const { data: reservation, error } = await supabase
    .from("reservation")
    .select("reservation_id,product_id,status")
    .eq("reservation_id", reservation_id)
    .eq("user_id", req.auth.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!reservation) {
    throw new ApiError(404, "예약 내역을 찾을 수 없습니다.");
  }

  if (!CANCELLABLE_STATUSES.includes(reservation.status)) {
    throw new ApiError(400, "이미 상품 준비가 시작되어 예약을 취소할 수 없습니다.");
  }

  const { data: product, error: productError } = await supabase
    .from("product")
    .select("product_id,count_quantity,status")
    .eq("product_id", reservation.product_id)
    .maybeSingle();

  if (productError) {
    throw productError;
  }

  const { error: reservationUpdateError } = await supabase
    .from("reservation")
    .update({
      status: "예약취소",
      cancle_reason: "사용자 취소",
    })
    .eq("reservation_id", reservation.reservation_id);

  if (reservationUpdateError) {
    throw reservationUpdateError;
  }

  if (product) {
    const nextCountQuantity = Math.max(Number(product.count_quantity) - 1, 0);

    await supabase
      .from("product")
      .update({
        count_quantity: nextCountQuantity,
        status: product.status === "품절" ? "판매중" : product.status,
      })
      .eq("product_id", product.product_id);
  }

  res.json({
    message: "예약 취소가 완료되었습니다.",
  });
};
