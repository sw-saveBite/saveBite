(function () {
  // 로그인 가드 (REQUIRE_LOGIN 이 true 일 때만 동작)
  if (!Session.guard('../UserLoginPage/UserLoginPage.html')) return;

  // ---------- elements ----------
  const listArea = document.getElementById('listArea');
  const mapEl = document.getElementById('map');
  const mapError = document.getElementById('mapError');
  const mapErrorText = document.getElementById('mapErrorText');
  const emergency = document.getElementById('emergency');
  const emergencyText = document.getElementById('emergencyText');
  const reserveModal = document.getElementById('reserveModal');
  const reserveStore = document.getElementById('reserveStore');
  const reserveName = document.getElementById('reserveName');
  const reservePrice = document.getElementById('reservePrice');
  const reserveStock = document.getElementById('reserveStock');
  const reserveCancel = document.getElementById('reserveCancel');
  const reserveConfirm = document.getElementById('reserveConfirm');

  // ---------- state ----------
  let stores = [];
  let selectedStore = null;
  let pendingItem = null;
  let isSubmitting = false;
  let myPos = null;
  let kakaoMap = null;
  let routePolyline = null;
  let destMarker = null;
  let routeMode = 'car';        // 'car'(차량) | 'walk'(도보)
  let lastRouteStoreId = null;

  const params = new URLSearchParams(location.search);
  const routeStoreId = params.get('route');

  const badgeClass = (status) => status === '영업 중' ? 'open' : status === '준비 중' ? 'prep' : 'closed';

  function isOpenNow(store) {
    if (store.status !== '영업 중') return false;
    if (!store.hours) return true;
    const parts = store.hours.split('-').map((s) => s.trim());
    if (parts.length !== 2) return true; // "24시간 운영" 등은 영업 중으로 처리
    const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
    const now = new Date();
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= toMin(parts[0]) && cur <= toMin(parts[1]);
  }

  function showMapError(msg) {
    mapEl.classList.add('hidden');
    mapError.classList.remove('hidden');
    mapErrorText.textContent = msg;
  }

  // ---------- 초기화: 현재 위치 → 지도 → 가게 ----------
  async function init() {
    try {
      myPos = await getCurrentPosition();
    } catch (err) {
      myPos = null;
      showMapError(geoErrorMessage(err));
    }
    if (myPos) await setupMap();
    await loadStores();
    loadEmergency();
    if (routeStoreId && APP_CONFIG.SHOW_DIRECTIONS) openRoute(routeStoreId, routeMode);
  }

  function geoErrorMessage(err) {
    const code = err && err.code;
    if (code === 1) return '위치 권한이 거부되었습니다. 브라우저 주소창의 위치 아이콘에서 허용한 뒤 새로고침해 주세요.';
    if (code === 2) return '현재 위치를 확인할 수 없습니다. 잠시 후 새로고침해 주세요.';
    if (code === 3) return '위치 확인 시간이 초과되었습니다. 새로고침을 시도해 주세요.';
    if (code === 'NO_SUPPORT') return err.message;
    return '현재 위치를 가져오지 못했습니다. 위치 권한을 허용한 뒤 새로고침해 주세요.';
  }

  // ---------- 지도 (내 위치 중심 + 내 위치 표시) ----------
  async function setupMap() {
    try {
      await loadKakaoMaps();
    } catch (e) {
      showMapError('지도를 불러오지 못했습니다. 새로고침을 시도해 주세요.');
      return;
    }
    try {
      const center = new window.kakao.maps.LatLng(myPos.lat, myPos.lng);
      kakaoMap = new window.kakao.maps.Map(mapEl, { center, level: 5 });
      const meEl = document.createElement('div');
      meEl.className = 'map-me';
      new window.kakao.maps.CustomOverlay({ position: center, content: meEl, zIndex: 5, map: kakaoMap });
    } catch (e) {
      showMapError('지도를 불러오지 못했습니다. 새로고침을 시도해 주세요.');
    }
  }

  // ---------- 가게 목록 로드 ----------
  async function loadStores() {
    try {
      stores = myPos
        ? await apiFetch(`/api/stores?lat=${myPos.lat}&lng=${myPos.lng}&radius=3`)
        : await apiFetch('/api/stores?radius=3');
    } catch (e) {
      stores = [];
    }
    if (!Array.isArray(stores)) stores = [];
    renderList();
    addStoreMarkers();
  }

  function addStoreMarkers() {
    if (!kakaoMap || !window.kakao) return;
    stores.forEach((s) => {
      if (!s.lat || !s.lng) return;
      const pin = document.createElement('div');
      pin.className = 'map-pin ' + badgeClass(s.status);
      pin.innerHTML = '<i class="ph ph-storefront"></i>';
      pin.addEventListener('click', () => openStore(s.id));
      new window.kakao.maps.CustomOverlay({
        position: new window.kakao.maps.LatLng(s.lat, s.lng),
        content: pin, yAnchor: 1, map: kakaoMap
      });
    });
  }

  // ---------- 리스트 렌더 ----------
  function renderList() {
    selectedStore = null;
    if (!stores.length) {
      listArea.innerHTML = '<p class="empty">근처에 등록된 가게가 없습니다.</p>';
      return;
    }
    const cards = stores.map((s) => `
      <div class="store-card" data-id="${s.id}">
        <div class="sc-top">
          <h3>${escapeHtml(s.name)}</h3>
          <span class="badge ${badgeClass(s.status)}">${escapeHtml(s.status || '')}</span>
        </div>
        <p class="sc-row"><i class="ph ph-map-pin"></i> ${escapeHtml(s.address || '')}</p>
        <p class="sc-row"><i class="ph ph-clock"></i> ${escapeHtml(s.hours || '')}</p>
        <p class="sc-row"><i class="ph ph-phone"></i> ${escapeHtml(s.phone || '')}</p>
        <div class="sc-bottom">
          <span class="sc-dist">${s.distanceKm != null ? s.distanceKm + 'km' : ''}</span>
          <span class="sc-link">상품 보기 <i class="ph ph-caret-right"></i></span>
        </div>
      </div>`).join('');
    listArea.innerHTML = `<div class="list-head">주변 가게 <b>${stores.length}곳</b></div>` + cards;
    listArea.querySelectorAll('.store-card').forEach((el) => {
      el.addEventListener('click', () => openStore(Number(el.dataset.id)));
    });
  }

  // ---------- 상세(상품) 렌더 ----------
  async function openStore(id) {
    try { selectedStore = await apiFetch(`/api/stores/${id}`); }
    catch (e) { selectedStore = stores.find((s) => s.id === Number(id)) || null; }
    if (!selectedStore) return;
    renderDetail();
  }

  function renderDetail() {
    const s = selectedStore;
    const items = (s.items || []).filter((it) => !it.hidden);
    const itemsHtml = items.length
      ? items.map((it) => {
          const sold = it.stock <= 0;
          const total = it.total != null ? it.total : it.stock;
          const reserved = Math.max(0, total - it.stock);
          const pct = total > 0 ? Math.round(reserved / total * 100) : 0;
          return `
            <div class="product ${sold ? 'sold' : ''}">
              <div class="p-top">
                <span class="p-name">${escapeHtml(it.name)}</span>
                <span class="p-status ${sold ? 'out' : 'on'}">${sold ? '품절' : '판매중'}</span>
              </div>
              <div class="p-mid">
                <span class="p-price">${escapeHtml(it.price || '')}</span>
                <span class="p-stock ${sold ? 'out' : ''}">${reserved}/${total}개</span>
              </div>
              <div class="p-bar"><div class="p-bar-fill ${sold ? 'out' : ''}" style="width:${pct}%"></div></div>
              ${sold ? '' : `<button class="p-reserve" data-id="${it.id}">예약하기 <i class="ph ph-arrow-right"></i></button>`}
            </div>`;
        }).join('')
      : '<p class="empty">아직 등록된 상품이 없습니다.</p>';

    listArea.innerHTML = `
      <button class="back-btn" id="backToList"><i class="ph ph-arrow-left"></i> 목록으로</button>
      <div class="detail-head">
        <div class="dh-top">
          <h2>${escapeHtml(s.name)}</h2>
          <span class="badge ${badgeClass(s.status)}">${escapeHtml(s.status || '')}</span>
        </div>
        <p class="sc-row"><i class="ph ph-map-pin"></i> ${escapeHtml(s.address || '')}</p>
        <p class="sc-row"><i class="ph ph-clock"></i> ${escapeHtml(s.hours || '')}</p>
        <p class="sc-row"><i class="ph ph-phone"></i> ${escapeHtml(s.phone || '')}</p>
        ${APP_CONFIG.SHOW_DIRECTIONS ? `
        <div class="route-box">
          <div class="mode-toggle" id="modeToggle">
            <button type="button" data-mode="car" class="${routeMode === 'car' ? 'active' : ''}"><i class="ph ph-car"></i> 차량</button>
            <button type="button" data-mode="walk" class="${routeMode === 'walk' ? 'active' : ''}"><i class="ph ph-person-simple-walk"></i> 도보</button>
          </div>
          <button class="route-btn" id="routeFromDetail"><i class="ph ph-navigation-arrow"></i> 길찾기</button>
        </div>` : ''}
      </div>
      <h4 class="section-title">상품 목록</h4>
      ${itemsHtml}
    `;

    document.getElementById('backToList').addEventListener('click', renderList);
    if (APP_CONFIG.SHOW_DIRECTIONS) {
      document.getElementById('routeFromDetail').addEventListener('click', () => openRoute(s.id, routeMode));
      listArea.querySelectorAll('#modeToggle button').forEach((btn) => {
        btn.addEventListener('click', () => {
          routeMode = btn.dataset.mode;
          listArea.querySelectorAll('#modeToggle button').forEach((b) => b.classList.toggle('active', b === btn));
          if (lastRouteStoreId === s.id) openRoute(s.id, routeMode);
        });
      });
    }
    listArea.querySelectorAll('.p-reserve').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = items.find((it) => String(it.id) === btn.dataset.id);
        onReserveClick(item);
      });
    });
  }

  function onReserveClick(item) {
    if (!item) return;
    if (item.stock <= 0) { alert('이 상품은 예약이 마감되었습니다.'); return; }
    if (!isOpenNow(selectedStore)) { alert('현재는 영업시간이 아니어서 예약할 수 없습니다.'); return; }
    pendingItem = item;
    reserveStore.textContent = selectedStore.name;
    reserveName.textContent = item.name;
    reservePrice.textContent = item.price || '';
    reserveStock.textContent = `잔여 예약 ${item.stock}개`;
    reserveModal.classList.remove('hidden');
  }

  // ---------- 예약 (연속 클릭 방지 + 실시간 재확인) ----------
  reserveCancel.addEventListener('click', closeModal);
  reserveConfirm.addEventListener('click', async () => {
    if (isSubmitting || !pendingItem) return;
    isSubmitting = true;
    reserveConfirm.disabled = true;
    reserveCancel.disabled = true;
    reserveConfirm.textContent = '처리 중...';
    try {
      await apiFetch('/api/reservations', {
        method: 'POST',
        body: JSON.stringify({ storeId: selectedStore.id, itemId: pendingItem.id })
      });
      alert('예약이 성공적으로 완료되었습니다.');
      closeModal();
      openStore(selectedStore.id); // 재고 갱신 반영
    } catch (err) {
      if (err.status === 409) alert('이 상품은 예약이 마감되었습니다.');
      else alert(err.message || '예약 중 오류가 발생했습니다.');
      closeModal();
    }
  });

  function closeModal() {
    reserveModal.classList.add('hidden');
    isSubmitting = false;
    pendingItem = null;
    reserveConfirm.disabled = false;
    reserveCancel.disabled = false;
    reserveConfirm.textContent = '예약하기';
  }

  // ---------- 긴급품절 안내 ----------
  async function loadEmergency() {
    let reservations = [];
    try { reservations = await apiFetch('/api/reservations'); } catch (e) { return; }
    // 긴급 품절로 일괄 취소된 예약 안내가 우선, 없으면 활성 예약 중 품절 상품 안내
    const canceled = (reservations || []).find((r) => r.status === '취소됨' && r.canceledBySoldOut);
    const soldOut = (reservations || []).find((r) => (r.status === '예약 대기' || r.status === '예약 확정') && r.itemSoldOut);
    if (canceled) {
      emergencyText.innerHTML = `<i class="ph ph-warning-circle"></i> 예약하신 <strong>${escapeHtml(canceled.itemName)}</strong> 상품이 긴급 품절되어 예약이 취소되었습니다. 마이페이지에서 확인해 주세요.`;
      emergency.classList.remove('hidden');
    } else if (soldOut) {
      emergencyText.innerHTML = `<i class="ph ph-warning-circle"></i> 예약하신 <strong>${escapeHtml(soldOut.itemName)}</strong> 상품이 품절되었습니다. 마이페이지에서 확인해 주세요.`;
      emergency.classList.remove('hidden');
    }
  }
  document.getElementById('emergencyClose').addEventListener('click', () => emergency.classList.add('hidden'));

  // ---------- 길찾기 (도보/차량) ----------
  // 백엔드 응답 형식(정규화): { path: [[경도,위도], ...], distanceM, durationSec }
  async function openRoute(id, mode) {
    routeMode = mode || routeMode || 'car';
    let target;
    try { target = await apiFetch(`/api/stores/${id}`); }
    catch (e) { target = stores.find((s) => s.id === Number(id)); }
    if (!target || !target.lat || !target.lng) { alert('가게 위치 정보가 등록되지 않았습니다.'); return; }
    if (!myPos) { alert('현재 위치를 확인할 수 없습니다. 위치 권한을 허용한 뒤 다시 시도해 주세요.'); return; }
    if (!kakaoMap) { openStore(id); return; }

    const origin = `${myPos.lng},${myPos.lat}`;
    const destination = `${target.lng},${target.lat}`;
    try {
      let data = null;
      // 도보: TMap 보행자 API 직접 호출 (백엔드 미연동 + appKey 가 있을 때). 실패 시 아래 폴백 사용.
      if (routeMode === 'walk' && !APP_CONFIG.API_BASE && APP_CONFIG.TMAP_APP_KEY) {
        try { data = await fetchTmapWalkRoute(origin, destination); }
        catch (e) { data = null; }
      }
      if (!data) {
        data = await apiFetch(`/api/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&mode=${routeMode}`);
      }
      if (!data || !Array.isArray(data.path) || data.path.length < 2) {
        alert('경로를 찾을 수 없습니다.');
        openStore(id);
        return;
      }
      lastRouteStoreId = Number(id);
      drawRoute(data, target, routeMode);
      openStore(id);
    } catch (err) {
      alert('길찾기 정보를 불러오지 못했습니다.');
      openStore(id);
    }
  }

  function drawRoute(data, target, mode) {
    if (routePolyline) routePolyline.setMap(null);
    if (destMarker) destMarker.setMap(null);

    const path = data.path.map(([lng, lat]) => new window.kakao.maps.LatLng(lat, lng));
    const style = mode === 'walk'
      ? { color: '#1f8a4c', dash: 'shortdash' }   // 도보: 초록 점선
      : { color: '#2a3a50', dash: 'solid' };       // 차량: 남색 실선

    routePolyline = new window.kakao.maps.Polyline({
      path, strokeWeight: 6, strokeColor: style.color, strokeOpacity: 0.9, strokeStyle: style.dash, map: kakaoMap
    });
    destMarker = new window.kakao.maps.Marker({
      position: new window.kakao.maps.LatLng(target.lat, target.lng), map: kakaoMap
    });

    const bounds = new window.kakao.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    kakaoMap.setBounds(bounds);

    showRouteInfo(mode, data.distanceM, data.durationSec);
  }

  function showRouteInfo(mode, distanceM, durationSec) {
    const el = document.getElementById('routeInfo');
    if (!el) return;
    const icon = mode === 'walk' ? 'ph-person-simple-walk' : 'ph-car';
    const label = mode === 'walk' ? '도보' : '차량';
    const parts = [`<i class="ph ${icon}"></i> ${label}`];
    if (distanceM != null) parts.push((distanceM / 1000).toFixed(1) + 'km');
    if (durationSec != null) parts.push('약 ' + Math.max(1, Math.round(durationSec / 60)) + '분');
    el.innerHTML = parts.join(' · ');
    el.classList.remove('hidden');
  }

  // ---------- 로그아웃 ----------
  document.getElementById('logoutBtn').addEventListener('click', () => {
    Session.clear();
    window.location.href = '../UserLoginPage/UserLoginPage.html';
  });

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  init();
})();
