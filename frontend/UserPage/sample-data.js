/* =========================================================
 *  UI 확인용 샘플 데이터 (프론트 UI를 화면에서 바로 확인하기 위한 예시)
 *  - config.js 의 API_BASE 가 비어 있을 때만 사용됩니다.
 *  - 실제 백엔드가 준비되면 API_BASE 에 주소를 넣으세요 → 이 파일은 자동으로 사용되지 않습니다.
 *  - 이 파일만 지우면 샘플 데이터가 완전히 제거됩니다.
 * =======================================================*/

// 가게 목록 (상품 포함).
//  - total: 전체 수량, stock: 남은 수량 → 예약수량 = total-stock, 재고 0 = 품절
//  - hidden: 사용자에게 숨김
const SAMPLE_STORES = [
  { id: 1, name: 'GS25 강남테헤란점', address: '강남구 테헤란로 152', lat: 37.5006, lng: 127.0366, status: '영업 중', phone: '02-1234-5678', hours: '24시간 운영',
    items: [
      { id: 101, name: '메가로운 GS도시락', price: '4,500원', total: 28, stock: 23 },
      { id: 102, name: '물냉복음면 [강]', price: '1,800원', total: 15, stock: 0 },
      { id: 103, name: '언제우유 생크림빵', price: '2,200원', total: 18, stock: 11 }
    ] },
  { id: 2, name: 'CU 역삼역점', address: '강남구 역삼로 123-4', lat: 37.5008, lng: 127.0365, status: '영업 중', phone: '02-9876-5432', hours: '24시간 운영',
    items: [
      { id: 201, name: '백종원 매콤도시락', price: '4,900원', total: 20, stock: 8 },
      { id: 202, name: '콘치즈 삼각김밥', price: '1,500원', total: 30, stock: 14 }
    ] },
  { id: 3, name: '세븐일레븐 논현점', address: '강남구 논현동 416-7', lat: 37.5108, lng: 127.0223, status: '준비 중', phone: '02-5555-1234', hours: '24시간 운영',
    items: [ { id: 301, name: '유부초밥 세트', price: '3,800원', total: 12, stock: 5 } ] },
  { id: 4, name: '이마트24 신사점', address: '강남구 신사동 789-1', lat: 37.5163, lng: 127.0203, status: '영업 중', phone: '02-7777-8888', hours: '24시간 운영',
    items: [ { id: 401, name: '스팸마요 덮밥', price: '4,200원', total: 16, stock: 9 } ] },
  { id: 5, name: '미니스톱 강남점', address: '강남구 강남대로 396', lat: 37.4979, lng: 127.0276, status: '영업 중', phone: '02-3333-4444', hours: '07:00 - 23:00',
    items: [ { id: 501, name: '치킨마요 도시락', price: '5,500원', total: 22, stock: 16 } ] },
  { id: 6, name: '미니소 도산점', address: '강남구 도산대로 118', lat: 37.5220, lng: 127.0360, status: '영업 중', phone: '02-6666-7777', hours: '24시간 운영',
    items: [ { id: 601, name: '모듬 김밥', price: '3,000원', total: 25, stock: 7 } ] }
];

// 예약 내역 (상태 4종을 모두 보여주기 위한 예시)
//  - reserverName/reserverPhone/pickupTime: 관리자 대시보드 "예약자 확인"에서 표시
//  - demo: true → 관리자 화면 예약자 목록 전용 (사용자 마이페이지에는 표시 안 됨)
const SAMPLE_RESERVATIONS = [
  { id: 9001, storeId: 1, storeName: 'GS25 강남테헤란점', itemId: 102, itemName: '물냉복음면 [강]', price: '1,800원', status: '예약 대기', reservedAt: new Date(Date.now() - 1 * 864e5).toISOString(), reserverName: '최수아', reserverPhone: '010-2222-3333', pickupTime: '18:30' },
  { id: 9002, storeId: 2, storeName: 'CU 역삼역점', itemId: 201, itemName: '백종원 매콤도시락', price: '4,900원', status: '예약 확정', reservedAt: new Date(Date.now() - 3 * 864e5).toISOString(), reserverName: '정다은', reserverPhone: '010-4444-5555', pickupTime: '19:00' },
  { id: 9003, storeId: 3, storeName: '세븐일레븐 논현점', itemId: 301, itemName: '유부초밥 세트', price: '3,800원', status: '수령 완료', reservedAt: new Date(Date.now() - 5 * 864e5).toISOString(), reserverName: '한지우', reserverPhone: '010-6666-7777', pickupTime: '13:30' },
  // 관리자 "예약자 확인" 데모용 (GS25 강남테헤란점 도시락 예약자 3명)
  { id: 9101, storeId: 1, storeName: 'GS25 강남테헤란점', itemId: 101, itemName: '메가로운 GS도시락', price: '4,500원', status: '예약 대기', reservedAt: new Date(Date.now() - 2 * 36e5).toISOString(), reserverName: '김민준', reserverPhone: '010-1234-5678', pickupTime: '12:00', demo: true },
  { id: 9102, storeId: 1, storeName: 'GS25 강남테헤란점', itemId: 101, itemName: '메가로운 GS도시락', price: '4,500원', status: '예약 확정', reservedAt: new Date(Date.now() - 1 * 36e5).toISOString(), reserverName: '이서연', reserverPhone: '010-9876-5432', pickupTime: '12:30', demo: true },
  { id: 9103, storeId: 1, storeName: 'GS25 강남테헤란점', itemId: 101, itemName: '메가로운 GS도시락', price: '4,500원', status: '예약 대기', reservedAt: new Date(Date.now() - 30 * 6e4).toISOString(), reserverName: '박지호', reserverPhone: '010-5555-1234', pickupTime: '13:00', demo: true }
];

/* =========================================================
 *  SampleAPI — apiFetch 가 백엔드 대신 호출하는 UI용 데이터 핸들러
 *  예약/취소로 바뀐 상태가 페이지 이동 후에도 유지되도록 localStorage 에 보관합니다.
 * =======================================================*/
const SampleAPI = (function () {
  const KEY = { stores: 'savebite_sample_stores', reservations: 'savebite_sample_reservations', version: 'savebite_sample_version' };
  const VERSION = '3';
  // 관리자 계정이 관리하는 가게 (데모: 첫 번째 가게). 관리자↔가게 매핑을 여기 한 곳에서 관리합니다.
  const ADMIN_STORE_ID = 1;

  function seed() {
    const fresh = localStorage.getItem(KEY.version) !== VERSION;
    if (fresh || !localStorage.getItem(KEY.stores)) {
      localStorage.setItem(KEY.stores, JSON.stringify(SAMPLE_STORES));
    }
    if (fresh || !localStorage.getItem(KEY.reservations)) {
      localStorage.setItem(KEY.reservations, JSON.stringify(SAMPLE_RESERVATIONS));
    }
    localStorage.setItem(KEY.version, VERSION);
  }
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } };
  const write = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };

  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371, toRad = (d) => d * Math.PI / 180;
    const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function withSoldOut(reservations, stores) {
    return reservations.map((r) => {
      const store = stores.find((s) => s.id === r.storeId);
      const item = store && (store.items || []).find((i) => i.id === r.itemId);
      return { ...r, itemSoldOut: !!(item && item.stock <= 0) };
    });
  }

  function route(method, path, params, body) {
    const stores = read(KEY.stores);
    const reservations = read(KEY.reservations);

    // 가게 목록 (위치가 있으면 가까운 순 정렬) — UI 확인용이라 반경 필터 없이 모두 노출
    if (method === 'GET' && path === '/api/stores') {
      const lat = parseFloat(params.get('lat'));
      const lng = parseFloat(params.get('lng'));
      let list = stores.map(({ items, ...summary }) => summary);
      if (!isNaN(lat) && !isNaN(lng)) {
        list = list
          .map((s) => ({ ...s, distanceKm: Number(haversineKm(lat, lng, s.lat, s.lng).toFixed(2)) }))
          .sort((a, b) => a.distanceKm - b.distanceKm);
      }
      return list;
    }

    // 가게 상세
    const storeMatch = path.match(/^\/api\/stores\/(\d+)$/);
    if (method === 'GET' && storeMatch) {
      const store = stores.find((s) => s.id === Number(storeMatch[1]));
      if (!store) fail(404, '존재하지 않는 가게입니다.');
      return JSON.parse(JSON.stringify(store));
    }

    // 예약 목록 (demo 예약자는 관리자 화면 전용이므로 사용자 마이페이지에서 제외)
    if (method === 'GET' && path === '/api/reservations') {
      return withSoldOut(reservations.filter((r) => !r.demo), stores);
    }

    // 예약 생성
    if (method === 'POST' && path === '/api/reservations') {
      const store = stores.find((s) => s.id === body.storeId);
      const item = store && (store.items || []).find((i) => i.id === body.itemId);
      if (!store || !item) fail(404, '존재하지 않는 상품입니다.');
      if (item.stock <= 0) fail(409, '이 상품은 예약이 마감되었습니다.');
      item.stock -= 1;
      write(KEY.stores, stores);
      // 로그인한 사용자 정보를 예약자 정보로 첨부 (관리자 "예약자 확인"에서 표시)
      let reserverName = '사용자', reserverPhone = '';
      try {
        const sess = JSON.parse(localStorage.getItem('savebite_session')) || {};
        if (sess.email) {
          reserverName = sess.email.split('@')[0];
          const users = JSON.parse(localStorage.getItem('savebite_users')) || [];
          const u = users.find((x) => x.email && x.email.toLowerCase() === sess.email.toLowerCase());
          if (u && u.phone) reserverPhone = u.phone;
        }
      } catch (e) { /* 세션 없음 */ }
      const now = new Date();
      const reservation = {
        id: Date.now(), storeId: store.id, storeName: store.name,
        itemId: item.id, itemName: item.name, price: item.price,
        status: '예약 대기', reservedAt: now.toISOString(),
        reserverName, reserverPhone,
        pickupTime: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
      };
      reservations.push(reservation);
      write(KEY.reservations, reservations);
      return reservation;
    }

    // 예약 취소
    const cancelMatch = path.match(/^\/api\/reservations\/(\d+)\/cancel$/);
    if (method === 'PATCH' && cancelMatch) {
      const r = reservations.find((x) => x.id === Number(cancelMatch[1]));
      if (!r) fail(404, '존재하지 않는 예약입니다.');
      if (r.status !== '예약 대기') fail(409, '이미 상품 준비가 시작되어 예약을 취소할 수 없습니다.');
      r.status = '취소됨';
      const store = stores.find((s) => s.id === r.storeId);
      const item = store && (store.items || []).find((i) => i.id === r.itemId);
      if (item) item.stock += 1;
      write(KEY.stores, stores);
      write(KEY.reservations, reservations);
      return { ok: true };
    }

    // 길찾기 (UI 표시용 직선 경로) — 실제 도로/보행 경로는 백엔드 연결 시 제공됩니다.
    // 정규화 형식: { mode, path: [[경도,위도], ...], distanceM, durationSec }
    if (method === 'GET' && path === '/api/directions') {
      const [ox, oy] = (params.get('origin') || '').split(',').map(Number);
      const [dx, dy] = (params.get('destination') || '').split(',').map(Number);
      if ([ox, oy, dx, dy].some((n) => isNaN(n))) fail(400, 'origin/destination 필요');
      const mode = params.get('mode') === 'walk' ? 'walk' : 'car';
      const distanceM = Math.round(haversineKm(oy, ox, dy, dx) * 1000);
      const speedKmh = mode === 'walk' ? 4.5 : 30; // 도보 4.5km/h, 차량 30km/h(시내) 가정
      const durationSec = Math.round((distanceM / 1000) / speedKmh * 3600);
      return { mode, path: [[ox, oy], [dx, dy]], distanceM, durationSec };
    }

    // ---------- 관리자 API (관리자 페이지 전용) ----------
    // 관리자가 관리하는 가게 상세 (숨김 상품 포함, 사용자 API 와 달리 hidden 도 그대로 반환)
    if (method === 'GET' && path === '/api/admin/store') {
      const store = stores.find((s) => s.id === ADMIN_STORE_ID);
      if (!store) fail(404, '관리 대상 가게를 찾을 수 없습니다.');
      return JSON.parse(JSON.stringify(store));
    }

    // 상품 추가
    if (method === 'POST' && path === '/api/admin/store/items') {
      const store = stores.find((s) => s.id === ADMIN_STORE_ID);
      if (!store) fail(404, '관리 대상 가게를 찾을 수 없습니다.');
      const name = (body.name || '').trim();
      const priceNum = Number(body.price);
      const total = Math.floor(Number(body.total));
      if (!name) fail(400, '상품 이름을 입력해 주세요.');
      if (name.length > 30) fail(400, '상품 이름은 최대 30자까지 입력할 수 있습니다.');
      if (!Number.isFinite(priceNum) || priceNum < 0) fail(400, '판매 가격이 올바르지 않습니다.');
      if (!Number.isFinite(total) || total < 1) fail(400, '예약 가능 수량이 올바르지 않습니다.');
      const item = {
        id: Date.now(),
        name,
        price: priceNum.toLocaleString('ko-KR') + '원',
        total,
        stock: total // 재고 = 전체 수량 (예약 0개로 시작)
      };
      store.items = store.items || [];
      store.items.push(item);
      write(KEY.stores, stores);
      return item;
    }

    // 상품별 예약자 목록 (예약 대기/확정만)
    const adminResMatch = path.match(/^\/api\/admin\/store\/items\/(\d+)\/reservations$/);
    if (method === 'GET' && adminResMatch) {
      const itemId = Number(adminResMatch[1]);
      return reservations
        .filter((r) => r.storeId === ADMIN_STORE_ID && r.itemId === itemId && (r.status === '예약 대기' || r.status === '예약 확정'))
        .map((r) => ({ id: r.id, name: r.reserverName || '사용자', phone: r.reserverPhone || '', pickupTime: r.pickupTime || '', status: r.status }));
    }

    // 긴급 품절 처리: 재고 0 + 해당 상품의 활성 예약 일괄 취소 (안내 플래그 부여)
    const soldoutMatch = path.match(/^\/api\/admin\/store\/items\/(\d+)\/soldout$/);
    if (method === 'POST' && soldoutMatch) {
      const store = stores.find((s) => s.id === ADMIN_STORE_ID);
      const itemId = Number(soldoutMatch[1]);
      const item = store && (store.items || []).find((i) => i.id === itemId);
      if (!item) fail(404, '존재하지 않는 상품입니다.');
      item.stock = 0;
      let canceledCount = 0;
      reservations.forEach((r) => {
        if (r.storeId === ADMIN_STORE_ID && r.itemId === itemId && (r.status === '예약 대기' || r.status === '예약 확정')) {
          r.status = '취소됨';
          r.canceledBySoldOut = true; // 사용자 화면 긴급 안내 배너용
          canceledCount++;
        }
      });
      write(KEY.stores, stores);
      write(KEY.reservations, reservations);
      return { ok: true, canceledCount };
    }

    // 상품 수정 / 삭제
    const adminItemMatch = path.match(/^\/api\/admin\/store\/items\/(\d+)$/);
    if (adminItemMatch) {
      const store = stores.find((s) => s.id === ADMIN_STORE_ID);
      if (!store) fail(404, '관리 대상 가게를 찾을 수 없습니다.');
      const itemId = Number(adminItemMatch[1]);
      const idx = (store.items || []).findIndex((i) => i.id === itemId);
      if (idx < 0) fail(404, '존재하지 않는 상품입니다.');
      if (method === 'DELETE') {
        store.items.splice(idx, 1);
        write(KEY.stores, stores);
        return { ok: true };
      }
      if (method === 'PATCH') {
        const item = store.items[idx];
        const name = (body.name || '').trim();
        const priceNum = Number(body.price);
        const total = Math.floor(Number(body.total));
        if (!name) fail(400, '상품 이름을 입력해 주세요.');
        if (name.length > 30) fail(400, '상품 이름은 최대 30자까지 입력할 수 있습니다.');
        if (!Number.isFinite(priceNum) || priceNum < 0) fail(400, '판매 가격이 올바르지 않습니다.');
        if (!Number.isFinite(total) || total < 1) fail(400, '예약 가능 수량이 올바르지 않습니다.');
        const reserved = Math.max(0, (item.total != null ? item.total : item.stock) - item.stock);
        if (total < reserved) fail(400, `예약 가능 수량은 현재 예약(${reserved}건)보다 적을 수 없습니다.`);
        item.name = name;
        item.price = priceNum.toLocaleString('ko-KR') + '원';
        item.total = total;
        item.stock = total - reserved;
        write(KEY.stores, stores);
        return JSON.parse(JSON.stringify(item));
      }
    }

    fail(404, '알 수 없는 요청: ' + method + ' ' + path);
  }

  function handle(rawPath, options = {}) {
    seed();
    const method = (options.method || 'GET').toUpperCase();
    const [path, query] = rawPath.split('?');
    const params = new URLSearchParams(query || '');
    let body = {};
    try { body = options.body ? JSON.parse(options.body) : {}; } catch (e) { body = {}; }
    return new Promise((resolve, reject) => {
      setTimeout(() => { try { resolve(route(method, path, params, body)); } catch (e) { reject(e); } }, 150);
    });
  }

  return { handle };
})();
