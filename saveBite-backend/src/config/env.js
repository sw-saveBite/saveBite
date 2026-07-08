import "dotenv/config";

const normalizeSupabaseUrl = (url) => {
  if (!url) {
    return "";
  }

  const trimmedUrl = url.trim();
  const projectRef = trimmedUrl.match(/\/project\/([a-z0-9]+)/i)?.[1];

  if (projectRef) {
    return `https://${projectRef}.supabase.co`;
  }

  return trimmedUrl;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 3000,
  supabaseUrl: normalizeSupabaseUrl(process.env.SUPABASE_URL),
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY,
  jwtSecret: process.env.JWT_SECRET || "savebite-local-dev-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  smallBusinessApiKey: process.env.SMALL_BUSINESS_API_KEY,
  smallBusinessApiBaseUrl:
    process.env.SMALL_BUSINESS_API_BASE_URL || "https://apis.data.go.kr/B553077/api/open/sdsc2",
  ntsBusinessApiKey: process.env.NTS_BUSINESS_API_KEY || process.env.SMALL_BUSINESS_API_KEY,
  ntsBusinessApiBaseUrl:
    process.env.NTS_BUSINESS_API_BASE_URL || "https://api.odcloud.kr/api/nts-businessman/v1",
  kakaoRestApiKey: process.env.KAKAO_REST_API_KEY,
  tmapAppKey: process.env.TMAP_APP_KEY,
};
