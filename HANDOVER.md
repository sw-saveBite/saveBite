# saveBite 인수인계 문서

> 남는 음식/재고를 저렴하게 예약하는 위치 기반 가게 예약 서비스 (해커톤 프로젝트)
> 최종 정리일: 2026-07-08

---

## 1. 한눈에 보기

| 항목 | 내용 |
|---|---|
| 프로젝트 | saveBite — 주변 가게 탐색 + 상품 예약 + 길찾기 |
| 프론트 구성 | `frontend/UserPage`(사용자), `frontend/AdminPage`(관리자) |
| 기술 스택 | **순수 HTML/CSS/바닐라 JS** (프레임워크 없음), 카카오 지도 SDK |
| 백엔드 | **없음** (빈 `backend/app.js`만 존재) — 프론트가 백엔드 대신 localStorage로 동작 |
| 실행 방법 | VS Code **Live Server**로 `http://127.0.0.1:5500` 에서 서빙 |
| 데이터 | 로그인/회원가입 = localStorage / 가게·예약 = `sample-data.js`(UI용 샘플) |

---

## 2. 실행 방법

1. VS Code에서 프로젝트 열기 → **Live Server 실행** (반드시 포트 **5500**)
2. 접속 주소:
   - 사용자 로그인: `http://127.0.0.1:5500/saveBite/frontend/UserPage/UserLoginPage/UserLoginPage.html`
   - 사용자 메인(지도): `http://127.0.0.1:5500/saveBite/frontend/UserPage/UserMainPage/UserMainPage.html`
   - 관리자 로그인: `http://127.0.0.1:5500/saveBite/frontend/AdminPage/AdminLoginPage/AdminLoginPage.html`
3. **지도가 뜨려면 포트가 반드시 `127.0.0.1:5500` 이어야 함** (카카오 콘솔에 이 주소만 등록되어 있음. 아래 4번 참고)
4. 사용자 페이지는 **회원가입 → 로그인** 순서로 사용 (고정 테스트 계정 없음)

> ⚠️ 다른 포트(예: 5501)에서 열면 지도가 `ERR_BLOCKED_BY_ORB`로 막힘. 카카오에 도메인이 등록 안 되어서 정상 동작.

---

## 3. 폴더 구조

```
saveBite/
├─ backend/
│  └─ app.js                      # 비어 있음 (백엔드 미구현)
└─ frontend/
   ├─ UserPage/
   │  ├─ config.js                # ★ 공용 설정·세션·인증·API·지도 로더
   │  ├─ sample-data.js           # ★ UI 확인용 샘플 데이터 + SampleAPI
   │  ├─ UserLoginPage/           # 로그인 (html/css/js)
   │  ├─ UserSigninPage/          # 회원가입 (html/css/js)
   │  ├─ UserMainPage/            # 메인: 지도 + 가게목록 + 상세 + 예약 + 길찾기
   │  └─ UserMyPage/              # 마이페이지: 예약 내역/취소/길찾기
   └─ AdminPage/
      ├─ AdminLoginPage/          # 관리자 로그인 (기존 구현, 유지)
      └─ AdminSigninPage/         # 관리자 회원가입 2단계 (Step2 가게정보/주소검색 구현 완료)
```

각 페이지 폴더는 `이름.html` / `이름.css` / `이름.js` 세트로 구성.

---

## 4. 카카오 개발자 콘솔 설정 (중요)

앱: **saveBite** (앱 ID `1505435`)

| 키 종류 | 값 | 용도 |
|---|---|---|
| JavaScript 키 | `a0a57801dc63f8f29164150f16ade3b6` | 지도 SDK (프론트에서 사용) |
| REST API 키 | `e2e2a54124f259a5819812c6eb075ed0` | 길찾기(모빌리티) — **백엔드 전용** |
| 네이티브 앱 키 | `5f2a6459d2ba98044ba4352d9e928179` | 미사용 |

**필수 설정 2가지 (이미 완료됨):**
1. **플랫폼 → Web → 사이트 도메인**에 `http://127.0.0.1:5500` 등록 (배포 시 배포 도메인 추가 필요)
2. **카카오맵 서비스 ON** (안 켜면 SDK가 `NotAuthorizedError: OPEN_MAP_AND_LOCAL service` 반환)

> 디버깅 팁: 아래 URL을 브라우저 새 탭에 직접 붙여넣으면 카카오 응답을 그대로 볼 수 있음.
> `https://dapi.kakao.com/v2/maps/sdk.js?appkey=a0a57801dc63f8f29164150f16ade3b6&libraries=services&autoload=false`
> → 정상: JS 코드가 쭉 나옴 / 에러: `{"errorType":...}` JSON

---

## 5. 아키텍처 & 데이터 흐름

### 5-1. 인증 (로그인/회원가입) — 클라이언트 사이드
- 백엔드 없이 **localStorage에 사용자 저장** (`config.js`의 `UserStore`)
- **고정/하드코딩 계정 없음** — 회원가입한 사람만 로그인 가능
- 세션: `Session` 객체가 `savebite_session` 키에 토큰 저장

### 5-2. 가게/예약/길찾기 — SampleAPI (UI용) ↔ 실제 백엔드 전환
- 모든 화면은 `apiFetch(path, options)` 하나로만 호출
- `config.js`의 `API_BASE`가 **비어 있으면 → `sample-data.js`의 `SampleAPI`** 가 응답 (localStorage 기반)
- `API_BASE`에 실제 백엔드 주소를 넣으면 → **자동으로 실제 API 호출로 전환** (SampleAPI는 안 쓰임)
- 즉, 백엔드가 준비되면 **`config.js` 한 줄만 수정**하면 됨

```js
// config.js
const APP_CONFIG = {
  API_BASE: '',   // ← 백엔드 배포 후 여기에 주소 입력 (예: 'https://api.savebite.com')
  KAKAO_JS_KEY: 'a0a57801dc63f8f29164150f16ade3b6',
  SESSION_KEY: 'savebite_session',
  ADMIN_SESSION_KEY: 'savebite_admin_session',  // 관리자 세션(사용자와 분리)
  USERS_KEY: 'savebite_users',
  REQUIRE_LOGIN: true,   // 로그인 안 하면 메인/마이페이지 접근 차단
  SHOW_DIRECTIONS: true, // 길찾기 UI 노출
  TMAP_APP_KEY: '...'    // TMap 보행자 appKey. 유효하면 도보=실제 보행 경로, 무효면 직선 폴백
};
```

### 5-3. 백엔드가 구현해야 할 API 규격 (프론트가 기대하는 형식)

| Method | Path | 응답/설명 |
|---|---|---|
| GET | `/api/stores?lat=&lng=&radius=3` | 가게 요약 배열 `[{id,name,address,lat,lng,status,phone,hours,distanceKm}]` |
| GET | `/api/stores/:id` | 가게 상세 (`items:[{id,name,price,total,stock,hidden}]` 포함) |
| GET | `/api/reservations` | 예약 배열 (`itemSoldOut` 포함) |
| POST | `/api/reservations` `{storeId,itemId}` | 예약 생성. 품절 시 409 |
| PATCH | `/api/reservations/:id/cancel` | 예약 취소. '예약 대기' 아니면 409 |
| GET | `/api/directions?origin=경도,위도&destination=경도,위도&mode=car\|walk` | **정규화 형식** `{path:[[경도,위도],...], distanceM, durationSec}` |
| GET | `/api/admin/store` | (관리자) 내 가게 상세 — `items`에 `hidden` 포함 전체 반환 |
| POST | `/api/admin/store/items` `{name,price,total}` | (관리자) 상품 추가. `stock=total`(예약 0)로 생성 |
| PATCH | `/api/admin/store/items/:id` `{name,price,total}` | (관리자) 상품 수정. **품절 상품은 400 차단**. 기존 예약 수 유지(`stock = total - 예약수`), 예약수보다 적은 total 은 400 |
| DELETE | `/api/admin/store/items/:id` | (관리자) 상품 삭제. **품절 상품만 가능**(판매중 400), 진행 중(대기/확정) 예약 있으면 409 |
| GET | `/api/admin/store/items/:id/reservations` | (관리자) 상품별 예약자 목록 `[{id,name,phone,pickupTime,status}]` (대기/확정만) |
| POST | `/api/admin/store/items/:id/soldout` | (관리자) 긴급 품절: 재고 0 + 활성 예약 일괄 취소(`canceledBySoldOut` 플래그). `{ok,canceledCount}` 반환 |

> 인증은 헤더 `Authorization: Bearer <token>` 로 전달됨 (apiFetch가 사용자→관리자 순으로 세션 토큰 자동 첨부).
> 관리자 API는 로그인한 관리자의 가게로 스코프됨 (샘플에서는 `ADMIN_STORE_ID`로 고정).

---

## 6. 페이지별 현황

### 사용자 페이지 (완료)

| 페이지 | 상태 | 핵심 기능 |
|---|---|---|
| 로그인 | ✅ 완료 | 이메일/비번 검증, 공백 차단, 엔터 로그인, 성공 배너 후 이동 |
| 회원가입 | ✅ 완료 | 이메일 중복확인, 비번 규칙(8~20자·2종 조합·공백불가), 휴대폰, 유효 시에만 버튼 활성화 |
| 메인(지도) | ✅ 완료 | 현재 위치(GPS) + 가게 마커/목록, 상세, 상품 예약 모달, 도보/차량 길찾기, 범례 |
| 마이페이지 | ✅ 완료 | 예약내역(상태 4종), 취소 규칙, 길찾기 이동 |

**디자인**: Figma 시안대로 반영 완료 (상단바 / 가게카드 / 상품카드 재고 진행바 / 예약 모달 / 상태별 색상 마커 / 범례).

### 관리자 페이지

| 페이지 | 상태 | 비고 |
|---|---|---|
| 관리자 로그인 | ✅ 완료 | 시안과 일치. 성공 시 `AdminSession` 저장 후 대시보드로 이동. 고정 계정 `admin@test.com`/`admin1234!` 유지 |
| 관리자 회원가입(2단계) | ✅ 완료 | Step1 계정정보 + Step2 가게정보. **가게이름**(특수문자 `()[]-&`만 허용) + **주소검색**(다음/카카오 우편번호 팝업, 무료·무키) + **상세주소**(50자, 공백만 불가), 유효 시 버튼 활성화 |
| **관리자 대시보드** | ✅ 완료 | 좌측 상품목록(뱃지/진행바) + 우측 통계 4개 + 지도. ⋮ 메뉴가 **상태별로 다름** → **판매중**: 예약자 확인·수정·긴급 품절 / **품절**: 예약자 확인·삭제(재확인 모달, 진행 중 예약 있으면 삭제 불가) |
| **상품 추가/수정** | ✅ 완료 | 한 페이지 겸용. `?id=상품ID` 로 열면 **상품 수정** 모드(프리필, 가격 포맷 미리보기, `수정 완료` 버튼, PATCH). 없으면 추가 모드(POST) |

> **관리자 데이터 방식 (검토 항목 결정됨)**: 관리자 페이지는 사용자와 **동일한 `config.js` + `sample-data.js`(SampleAPI)를 공유**합니다. 관리자↔가게 매핑은 `sample-data.js`의 `ADMIN_STORE_ID`(현재 `1` = GS25 강남테헤란점) 한 곳에서 관리. 따라서 관리자가 상품을 추가/삭제하면 **사용자 페이지에도 즉시 반영**됩니다. 관리자 세션은 사용자 세션과 분리된 `savebite_admin_session` 키(`AdminSession`)를 사용.

---

## 7. 주요 규칙/제약 (반드시 지킬 것)

1. **하드코딩 금지** — 값을 코드에 직접 박지 말 것. 데이터는 `localStorage` 또는 `sample-data.js`(명확히 분리된 UI 샘플) 사용. 카카오 JS 키만 예외(config에 필수).
2. **백엔드 만들지 말 것** — 기능 명세서(프론트)만 구현. 백엔드는 사용자가 별도 담당.
3. **샘플 데이터는 `sample-data.js` 한 파일에만** — 실제 API 붙으면 자동으로 안 쓰이도록 되어 있음. 파일만 지우면 샘플 완전 제거.
4. **길찾기 = 도보 + 차량** — **도보는 TMap 보행자 API**: 브라우저 직접 호출 가능(CORS 허용)해서 프론트 연동 완료, appKey만 필요. **차량은 카카오모빌리티**: 브라우저 직접 호출이 CORS로 막히므로 백엔드 프록시(`/api/directions`) 경유 필요 → 백엔드 연동 전까지 직선 경로 표시.

---

## 8. 남은 작업 (TODO)

### 이번 단계 — 관리자 페이지 (Figma 시안 기준) ✅ 완료
- [x] **관리자 대시보드** 신규 페이지 (`AdminPage/AdminDashboardPage/`)
  - 좌측: 가게 헤더(가게명/주소/로그아웃), "내 상품" + `+추가` 버튼, 상품 카드(판매중/품절 뱃지, `예약 N` 뱃지, 가격, `예약 X/Y` 진행바, ⋮ 메뉴 = 상태별: 판매중=예약자확인/수정/긴급품절, 품절=예약자확인/삭제)
  - 우측: `대시보드` 헤더 + `영업 중` 표시, 통계 카드 4개(전체 상품/판매 중/품절/총 예약), 지도(가게 마커 + 정보 카드, 127.0.0.1:5500 에서 표시)
- [x] **상품 추가** 신규 페이지 (`AdminPage/AdminProductAddPage/`)
  - 상품 이름(최대 30자, 글자수 카운터), 판매 가격(원), 예약 가능 수량(개), `상품 추가` 버튼(유효 시 활성화)
- [x] 관리자 로그인 성공 시 → 대시보드로 이동 연결 (`AdminSession` 저장)
- [x] (검토 결정) 관리자 데이터는 사용자 `SampleAPI` **공유**, 매핑은 `ADMIN_STORE_ID`, 고정 계정 **유지** — 위 6번 표 참고

### 사용자 페이지 소소 수정 ✅ 완료
- [x] 길찾기 UI 는 `config.js`의 `SHOW_DIRECTIONS` 플래그로 제어 (마이페이지 `길찾기` 버튼 포함). 한때 TMap 적용 전까지 숨겼다가, TMap 연동과 함께 **현재 `true` 로 복원됨**.

### TMap API 적용 (도보 길찾기) — 코드 완료, ⚠️ appKey 인증 오류 해결 필요
- [x] **프론트 연동 코드 완료**: `config.js`의 `fetchTmapWalkRoute()` — TMap 보행자 API 를 브라우저에서 직접 호출(CORS 허용)해 정규화 형식으로 변환. 도보 길찾기 시 TMap 우선, 실패하면 직선 경로 자동 폴백.
- [x] `SHOW_DIRECTIONS: true` 로 길찾기 UI(차량/도보 토글 + 길찾기 버튼) 복원, `TMAP_APP_KEY` 에 키 입력됨.
- [ ] ⚠️ **현재 키가 403 `INVALID_API_KEY`** (`TBIrFKxefs1...baa`). SK openapi 콘솔에서 확인 필요:
  1. openapi.sk.com 로그인 → 대시보드 → 해당 앱 선택
  2. 앱에 **TMap API 사용(구독) 신청**이 되어 있는지 확인 (안 되어 있으면 사용 신청)
  3. **appKey**(앱키) 항목을 다시 복사 — 시크릿/다른 앱 키와 혼동 주의
  4. 키가 유효해지면 **코드 수정 없이** 도보가 실제 보행 경로로 바로 동작 (터미널 검증: 아래 curl 이 JSON `features` 를 반환하면 성공)
- [ ] (백엔드 연동 시) `/api/directions`에서 `mode=walk`=TMap, `mode=car`=카카오모빌리티 호출 후 정규화 형식 `{path, distanceM, durationSec}` 반환. 키는 **백엔드 환경변수**로 이관 (API_BASE 가 채워지면 프론트 TMap 직접 호출은 자동으로 사용 안 됨)

```bash
# TMap 키 유효성 검증용 (JSON features 가 나오면 정상, error 가 나오면 키 문제)
curl -s -X POST 'https://apis.openapi.sk.com/tmap/routes/pedestrian?version=1' \
  -H 'Content-Type: application/json' -H 'appKey: <발급키>' \
  -d '{"startX":127.0366,"startY":37.5006,"endX":127.0276,"endY":37.4979,"startName":"a","endName":"b","reqCoordType":"WGS84GEO","resCoordType":"WGS84GEO"}'
```

---

## 9. 개발/검증 팁

- **JS 문법 검사**: `node --check 파일.js`
- **미리보기 검증**: 다른 포트에서 띄우면 지도는 안 뜨지만 로직/레이아웃은 확인 가능. 로그인 가드는 콘솔에서 `localStorage.setItem('savebite_session', JSON.stringify({token:'t'}))` 로 우회.
- **샘플 데이터 초기화**: `sample-data.js`의 `VERSION` 값을 올리면 다음 로드 때 가게/예약이 새로 시드됨 (가입 계정은 유지). 완전 초기화는 브라우저 `localStorage.clear()`.
- **localStorage 키 목록**: `savebite_session`(사용자 세션), `savebite_admin_session`(관리자 세션), `savebite_users`(가입 계정), `savebite_sample_stores`·`savebite_sample_reservations`·`savebite_sample_version`(샘플 데이터).
- **관리자 대시보드 미리보기**: 가드 우회는 `localStorage.setItem('savebite_admin_session', JSON.stringify({token:'t'}))`.

---

## 10. 자주 겪은 이슈 & 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| 로그인/회원가입 안 됨 | 없는 백엔드 호출 | localStorage 인증으로 전환 (완료) |
| 지도 "로드 실패" | JS키 도메인 미등록 | 카카오 콘솔에 `http://127.0.0.1:5500` 등록 |
| 지도 `OPEN_MAP_AND_LOCAL disabled` | 카카오맵 서비스 OFF | 콘솔에서 카카오맵 ON |
| "근처에 가게 없음" | 실제 위치가 강남 밖 | SampleAPI가 반경 필터 없이 전부 반환하도록 처리(완료) |
| 도보 길찾기 직선만 나옴 | TMap 미연동 | 다음 단계에서 TMap 적용 |
