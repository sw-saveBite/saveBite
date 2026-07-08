(function () {
  // 로그인 가드 (REQUIRE_LOGIN 이 true 일 때만 동작)
  if (!Session.guard('../UserLoginPage/UserLoginPage.html')) return;

  const listArea = document.getElementById('listArea');
  const cancelModal = document.getElementById('cancelModal');
  const cancelBack = document.getElementById('cancelBack');
  const cancelConfirm = document.getElementById('cancelConfirm');

  let reservations = [];
  let cancelTargetId = null;

  const STATUS_META = {
    '예약 대기': 'wait',
    '예약 확정': 'confirm',
    '취소됨': 'cancel',
    '수령 완료': 'done'
  };

  async function load() {
    try {
      const data = await apiFetch('/api/user/reservations');
      reservations = (data || []).map(normalizeReservation);
    } catch (e) {
      listArea.innerHTML = '<p class="empty">예약 내역을 불러오지 못했습니다.</p>';
      return;
    }
    render();
  }

  function render() {
    if (!reservations || !reservations.length) {
      listArea.innerHTML = '<p class="empty">아직 예약된 상품이 없습니다.</p>';
      return;
    }
    // 최신 예약일 순 정렬
    const sorted = [...reservations].sort((a, b) => new Date(b.reservedAt || 0) - new Date(a.reservedAt || 0));
    listArea.innerHTML = sorted.map((r) => {
      const cancelable = r.status === '예약 대기' || r.status === '예약 확정';
      return `
        <div class="res-card">
          <div>
            <span class="status ${STATUS_META[r.status] || 'cancel'}">${escapeHtml(r.status)}</span>
            <h3>${escapeHtml(r.storeName)} - ${escapeHtml(r.itemName)}</h3>
            <p class="date">${escapeHtml(formatDate(r.reservedAt))}</p>
            ${r.cancelReason ? `<p class="reason">${escapeHtml(r.cancelReason)}</p>` : ''}
          </div>
          <div class="actions">
            ${APP_CONFIG.SHOW_DIRECTIONS ? `
              <button class="route-btn" data-route="${r.storeId}" data-mode="car">차량</button>
              <button class="route-btn walk" data-route="${r.storeId}" data-mode="walk">도보</button>
            ` : ''}
            <button class="cancel-btn" data-cancel="${r.id}" ${cancelable ? '' : 'disabled'}>취소</button>
          </div>
        </div>`;
    }).join('');

    listArea.querySelectorAll('[data-route]').forEach((el) => {
      el.addEventListener('click', () => goRoute(el.dataset.route, el.dataset.mode));
    });
    listArea.querySelectorAll('[data-cancel]').forEach((el) => {
      el.addEventListener('click', () => onCancelClick(Number(el.dataset.cancel)));
    });
  }

  function onCancelClick(id) {
    const r = reservations.find((x) => x.id === id);
    if (!r) return;
    if (r.status !== '예약 대기' && r.status !== '예약 확정') {
      alert('이미 상품 준비가 시작되어 예약을 취소할 수 없습니다.');
      return;
    }
    cancelTargetId = id;
    cancelModal.classList.remove('hidden');
  }

  cancelBack.addEventListener('click', () => { cancelModal.classList.add('hidden'); cancelTargetId = null; });

  cancelConfirm.addEventListener('click', async () => {
    if (cancelTargetId == null) return;
    cancelConfirm.disabled = true;
    try {
      await apiFetch(`/api/user/reservations/${cancelTargetId}/cancel`, { method: 'PATCH' });
      alert('예약 취소가 완료되었습니다.');
      cancelModal.classList.add('hidden');
      cancelTargetId = null;
      await load();
    } catch (err) {
      if (err.status === 409) alert('이미 상품 준비가 시작되어 예약을 취소할 수 없습니다.');
      else alert(err.message || '예약 취소 중 오류가 발생했습니다.');
    } finally {
      cancelConfirm.disabled = false;
    }
  });

  function goRoute(storeId, mode) {
    if (!storeId) { alert('가게 위치 정보가 등록되지 않았습니다.'); return; }
    const routeMode = mode === 'walk' ? 'walk' : 'car';
    window.location.href = `../UserMainPage/UserMainPage.html?route=${encodeURIComponent(storeId)}&mode=${routeMode}`;
  }

  function formatDate(v) {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return d.toLocaleString('ko-KR');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function normalizeReservation(reservation) {
    const statusMap = {
      '예약대기': '예약 대기',
      '예약확정': '예약 확정',
      '예약취소': '취소됨',
      '수령완료': '수령 완료'
    };
    return {
      id: reservation.reservation_id,
      productId: reservation.product_id,
      storeId: reservation.store_id,
      storeName: reservation.store_name || '가게',
      itemName: reservation.product_name || '상품',
      status: statusMap[reservation.status] || reservation.status || '취소됨',
      reservedAt: reservation.create_at,
      cancelReason: reservation.cancel_reason || ''
    };
  }

  load();
})();
