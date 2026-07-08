/* =========================================================
 *  공용 설정 (모든 유저 페이지에서 가장 먼저 로드)
 *  - 값을 코드에 직접 박지 않고 여기 설정으로만 관리합니다.
 *  - 로그인/회원가입은 백엔드 없이 브라우저(localStorage)에서 동작하며,
 *    미리 넣어둔 고정 계정은 없습니다. (가입한 사용자만 로그인 가능)
 * =======================================================*/
const APP_CONFIG = {
  // 백엔드 API base URL. 배포 시 window.SAVEBITE_API_BASE 또는 이 값을 배포 주소로 바꾸면 됩니다.
  API_BASE: window.SAVEBITE_API_BASE || 'http://localhost:3000',
  // 카카오 지도 JS 키 (Web 도메인 등록 기반 공개 키)
  KAKAO_JS_KEY: 'a0a57801dc63f8f29164150f16ade3b6',
  // 세션 저장 키
  SESSION_KEY: 'savebite_session',
  // 관리자 세션 저장 키 (사용자 세션과 분리)
  ADMIN_SESSION_KEY: 'savebite_admin_session',
  // 로그인 필요 여부 (로그인해야 메인/마이페이지 접근 가능)
  REQUIRE_LOGIN: true,
  // 길찾기(도보/차량) 노출 여부
  SHOW_DIRECTIONS: true,
  // TMap 보행자 경로 appKey (SK openapi 에서 발급). 유효하면 도보가 실제 보행 경로,
  // 무효/미발급이면 직선 경로로 자동 폴백됩니다.
  TMAP_APP_KEY: 'TBIrFKxefs10liD5E9F1765UkLeSVzf5929NMbaa'
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
  // 사용자 세션 토큰을 우선 사용하고, 없으면 관리자 세션 토큰을 첨부합니다.
  const session = Session.get() || (typeof AdminSession !== 'undefined' ? AdminSession.get() : null);
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

/* ---------------- TMap 보행자 경로 (도보 길찾기) ----------------
 * SK openapi TMap 보행자 API 를 브라우저에서 직접 호출합니다 (appKey 필요, CORS 허용됨).
 * origin/destination: "경도,위도" 문자열. 응답은 /api/directions 와 동일한
 * 정규화 형식 { mode, path: [[경도,위도],...], distanceM, durationSec } 으로 변환합니다.
 */
async function fetchTmapWalkRoute(origin, destination) {
  if (!APP_CONFIG.TMAP_APP_KEY) throw new Error('TMAP_KEY_MISSING');
  const [ox, oy] = origin.split(',').map(Number);
  const [dx, dy] = destination.split(',').map(Number);
  const res = await fetch('https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', appKey: APP_CONFIG.TMAP_APP_KEY },
    body: JSON.stringify({
      startX: ox, startY: oy, endX: dx, endY: dy,
      reqCoordType: 'WGS84GEO', resCoordType: 'WGS84GEO',
      startName: encodeURIComponent('출발지'), endName: encodeURIComponent('도착지')
    })
  });
  if (!res.ok) throw new Error(`TMAP_REQUEST_FAILED_${res.status}`);
  const data = await res.json();
  const path = [];
  let distanceM = null, durationSec = null;
  ((data && data.features) || []).forEach((f) => {
    if (f.geometry && f.geometry.type === 'LineString') {
      f.geometry.coordinates.forEach((c) => path.push([c[0], c[1]]));
    }
    if (f.properties && f.properties.totalDistance != null) distanceM = f.properties.totalDistance;
    if (f.properties && f.properties.totalTime != null) durationSec = f.properties.totalTime;
  });
  if (path.length < 2) throw new Error('TMAP_NO_ROUTE');
  return { mode: 'walk', path, distanceM, durationSec };
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
