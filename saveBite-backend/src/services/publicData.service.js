import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const requireApiKey = (apiKey, serviceName) => {
  if (!apiKey) {
    throw new ApiError(500, `${serviceName} API 키가 설정되어 있지 않습니다.`);
  }
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = typeof data === "string" ? data : data.message || data.error || "공공데이터 API 호출에 실패했습니다.";
    throw new ApiError(response.status, message);
  }

  return data;
};

export const normalizeBusinessNumber = (businessNumber) => {
  return String(businessNumber || "").replace(/\D/g, "");
};

export const checkBusinessStatus = async (businessNumber) => {
  requireApiKey(env.ntsBusinessApiKey, "국세청 사업자등록정보");

  const bNo = normalizeBusinessNumber(businessNumber);

  if (bNo.length !== 10) {
    throw new ApiError(400, "사업자등록번호는 숫자 10자리로 입력해 주세요.");
  }

  const url = new URL(`${env.ntsBusinessApiBaseUrl}/status`);
  url.searchParams.set("serviceKey", env.ntsBusinessApiKey);
  url.searchParams.set("returnType", "JSON");

  const data = await requestJson(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      b_no: [bNo],
    }),
  });

  const result = data.data?.[0];

  if (!result) {
    throw new ApiError(502, "사업자등록 상태조회 결과를 확인할 수 없습니다.");
  }

  return {
    business_number: bNo,
    is_active: result.b_stt_cd === "01",
    business_status: result.b_stt,
    business_status_code: result.b_stt_cd,
    tax_type: result.tax_type,
    tax_type_code: result.tax_type_cd,
    message: result.b_stt || result.tax_type || "사업자등록 상태조회가 완료되었습니다.",
    raw: result,
  };
};

export const validateBusinessInfo = async (payload) => {
  requireApiKey(env.ntsBusinessApiKey, "국세청 사업자등록정보");

  const bNo = normalizeBusinessNumber(payload.business_number || payload.b_no);
  const startDate = String(payload.start_dt || payload.open_date || "").replace(/\D/g, "");
  const ownerName = payload.p_nm || payload.owner_name;

  if (bNo.length !== 10) {
    throw new ApiError(400, "사업자등록번호는 숫자 10자리로 입력해 주세요.");
  }

  if (!ownerName || startDate.length !== 8) {
    throw new ApiError(400, "대표자명과 개업일자(YYYYMMDD)를 입력해 주세요.");
  }

  const url = new URL(`${env.ntsBusinessApiBaseUrl}/validate`);
  url.searchParams.set("serviceKey", env.ntsBusinessApiKey);
  url.searchParams.set("returnType", "JSON");

  const data = await requestJson(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      businesses: [
        {
          b_no: bNo,
          start_dt: startDate,
          p_nm: ownerName,
          p_nm2: payload.p_nm2 || "",
          b_nm: payload.store_name || payload.b_nm || "",
          corp_no: payload.corp_no || "",
          b_sector: payload.b_sector || "",
          b_type: payload.b_type || "",
          b_adr: payload.road_address || payload.b_adr || "",
        },
      ],
    }),
  });

  const result = data.data?.[0];

  if (!result) {
    throw new ApiError(502, "사업자등록 진위확인 결과를 확인할 수 없습니다.");
  }

  return {
    business_number: bNo,
    valid: result.valid === "01",
    valid_code: result.valid,
    message: result.valid_msg || "사업자등록 진위확인이 완료되었습니다.",
    status: result.status || null,
    raw: result,
  };
};

export const callSmallBusinessApi = async (path, query = {}) => {
  requireApiKey(env.smallBusinessApiKey, "소상공인 상가정보");

  const url = new URL(`${env.smallBusinessApiBaseUrl}/${path}`);
  url.searchParams.set("serviceKey", env.smallBusinessApiKey);
  url.searchParams.set("type", "json");

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });

  return requestJson(url);
};

const toArray = (value) => {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  return [value];
};

export const searchCommercialStores = async ({ keyword, pageNo = 1, numOfRows = 10 }) => {
  const searchKeyword = String(keyword || "").trim();

  if (!searchKeyword) {
    throw new ApiError(400, "상호명을 입력해 주세요.");
  }

  const data = await callSmallBusinessApi("storeList", {
    divId: "bizesNm",
    key: searchKeyword,
    pageNo,
    numOfRows,
  });

  const items = toArray(
    data?.body?.items?.item
      || data?.body?.items
      || data?.response?.body?.items?.item
      || data?.response?.body?.items,
  );

  return items.map((item) => ({
    business_id: item.bizesId,
    store_name: item.bizesNm,
    category: item.indsSclsNm || item.indsMclsNm || item.indsLclsNm || "",
    zip_code: item.newZipcd || item.zipcd || "",
    road_address: item.rdnmAdr || "",
    lot_address: item.lnoAdr || "",
    latitude: item.lat ? Number(item.lat) : null,
    longitude: item.lon ? Number(item.lon) : null,
    raw: item,
  }));
};
