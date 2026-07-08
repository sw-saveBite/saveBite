import {
  callSmallBusinessApi,
  checkBusinessStatus,
  searchCommercialStores,
  validateBusinessInfo,
} from "../services/publicData.service.js";
import { ApiError } from "../utils/ApiError.js";

export const getBusinessStatus = async (req, res) => {
  const result = await checkBusinessStatus(req.body.business_number || req.body.b_no);

  res.json(result);
};

export const validateBusiness = async (req, res) => {
  const result = await validateBusinessInfo(req.body);

  res.json(result);
};

export const getStoresInRadius = async (req, res) => {
  const { latitude, longitude, radius = 1000, pageNo = 1, numOfRows = 20 } = req.query;

  if (!latitude || !longitude) {
    throw new ApiError(400, "위도와 경도를 입력해 주세요.");
  }

  const data = await callSmallBusinessApi("storeListInRadius", {
    cy: latitude,
    cx: longitude,
    radius,
    pageNo,
    numOfRows,
  });

  res.json(data);
};

export const getStoresInDong = async (req, res) => {
  const { adongCd, pageNo = 1, numOfRows = 20 } = req.query;

  if (!adongCd) {
    throw new ApiError(400, "행정동코드를 입력해 주세요.");
  }

  const data = await callSmallBusinessApi("storeListInDong", {
    divId: "adongCd",
    key: adongCd,
    pageNo,
    numOfRows,
  });

  res.json(data);
};

export const searchStoresByName = async (req, res) => {
  const data = await searchCommercialStores(req.query);

  res.json(data);
};

export const getBoundary = async (req, res) => {
  const data = await callSmallBusinessApi("baroApi", req.query);

  res.json(data);
};
