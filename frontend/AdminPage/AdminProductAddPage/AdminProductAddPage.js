(function () {
  // 관리자 로그인 가드
  if (!AdminSession.guard('../AdminLoginPage/AdminLoginPage.html')) return;

  const nameInput = document.getElementById('name');
  const nameWrap = document.getElementById('nameWrap');
  const nameCount = document.getElementById('nameCount');
  const priceInput = document.getElementById('price');
  const priceWrap = document.getElementById('priceWrap');
  const pricePreview = document.getElementById('pricePreview');
  const qtyInput = document.getElementById('qty');
  const qtyWrap = document.getElementById('qtyWrap');
  const submitBtn = document.getElementById('submitBtn');
  const topError = document.getElementById('topError');

  let submitting = false;

  // ---------- 수정 모드 (?id=상품ID) ----------
  const editId = new URLSearchParams(location.search).get('id');
  const isEdit = !!editId;

  if (isEdit) {
    document.title = '상품 수정 | 가게 관리 시스템';
    document.getElementById('pageTitle').textContent = '상품 수정';
    const headIc = document.getElementById('headIc');
    headIc.classList.add('edit');
    headIc.innerHTML = '<i class="ph ph-pencil-simple"></i>';
    submitBtn.textContent = '수정 완료';
  }

  async function loadEditItem() {
    try {
      const store = await apiFetch('/api/admin/store');
      const item = (store.items || []).find((i) => String(i.id) === editId);
      if (!item) throw new Error('존재하지 않는 상품입니다.');
      // 품절 상품은 수정 불가 (명세)
      if (item.stock <= 0) {
        alert('품절 상품이라 수정할 수 없습니다.');
        window.location.href = '../AdminDashboardPage/AdminDashboardPage.html';
        return;
      }
      document.getElementById('pageSub').textContent = item.name;
      nameInput.value = item.name;
      nameCount.textContent = item.name.length;
      priceInput.value = String(item.price || '').replace(/[^0-9]/g, '');
      qtyInput.value = item.total != null ? String(item.total) : String(item.stock);
      updatePricePreview();
      updateBtn();
    } catch (e) {
      alert(e.message || '상품 정보를 불러오지 못했습니다.');
      window.location.href = '../AdminDashboardPage/AdminDashboardPage.html';
    }
  }

  // 숫자만 남기기 (가격/수량 입력)
  function onlyDigits(el) {
    el.value = el.value.replace(/[^0-9]/g, '');
  }

  // 유효성: 이름(1~30) + 가격(0 이상 숫자) + 수량(1 이상)
  function isValid() {
    const name = nameInput.value.trim();
    const price = priceInput.value;
    const qty = parseInt(qtyInput.value, 10);
    return name.length > 0 && name.length <= 30 && price.length > 0 && Number.isFinite(qty) && qty >= 1;
  }

  function updateBtn() {
    submitBtn.classList.toggle('enabled', isValid());
  }

  function hideError() { topError.classList.remove('show'); }
  function showError(msg) { topError.textContent = msg; topError.classList.add('show'); }

  nameInput.addEventListener('input', function () {
    nameCount.textContent = nameInput.value.length;
    nameWrap.classList.remove('error');
    hideError();
    updateBtn();
  });
  // 가격을 "4,500원" 형식으로 미리 보여줌
  function updatePricePreview() {
    const n = parseInt(priceInput.value, 10);
    pricePreview.textContent = Number.isFinite(n) ? n.toLocaleString('ko-KR') + '원' : '';
  }

  priceInput.addEventListener('input', function () {
    onlyDigits(priceInput);
    priceWrap.classList.remove('error');
    updatePricePreview();
    hideError();
    updateBtn();
  });
  qtyInput.addEventListener('input', function () {
    onlyDigits(qtyInput);
    qtyWrap.classList.remove('error');
    hideError();
    updateBtn();
  });

  async function submit() {
    if (submitting) return;
    if (!isValid()) {
      if (nameInput.value.trim().length === 0) { nameWrap.classList.add('error'); showError('상품 이름을 입력해 주세요.'); return; }
      if (priceInput.value.length === 0) { priceWrap.classList.add('error'); showError('상품 가격을 입력해 주세요.'); return; }
      qtyWrap.classList.add('error'); showError('상품 수량을 선택해 주세요.');
      return;
    }
    submitting = true;
    submitBtn.classList.remove('enabled');
    submitBtn.textContent = isEdit ? '수정 중...' : '추가 중...';
    try {
      const payload = JSON.stringify({
        product_name: nameInput.value.trim(),
        price: parseInt(priceInput.value, 10),
        product_quantity: parseInt(qtyInput.value, 10)
      });
      if (isEdit) {
<<<<<<< HEAD
        await apiFetch(`/api/admin/store/items/${editId}`, { method: 'PATCH', body: payload });
        alert('수정 성공하였습니다.');
      } else {
        await apiFetch('/api/admin/store/items', { method: 'POST', body: payload });
        alert('등록에 성공하였습니다.');
=======
        await apiFetch(`/api/admin/products/${editId}`, { method: 'PUT', body: payload });
        alert('상품이 수정되었습니다.');
      } else {
        await apiFetch('/api/admin/products', { method: 'POST', body: payload });
        alert('상품이 추가되었습니다.');
>>>>>>> 8ee0774 (complete)
      }
      window.location.href = '../AdminDashboardPage/AdminDashboardPage.html';
    } catch (err) {
      submitting = false;
      submitBtn.textContent = isEdit ? '수정 완료' : '상품 추가';
      updateBtn();
      // 구체적 사유(예: 예약 수량 부족)가 있으면 우선 표시, 없으면 명세 문구
      showError(err.message || (isEdit ? '수정 실패하였습니다.' : '등록에 실패하였습니다.'));
    }
  }

  submitBtn.addEventListener('click', submit);
  [nameInput, priceInput, qtyInput].forEach(function (el) {
    el.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
    });
  });

  if (isEdit) loadEditItem();
  updateBtn();
})();
