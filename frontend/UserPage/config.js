/* =========================================================
 *  공용 설정 (모든 유저 페이지에서 가장 먼저 로드)
 * =======================================================*/
const APP_CONFIG = {
  API_BASE: 'https://savebite-backend.vercel.app',
  // 카카오 지도 JS 키 (Web 도메인 등록 기반 공개 키)
  KAKAO_JS_KEY: 'a0a57801dc63f8f29164150f16ade3b6',
  // 세션 저장 키
  SESSION_KEY: 'savebite_session',
  // 관리자 세션 저장 키 (사용자 세션과 분리)
  ADMIN_SESSION_KEY: 'savebite_admin_session',
  // 로그인 필요 여부 (로그인해야 메인/마이페이지 접근 가능)
  REQUIRE_LOGIN: true,
  // 길찾기(도보/차량) 노출 여부
  SHOW_DIRECTIONS: true
};

/* ---------------- 세션 (로그인 정보) ---------------- */
const Session = {
  get() {
    try { return JSON.parse(localStorage.getItem(APP_CONFIG.SESSION_KEY)); }
    catch (e) { return null; }
  },
  set(session) { localStorage.setItem(APP_CONFIG.SESSION_KEY, JSON.stringify(session)); },
  clear() { localStorage.removeItem(APP_CONFIG.SESSION_KEY); },
  isLoggedIn() { return !!(this.get() && this.get().token); },
  // 페이지 진입 가드: 로그인 필요 시 로그인 페이지로 보냄
  guard(loginPath) {
    if (APP_CONFIG.REQUIRE_LOGIN && !this.isLoggedIn()) {
      window.location.href = loginPath;
      return false;
    }
    return true;
  }
};

/* ---------------- 관리자 세션 (사용자 세션과 별도 키) ----------------
 * 관리자 로그인/대시보드에서만 사용합니다.
 */
const AdminSession = {
  get() {
    try { return JSON.parse(localStorage.getItem(APP_CONFIG.ADMIN_SESSION_KEY)); }
    catch (e) { return null; }
  },
  set(session) { localStorage.setItem(APP_CONFIG.ADMIN_SESSION_KEY, JSON.stringify(session)); },
  clear() { localStorage.removeItem(APP_CONFIG.ADMIN_SESSION_KEY); },
  isLoggedIn() { return !!(this.get() && this.get().token); },
  // 페이지 진입 가드: 미로그인 시 관리자 로그인 페이지로 보냄
  guard(loginPath) {
    if (!this.isLoggedIn()) {
      window.location.href = loginPath;
      return false;
    }
    return true;
  }
};

/* ---------------- API 호출 헬퍼 (백엔드 연동 기능용) ----------------
 * 인증/가게 목록/예약/관리자 기능을 실제 백엔드로 연결합니다.
 */
async function apiFetch(path, options = {}) {
  const session = path.startsWith('/api/admin')
    ? AdminSession.get()
    : path.startsWith('/api/user')
      ? Session.get()
      : null;
  const headers = Object.assign(
    { 'Content-Type': 'application/json' },
    session && session.token ? { Authorization: `Bearer ${session.token}` } : {},
    options.headers || {}
  );
  const res = await fetch(APP_CONFIG.API_BASE + path, { ...options, headers });
  let data = null;
  try { data = await res.json(); } catch (e) { /* 본문 없음 */ }
  if (!res.ok) {
    const err = new Error((data && data.message) || `요청 실패 (${res.status})`);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

/* ---------------- 현재 위치 (브라우저 Geolocation API) ----------------
 * 별도 키가 필요 없는 표준 위치 API. HTTPS 또는 localhost/127.0.0.1 에서 동작.
 */
function getCurrentPosition(options) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject({ code: 'NO_SUPPORT', message: '이 브라우저는 위치 기능을 지원하지 않습니다.' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(err),
      Object.assign({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }, options || {})
    );
  });
}

/* ---------------- 카카오 지도 SDK 동적 로드 ----------------
 * 앱키를 HTML 에 직접 박지 않고 config 키로 한 번만 주입합니다.
 */
function loadKakaoMaps() {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) { window.kakao.maps.load(resolve); return; }
    const script = document.createElement('script');
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${APP_CONFIG.KAKAO_JS_KEY}&libraries=services&autoload=false`;
    script.onload = () => window.kakao.maps.load(resolve);
    script.onerror = () => reject(new Error('SDK_LOAD_FAILED'));
    document.head.appendChild(script);
  });
}
