import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

const parseCoordinate = (value, label) => {
  const [longitude, latitude] = String(value || "").split(",").map(Number);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) {
    throw new ApiError(400, `${label} 좌표를 올바르게 입력해 주세요.`);
  }

  return { longitude, latitude };
};

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message
      || data?.errorMessage
      || (typeof data?.error === "string" ? data.error : data?.error?.message)
      || (data ? JSON.stringify(data) : "길찾기 API 호출에 실패했습니다.");
    throw new ApiError(response.status, message);
  }

  return data;
};

const getKakaoCarRoute = async (origin, destination) => {
  if (!env.kakaoRestApiKey) {
    throw new ApiError(500, "KAKAO_REST_API_KEY가 설정되어 있지 않습니다.");
  }

  const url = new URL("https://apis-navi.kakaomobility.com/v1/directions");
  url.searchParams.set("origin", `${origin.longitude},${origin.latitude}`);
  url.searchParams.set("destination", `${destination.longitude},${destination.latitude}`);
  url.searchParams.set("priority", "RECOMMEND");

  const data = await requestJson(url, {
    headers: {
      Authorization: `KakaoAK ${env.kakaoRestApiKey}`,
    },
  });

  const route = data.routes?.[0];
  const path = [];

  route?.sections?.forEach((section) => {
    section.roads?.forEach((road) => {
      const vertexes = road.vertexes || [];
      for (let index = 0; index < vertexes.length - 1; index += 2) {
        path.push([vertexes[index], vertexes[index + 1]]);
      }
    });
  });

  if (path.length < 2) {
    throw new ApiError(502, "도로 경로를 찾을 수 없습니다.");
  }

  return {
    mode: "car",
    path,
    distanceM: route?.summary?.distance ?? null,
    durationSec: route?.summary?.duration ?? null,
  };
};

const getTmapWalkRoute = async (origin, destination) => {
  if (!env.tmapAppKey) {
    throw new ApiError(500, "TMAP_APP_KEY가 설정되어 있지 않습니다.");
  }

  const data = await requestJson("https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      appKey: env.tmapAppKey,
    },
    body: JSON.stringify({
      startX: origin.longitude,
      startY: origin.latitude,
      endX: destination.longitude,
      endY: destination.latitude,
      reqCoordType: "WGS84GEO",
      resCoordType: "WGS84GEO",
      startName: "출발지",
      endName: "도착지",
    }),
  });

  const path = [];
  let distanceM = null;
  let durationSec = null;

  (data.features || []).forEach((feature) => {
    if (feature.geometry?.type === "LineString") {
      feature.geometry.coordinates.forEach((coordinate) => path.push([coordinate[0], coordinate[1]]));
    }

    if (feature.properties?.totalDistance != null) {
      distanceM = feature.properties.totalDistance;
    }

    if (feature.properties?.totalTime != null) {
      durationSec = feature.properties.totalTime;
    }
  });

  if (path.length < 2) {
    throw new ApiError(502, "보행 경로를 찾을 수 없습니다.");
  }

  return {
    mode: "walk",
    path,
    distanceM,
    durationSec,
  };
};

export const getDirections = async (req, res) => {
  const origin = parseCoordinate(req.query.origin, "출발지");
  const destination = parseCoordinate(req.query.destination, "도착지");
  const mode = req.query.mode === "walk" ? "walk" : "car";
  const data = mode === "walk"
    ? await getTmapWalkRoute(origin, destination)
    : await getKakaoCarRoute(origin, destination);

  res.json(data);
};
