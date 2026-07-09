(function () {
  // 관리자 로그인 가드 (미로그인 시 관리자 로그인 페이지로)
  if (!AdminSession.guard('../AdminLoginPage/AdminLoginPage.html')) return;

  // ---------- elements ----------
  const storeName = document.getElementById('storeName');
  const storeAddress = document.getElementById('storeAddress');
  const productList = document.getElementById('productList');
  const openFlag = document.getElementById('openFlag');
  const openText = document.getElementById('openText');
  const statTotal = document.getElementById('statTotal');
  const statOnSale = document.getElementById('statOnSale');
  const statSoldOut = document.getElementById('statSoldOut');
  const statReserved = document.getElementById('statReserved');
  const mapEl = document.getElementById('map');
  const mapCard = document.getElementById('mapCard');
  const mapFallback = document.getElementById('mapFallback');
  const mapFallbackText = document.getElementById('mapFallbackText');
  const reserversModal = document.getElementById('reserversModal');
  const reserversItemName = document.getElementById('reserversItemName');
  const reserverList = document.getElementById('reserverList');
  const soldoutModal = document.getElementById('soldoutModal');
  const soldoutItemName = document.getElementById('soldoutItemName');
  const soldoutText = document.getElementById('soldoutText');
  const soldoutConfirm = document.getElementById('soldoutConfirm');
  const deleteModal = document.getElementById('deleteModal');
  const deleteItemName = document.getElementById('deleteItemName');
  const deleteConfirm = document.getElementById('deleteConfirm');

  let store = null;
  let openMenuId = null;
  let soldoutTarget = null;
  let deleteTarget = null;
  const ACTIVE_RESERVATION_STATUSES = ['예약대기', '예약확정', '준비중', '준비완료'];

  // ---------- 초기화 ----------
  async function init() {
    try {
      store = await apiFetch('/api/admin/store');
    } catch (e) {
      productList.innerHTML = '<p class="empty">가게 정보를 불러오지 못했습니다.</p>';
      return;
    }
    renderStoreHead();
    renderProducts();
    renderStats();
    setupMap();
  }

  function renderStoreHead() {
    storeName.textContent = store.name || '가게';
    storeAddress.textContent = store.address || '';
    const open = store.status === '영업중' || store.status === '영업 중';
    openText.textContent = store.status === '영업중' ? '영업 중' : (store.status || '');
    openFlag.classList.toggle('closed', !open);
  }

  // ---------- 상품 목록 ----------
  function itemStats(it) {
    const total = it.total != null ? it.total : it.stock;
    const reserved = Math.max(0, total - it.stock);
    const soldOut = it.stock <= 0;
    const pct = total > 0 ? Math.round(reserved / total * 100) : 0;
    return { total, reserved, soldOut, pct };
  }

  function renderProducts() {
    const items = store.items || [];
    if (!items.length) {
      productList.innerHTML = '<p class="empty">등록된 상품이 없습니다.<br>우측 상단 “추가”로 상품을 등록하세요.</p>';
      return;
    }
    productList.innerHTML = items.map((it) => {
      const { total, reserved, soldOut, pct } = itemStats(it);
      const badges = [
        soldOut ? '<span class="badge out">품절</span>' : '<span class="badge on">판매중</span>',
        (!soldOut && reserved > 0) ? `<span class="badge res">예약 ${reserved}</span>` : '',
        it.hidden ? '<span class="badge out">숨김</span>' : ''
      ].join('');
      return `
        <div class="pcard ${it.hidden ? 'hiddenItem' : ''}" data-id="${it.id}">
          <div class="pcard-badges">${badges}</div>
          <button type="button" class="pcard-menu" data-menu="${it.id}"><i class="ph ph-dots-three-vertical"></i></button>
          <p class="pcard-name">${escapeHtml(it.name)}</p>
          <p class="pcard-price">${escapeHtml(it.price || '')}</p>
          <div class="pcard-resrow"><span>예약</span><span>${reserved}/${total}</span></div>
          <div class="pbar"><div class="pbar-fill ${soldOut ? 'out' : ''}" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');

    productList.querySelectorAll('[data-menu]').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(Number(btn.dataset.menu)); });
    });
  }

  // ---------- ⋮ 메뉴 (상태별로 항목이 달라짐) ----------
  //  판매중: 예약자 확인 · 수정 · 긴급 품절
  //  품절  : 예약자 확인 · 삭제
  function toggleMenu(id) {
    if (openMenuId === id) { closeMenu(); return; }
    closeMenu();
    openMenuId = id;
    const card = productList.querySelector(`.pcard[data-id="${id}"]`);
    if (!card) return;
    const item = (store.items || []).find((i) => i.id === id);
    if (!item) return;
    const { soldOut } = itemStats(item);
    const pop = document.createElement('div');
    pop.className = 'menu-pop';
    pop.innerHTML = soldOut
      ? `
      <button data-act="reservers"><i class="ph ph-users"></i> 예약자 확인</button>
      <button data-act="delete" class="danger"><i class="ph ph-trash"></i> 삭제</button>`
      : `
      <button data-act="reservers"><i class="ph ph-users"></i> 예약자 확인</button>
      ${soldOut ? '' : '<button data-act="edit"><i class="ph ph-pencil-simple"></i> 수정</button>'}
      ${soldOut ? '<button data-act="delete" class="danger"><i class="ph ph-trash"></i> 삭제</button>' : '<button data-act="soldout" class="warn"><i class="ph ph-warning"></i> 긴급 품절</button>'}`;
    card.appendChild(pop);
    pop.querySelector('[data-act="reservers"]').addEventListener('click', (e) => { e.stopPropagation(); openReservers(item); });
    const editButton = pop.querySelector('[data-act="edit"]');
    if (editButton) {
      editButton.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = `../AdminProductAddPage/AdminProductAddPage.html?id=${item.id}`;
      });
    }
    const soldoutButton = pop.querySelector('[data-act="soldout"]');
    if (soldoutButton) {
      soldoutButton.addEventListener('click', (e) => { e.stopPropagation(); openSoldout(item); });
    }
    const deleteButton = pop.querySelector('[data-act="delete"]');
    if (deleteButton) {
      deleteButton.addEventListener('click', (e) => { e.stopPropagation(); openDelete(item); });
    }
  }

  function closeMenu() {
    const pop = productList.querySelector('.menu-pop');
    if (pop) pop.remove();
    openMenuId = null;
  }
  document.addEventListener('click', closeMenu);

  // ---------- 예약자 확인 모달 ----------
  async function openReservers(item) {
    closeMenu();
    reserversItemName.textContent = item.name;
    reserverList.innerHTML = '<p class="empty">불러오는 중...</p>';
    reserversModal.classList.remove('hidden');
    try {
      const all = await apiFetch('/api/admin/reservations');
      const list = (all || []).filter((r) => Number(r.product_id) === Number(item.id) && isActiveReservation(r));
      reserverList.innerHTML = (list && list.length)
        ? list.map((r) => `
            <div class="reserver-row">
              <div>
                <b>${escapeHtml(formatPhone(r.user_phone) || '연락처 없음')}</b>
                <p>${escapeHtml(r.status || '-')}</p>
              </div>
              ${r.create_at ? `<span class="time-chip">${escapeHtml(new Date(r.create_at).toLocaleString('ko-KR'))}</span>` : ''}
            </div>`).join('')
        : '<p class="empty">아직 예약자가 없습니다.</p>';
    } catch (e) {
      reserverList.innerHTML = '<p class="empty">예약자 목록을 불러오지 못했습니다.</p>';
    }
  }
  document.getElementById('reserversClose').addEventListener('click', () => reserversModal.classList.add('hidden'));
  reserversModal.addEventListener('click', (e) => { if (e.target === reserversModal) reserversModal.classList.add('hidden'); });

  // ---------- 긴급 품절 처리 모달 ----------
  async function openSoldout(item) {
    closeMenu();
    soldoutTarget = item;
    soldoutItemName.textContent = item.name;
    let count = 0;
    try {
      const all = await apiFetch('/api/admin/reservations');
      count = ((all || []).filter((r) => Number(r.product_id) === Number(item.id) && isActiveReservation(r))).length;
    }
    catch (e) { /* 예약자 수 조회 실패 시 0명으로 표시 */ }
    soldoutText.innerHTML = `현재 <b>${count}명</b>의 예약자가 있습니다. 긴급 품절 시 예약은 일괄 취소되며 안내 메시지가 발송됩니다. 진행하시겠습니까?`;
    soldoutConfirm.disabled = false;
    soldoutModal.classList.remove('hidden');
  }
  document.getElementById('soldoutCancel').addEventListener('click', closeSoldout);
  soldoutModal.addEventListener('click', (e) => { if (e.target === soldoutModal) closeSoldout(); });
  function closeSoldout() {
    soldoutModal.classList.add('hidden');
    soldoutTarget = null;
  }
  soldoutConfirm.addEventListener('click', async () => {
    if (!soldoutTarget) return;
    soldoutConfirm.disabled = true;
    try {
      await apiFetch(`/api/admin/products/${soldoutTarget.id}/emergency-soldout`, {
        method: 'PATCH',
        body: JSON.stringify({ cancel_reason: '관리자 긴급 품절 처리' })
      });
      alert('긴급 품절 처리되었습니다.');
      closeSoldout();
      await refresh();
    } catch (e) {
      alert(e.message || '품절 처리 중 오류가 발생했습니다.');
      soldoutConfirm.disabled = false;
    }
  });

  // ---------- 품절 상품 삭제 ----------
  function openDelete(item) {
    closeMenu();
    deleteTarget = item;
    deleteItemName.textContent = item.name;
    deleteConfirm.disabled = false;
    deleteModal.classList.remove('hidden');
  }
  document.getElementById('deleteCancel').addEventListener('click', closeDelete);
  deleteModal.addEventListener('click', (e) => { if (e.target === deleteModal) closeDelete(); });
  function closeDelete() {
    deleteModal.classList.add('hidden');
    deleteTarget = null;
  }
  deleteConfirm.addEventListener('click', async () => {
    if (!deleteTarget) return;
    deleteConfirm.disabled = true;
    try {
      await apiFetch(`/api/admin/products/${deleteTarget.id}`, { method: 'DELETE' });
      alert('상품이 리스트에서 삭제되었습니다.');
      closeDelete();
      await refresh();
    } catch (e) {
      alert(e.message || '상품 삭제 중 오류가 발생했습니다.');
      deleteConfirm.disabled = false;
    }
  });

  async function refresh() {
    store = await apiFetch('/api/admin/store');
    renderProducts();
    renderStats();
  }

  // ---------- 통계 ----------
  function renderStats() {
    const items = store.items || [];
    let onSale = 0, soldOut = 0, reservedTotal = 0;
    items.forEach((it) => {
      const s = itemStats(it);
      if (s.soldOut) soldOut++; else onSale++;
      reservedTotal += s.reserved;
    });
    statTotal.textContent = items.length;
    statOnSale.textContent = onSale;
    statSoldOut.textContent = soldOut;
    statReserved.textContent = reservedTotal;
  }

  // ---------- 지도 ----------
  async function setupMap() {
    if (!store.lat || !store.lng) { showMapFallback('가게 위치 정보가 없습니다.'); return; }
    try {
      await loadKakaoMaps();
    } catch (e) {
      showMapFallback('지도를 불러오지 못했습니다. (127.0.0.1:5500 에서 실행 필요)');
      return;
    }
    try {
      const center = new window.kakao.maps.LatLng(store.lat, store.lng);
      const map = new window.kakao.maps.Map(mapEl, { center, level: 4 });
      const pin = document.createElement('div');
      pin.className = 'map-pin';
      pin.innerHTML = '<i class="ph ph-storefront"></i>';
      new window.kakao.maps.CustomOverlay({ position: center, content: pin, yAnchor: 1, map });

      document.getElementById('mapCardName').textContent = store.name || '';
      document.getElementById('mapCardAddress').textContent = store.address || '';
      mapCard.classList.remove('hidden');
    } catch (e) {
      showMapFallback('지도를 표시할 수 없습니다.');
    }
  }

  function showMapFallback(msg) {
    mapEl.classList.add('hidden');
    mapCard.classList.add('hidden');
    mapFallbackText.textContent = msg || '';
    mapFallback.classList.remove('hidden');
  }

  // ---------- 로그아웃 ----------
  document.getElementById('logoutBtn').addEventListener('click', () => {
    AdminSession.clear();
    window.location.href = '../AdminLoginPage/AdminLoginPage.html';
  });

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function isActiveReservation(reservation) {
    return ACTIVE_RESERVATION_STATUSES.includes(reservation.status);
  }

  function formatPhone(value) {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
    if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
    return value || '';
  }

  init();
})();
