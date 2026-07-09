(function(){
  // ---------- state ----------
  let emailChecked = false;
  let emailIsDuplicate = false;
  let businessChecked = false;
  let selectedStore = null;

  // ---------- elements ----------
  const emailInput = document.getElementById('email');
  const emailWrap = document.getElementById('emailWrap');
  const emailMsg = document.getElementById('emailMsg');
  const dupBtn = document.getElementById('dupBtn');

  const pwInput = document.getElementById('password');
  const pwWrap = document.getElementById('pwWrap');
  const pwMsg = document.getElementById('pwMsg');
  const pw2Input = document.getElementById('password2');
  const pw2Wrap = document.getElementById('pw2Wrap');
  const pw2Msg = document.getElementById('pw2Msg');

  const phoneInput = document.getElementById('phone');
  const phoneWrap = document.getElementById('phoneWrap');
  const phoneMsg = document.getElementById('phoneMsg');

  const ruleLen = document.getElementById('ruleLen');
  const ruleCombo = document.getElementById('ruleCombo');
  const ruleSpace = document.getElementById('ruleSpace');

  const nextBtn = document.getElementById('nextBtn');
  const topError = document.getElementById('topError');

  // Step 2 (가게 정보)
  const signupBtn = document.getElementById('signupBtn');

  const panelStep1 = document.getElementById('panelStep1');
  const panelStep2 = document.getElementById('panelStep2');
  const successPanel = document.getElementById('successPanel');
  const stepsIndicator = document.getElementById('stepsIndicator');
  const dividerBottom = document.getElementById('dividerBottom');
  const backToLoginLink = document.getElementById('backToLoginLink');

  const dotStep1 = document.getElementById('dotStep1');
  const dotStep2 = document.getElementById('dotStep2');
  const lineStep = document.getElementById('lineStep');

  const storeError = document.getElementById('storeError');
  const businessInput = document.getElementById('businessNumber');
  const businessWrap = document.getElementById('businessWrap');
  const businessCheckBtn = document.getElementById('businessCheckBtn');
  const businessMsg = document.getElementById('businessMsg');
  const storeNameInput = document.getElementById('storeName');
  const storeNameWrap = document.getElementById('storeNameWrap');
  const storeNameMsg = document.getElementById('storeNameMsg');
  const storeSearchBtn = document.getElementById('storeSearchBtn');
  const storeResult = document.getElementById('storeResult');
  const zipCodeInput = document.getElementById('zipCode');
  const roadAddressInput = document.getElementById('roadAddress');
  const detailAddressInput = document.getElementById('detailAddress');

  // ---------- helpers ----------
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  function hasWhitespace(str){ return /\s/.test(str); }
  function setMsg(el, text, type){ el.textContent = text || ''; el.className = 'msg' + (type ? ' ' + type : ''); }
  function setWrapState(wrap, state){ wrap.classList.remove('error','valid'); if(state) wrap.classList.add(state); }
  function setButtonEnabled(button, enabled){
    button.disabled = !enabled;
    button.classList.toggle('enabled', enabled);
  }

  function updateNextButton(){
    const enabled = emailValid()
      && pwValidBase()
      && pw2Input.value === pwInput.value
      && /^[0-9]{9,11}$/.test(phoneInput.value);
    setButtonEnabled(nextBtn, enabled);
  }

  function updateSignupButton(){
    const hasCoordinates = selectedStore
      && Number.isFinite(Number(selectedStore.latitude))
      && Number.isFinite(Number(selectedStore.longitude));
    const enabled = businessChecked
      && selectedStore
      && storeNameInput.value.trim()
      && zipCodeInput.value.trim()
      && roadAddressInput.value.trim()
      && detailAddressInput.value.trim()
      && detailAddressInput.value.length <= 50
      && hasCoordinates;
    setButtonEnabled(signupBtn, Boolean(enabled));
  }

  // ---------- EMAIL ----------
  function resetDupCheck(){
    emailChecked = false;
    emailIsDuplicate = false;
    dupBtn.textContent = '중복 확인';
    dupBtn.classList.remove('checked');
  }

  emailInput.addEventListener('input', function(){
    resetDupCheck();
    setWrapState(emailWrap, '');
    setMsg(emailMsg, '');
    hideTopError();
    updateNextButton();
  });

  dupBtn.addEventListener('click', async function(){
    const val = emailInput.value;
    if(val.length === 0){
      setMsg(emailMsg, '이메일을 입력해 주세요.', 'error');
      setWrapState(emailWrap, 'error');
      resetDupCheck();
      return;
    }
    if(hasWhitespace(val)){
      setMsg(emailMsg, '이메일에 공백이 포함되어있습니다.', 'error');
      setWrapState(emailWrap, 'error');
      resetDupCheck();
      return;
    }
    if(!emailRegex.test(val)){
      setMsg(emailMsg, '이메일 형식이 올바르지 않습니다.', 'error');
      setWrapState(emailWrap, 'error');
      resetDupCheck();
      return;
    }
    dupBtn.disabled = true;
    dupBtn.textContent = '확인 중';
    try {
      await apiFetch('/api/auth/admin/check-email', {
        method: 'POST',
        body: JSON.stringify({ email: val.trim().toLowerCase() })
      });
      emailChecked = true;
      emailIsDuplicate = false;
      setMsg(emailMsg, '사용 가능한 이메일입니다.', 'success');
      setWrapState(emailWrap, 'valid');
      dupBtn.textContent = '확인완료';
      dupBtn.classList.add('checked');
      updateNextButton();
    } catch (err) {
      emailChecked = false;
      emailIsDuplicate = err.status === 409;
      setMsg(emailMsg, err.message || '이메일 중복 확인에 실패했습니다.', 'error');
      setWrapState(emailWrap, 'error');
      dupBtn.textContent = '중복 확인';
      dupBtn.classList.remove('checked');
      updateNextButton();
    } finally {
      dupBtn.disabled = false;
    }
  });

  function emailValid(){
    const val = emailInput.value;
    return val.length > 0 && !hasWhitespace(val) && emailRegex.test(val) && emailChecked && !emailIsDuplicate;
  }

  // ---------- PASSWORD ----------
  function pwCombo(str){
    const hasLetter = /[a-zA-Z]/.test(str);
    const hasNumber = /[0-9]/.test(str);
    const hasSpecial = /[^a-zA-Z0-9\s]/.test(str);
    return [hasLetter, hasNumber, hasSpecial].filter(Boolean).length >= 2;
  }

  function updatePwRules(){
    const val = pwInput.value;
    const lenOk = val.length >= 8 && val.length <= 20;
    const comboOk = pwCombo(val);
    const spaceOk = val.length > 0 && !hasWhitespace(val);
    ruleLen.classList.toggle('ok', lenOk);
    ruleCombo.classList.toggle('ok', comboOk);
    ruleSpace.classList.toggle('ok', spaceOk);
  }

  function pwValidBase(){
    const val = pwInput.value;
    return val.length>=8 && val.length<=20 && !hasWhitespace(val) && pwCombo(val);
  }

  function validatePassword(showMsg){
    const val = pwInput.value;
    updatePwRules();
    if(val.length === 0){
      if(showMsg){ setMsg(pwMsg, '비밀번호를 입력해 주세요.', 'error'); setWrapState(pwWrap,'error'); }
      return false;
    }
    if(hasWhitespace(val)){
      if(showMsg){ setMsg(pwMsg, '비밀번호에 공백은 사용할 수 없습니다.', 'error'); setWrapState(pwWrap,'error'); }
      return false;
    }
    if(val.length < 8){
      if(showMsg){ setMsg(pwMsg, '비밀번호는 8자 이상이어야 합니다.', 'error'); setWrapState(pwWrap,'error'); }
      return false;
    }
    if(val.length > 20){
      if(showMsg){ setMsg(pwMsg, '비밀번호는 20자 이하여야 합니다.', 'error'); setWrapState(pwWrap,'error'); }
      return false;
    }
    if(!pwCombo(val)){
      if(showMsg){ setMsg(pwMsg, '영문, 숫자, 특수문자 중 2가지 이상을 조합해 주세요.', 'error'); setWrapState(pwWrap,'error'); }
      return false;
    }
    if(showMsg){ setMsg(pwMsg, '사용 가능한 비밀번호입니다.', 'success'); setWrapState(pwWrap,'valid'); }
    return true;
  }

  function validatePassword2(showMsg){
    const val2 = pw2Input.value;
    if(val2.length === 0){
      if(showMsg){ setMsg(pw2Msg,''); setWrapState(pw2Wrap,''); }
      return false;
    }
    if(val2 !== pwInput.value){
      if(showMsg){ setMsg(pw2Msg, '비밀번호가 일치하지 않습니다.', 'error'); setWrapState(pw2Wrap,'error'); }
      return false;
    }
    if(showMsg){ setMsg(pw2Msg, '비밀번호가 일치합니다.', 'success'); setWrapState(pw2Wrap,'valid'); }
    return true;
  }

  pwInput.addEventListener('input', function(){
    validatePassword(true);
    if(pw2Input.value.length>0) validatePassword2(true);
    hideTopError();
    updateNextButton();
  });
  pw2Input.addEventListener('input', function(){ validatePassword2(true); hideTopError(); updateNextButton(); });

  document.getElementById('pwEye').addEventListener('click', function(){
    pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
  });
  document.getElementById('pw2Eye').addEventListener('click', function(){
    pw2Input.type = pw2Input.type === 'password' ? 'text' : 'password';
  });

  // ---------- PHONE ----------
  phoneInput.addEventListener('input', function(){
    phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');
    setMsg(phoneMsg, '');
    setWrapState(phoneWrap, '');
    hideTopError();
    updateNextButton();
  });

  function validatePhone(showMsg){
    const val = phoneInput.value;
    if(val.length === 0){
      if(showMsg){ setMsg(phoneMsg, '휴대폰 번호를 입력해 주세요.', 'error'); setWrapState(phoneWrap,'error'); }
      return false;
    }
    if(!/^[0-9]{9,11}$/.test(val)){
      if(showMsg){ setMsg(phoneMsg, '올바른 휴대폰 번호 형식이 아닙니다.', 'error'); setWrapState(phoneWrap,'error'); }
      return false;
    }
    if(showMsg){ setMsg(phoneMsg, '', ''); setWrapState(phoneWrap,'valid'); }
    return true;
  }

  function hideTopError(){ topError.classList.remove('show'); }

  // ---------- STEP NAV ----------
  function goToStep(n){
    if(n === 2){
      panelStep1.classList.remove('active');
      panelStep2.classList.add('active');
      dotStep1.classList.remove('active');
      dotStep1.classList.add('done');
      dotStep1.querySelector('.step-circle').innerHTML = '&#10003;';
      dotStep2.classList.add('active');
      lineStep.classList.add('done');
    } else {
      panelStep2.classList.remove('active');
      panelStep1.classList.add('active');
      dotStep2.classList.remove('active');
      dotStep1.classList.add('active');
      dotStep1.classList.remove('done');
      dotStep1.querySelector('.step-circle').innerHTML = '1';
      lineStep.classList.remove('done');
    }
  }

  document.getElementById('backBtn').addEventListener('click', function(){ goToStep(1); });

  function formatBusinessNumber(value){
    const digits = String(value || '').replace(/\D/g, '').slice(0, 10);
    if(digits.length <= 3) return digits;
    if(digits.length <= 5) return digits.slice(0, 3) + '-' + digits.slice(3);
    return digits.slice(0, 3) + '-' + digits.slice(3, 5) + '-' + digits.slice(5);
  }

  businessInput.addEventListener('input', function(){
    businessInput.value = formatBusinessNumber(businessInput.value);
    businessChecked = false;
    selectedStore = null;
    storeNameInput.disabled = true;
    storeSearchBtn.disabled = true;
    storeNameInput.value = '';
    zipCodeInput.value = '';
    zipCodeInput.readOnly = true;
    zipCodeInput.placeholder = '우편번호';
    roadAddressInput.value = '';
    storeResult.className = 'store-result';
    storeResult.innerHTML = '';
    setMsg(businessMsg, '');
    setWrapState(businessWrap, '');
    storeError.classList.remove('show');
    businessCheckBtn.textContent = '인증';
    businessCheckBtn.classList.remove('checked');
    updateSignupButton();
  });

  businessCheckBtn.addEventListener('click', async function(){
    const businessNumber = businessInput.value.replace(/\D/g, '');
    if(businessNumber.length !== 10){
      setMsg(businessMsg, '사업자등록번호는 숫자 10자리로 입력해 주세요.', 'error');
      setWrapState(businessWrap, 'error');
      return;
    }
    businessCheckBtn.disabled = true;
    businessCheckBtn.textContent = '조회 중';
    try {
      const data = await apiFetch('/api/public/business/status', {
        method: 'POST',
        body: JSON.stringify({ business_number: businessNumber })
      });
      if(!data.is_active){
        throw new Error(data.message || '계속사업자가 아닙니다.');
      }
      businessChecked = true;
      setMsg(businessMsg, '국세청 조회 완료 - 계속사업자 확인', 'success');
      setWrapState(businessWrap, 'valid');
      businessCheckBtn.textContent = '인증됨';
      businessCheckBtn.classList.add('checked');
      storeNameInput.disabled = false;
      storeSearchBtn.disabled = false;
      storeNameInput.focus();
      updateSignupButton();
    } catch (err) {
      businessChecked = false;
      setMsg(businessMsg, err.message || '사업자등록번호 인증에 실패했습니다.', 'error');
      setWrapState(businessWrap, 'error');
      businessCheckBtn.textContent = '인증';
      businessCheckBtn.classList.remove('checked');
      updateSignupButton();
    } finally {
      businessCheckBtn.disabled = false;
    }
  });

  storeNameInput.addEventListener('input', function(){
    selectedStore = null;
    zipCodeInput.value = '';
    zipCodeInput.readOnly = true;
    zipCodeInput.placeholder = '우편번호';
    roadAddressInput.value = '';
    storeResult.className = 'store-result';
    storeResult.innerHTML = '';
    setMsg(storeNameMsg, '');
    setWrapState(storeNameWrap, '');
    storeError.classList.remove('show');
    updateSignupButton();
  });

  storeSearchBtn.addEventListener('click', async function(){
    if(!businessChecked){
      setMsg(storeNameMsg, '사업자등록번호 인증을 먼저 완료해 주세요.', 'error');
      return;
    }
    const keyword = storeNameInput.value.trim();
    if(!keyword){
      setMsg(storeNameMsg, '상호명을 입력해 주세요.', 'error');
      setWrapState(storeNameWrap, 'error');
      return;
    }
    storeSearchBtn.disabled = true;
    storeSearchBtn.textContent = '검색 중';
    storeResult.className = 'store-result';
    storeResult.innerHTML = '';
    try {
      const stores = await searchStores(keyword);
      if(!stores.length){
        setMsg(storeNameMsg, '검색 결과가 없습니다. 상호명을 다시 확인해 주세요.', 'error');
        return;
      }
      storeResult.innerHTML = stores.map(function(store, index){
        return `<button type="button" class="store-choice" data-index="${index}">
          <b>${escapeHtml(store.store_name || '')}</b>
          <span>${escapeHtml(store.road_address || store.lot_address || '주소 정보 없음')}</span>
          <span>${escapeHtml(store.category || '')}</span>
        </button>`;
      }).join('');
      storeResult.classList.add('show');
      storeResult.querySelectorAll('.store-choice').forEach(function(btn){
        btn.addEventListener('click', function(){
          chooseStore(stores[Number(btn.dataset.index)]);
        });
      });
    } catch (err) {
      setMsg(storeNameMsg, err.message || '상호명 검색에 실패했습니다.', 'error');
      setWrapState(storeNameWrap, 'error');
    } finally {
      storeSearchBtn.disabled = false;
      storeSearchBtn.textContent = '검색';
    }
  });

  function chooseStore(store){
    selectedStore = store;
    storeNameInput.value = store.store_name || '';
    zipCodeInput.value = store.zip_code || '';
    zipCodeInput.readOnly = !!store.zip_code;
    zipCodeInput.placeholder = store.zip_code ? '우편번호' : '우편번호 직접 입력';
    roadAddressInput.value = store.road_address || store.lot_address || '';
    setMsg(storeNameMsg, '상호명 등록 완료 - 주소가 자동 입력되었습니다.', 'success');
    setWrapState(storeNameWrap, 'valid');
    storeResult.innerHTML = `<div class="selected-store">
      <div class="done">상호명 등록 완료</div>
      <dl>
        <dt>상호명</dt><dd>${escapeHtml(store.store_name || '')}</dd>
        <dt>업종</dt><dd>${escapeHtml(store.category || '-')}</dd>
      </dl>
    </div>`;
    storeResult.classList.add('show');
    updateSignupButton();
  }

  zipCodeInput.addEventListener('input', updateSignupButton);
  detailAddressInput.addEventListener('input', function(){
    storeError.classList.remove('show');
    updateSignupButton();
  });

  async function searchStores(keyword){
    try {
      const stores = await apiFetch(`/api/public/commercial-stores/search?keyword=${encodeURIComponent(keyword)}&numOfRows=8`);
      if (Array.isArray(stores) && stores.length) return stores;
    } catch (err) {
      // 공공데이터 상호명 검색 엔드포인트가 막혀 있거나 키가 없으면 카카오 장소 검색으로 폴백합니다.
    }
    return searchKakaoPlaces(keyword);
  }

  async function searchKakaoPlaces(keyword){
    await loadKakaoMaps();
    return new Promise(function(resolve, reject){
      const places = new window.kakao.maps.services.Places();
      const geocoder = new window.kakao.maps.services.Geocoder();
      places.keywordSearch(keyword, function(data, status){
        if(status !== window.kakao.maps.services.Status.OK){
          resolve([]);
          return;
        }
        Promise.all(data.slice(0, 8).map(function(place){
          const address = place.road_address_name || place.address_name || '';
          return lookupZipCode(geocoder, address).then(function(zipCode){
            return {
              business_id: place.id,
              store_name: place.place_name,
              category: place.category_name || '',
              zip_code: zipCode,
              road_address: place.road_address_name || place.address_name || '',
              lot_address: place.address_name || '',
              latitude: Number(place.y),
              longitude: Number(place.x)
            };
          });
        })).then(resolve).catch(reject);
      });
    });
  }

  function lookupZipCode(geocoder, address){
    return new Promise(function(resolve){
      if(!address){
        resolve('');
        return;
      }
      geocoder.addressSearch(address, function(data, status){
        if(status !== window.kakao.maps.services.Status.OK || !data.length){
          resolve('');
          return;
        }
        resolve((data[0].road_address && data[0].road_address.zone_no) || '');
      });
    });
  }

  nextBtn.addEventListener('click', function(){
    const emailOk = emailValid();
    const pwOk = validatePassword(true);
    const pw2Ok = validatePassword2(true);
    const phoneOk = validatePhone(true);

    // 개별 필드 우선순위 메시지 (표에 정의된 문구 그대로)
    if(emailInput.value.length === 0){ setMsg(emailMsg, '이메일을 입력해 주세요.', 'error'); setWrapState(emailWrap,'error'); }
    else if(hasWhitespace(emailInput.value)){ setMsg(emailMsg, '이메일에 공백이 포함되어있습니다.', 'error'); setWrapState(emailWrap,'error'); }
    else if(!emailRegex.test(emailInput.value)){ setMsg(emailMsg, '이메일 형식이 올바르지 않습니다.', 'error'); setWrapState(emailWrap,'error'); }
    else if(!emailChecked){ setMsg(emailMsg, '이메일 중복 확인을 해주세요.', 'error'); setWrapState(emailWrap,'error'); }
    else if(emailIsDuplicate){ setMsg(emailMsg, '이미 사용 중인 이메일입니다.', 'error'); setWrapState(emailWrap,'error'); }

    if(!emailOk || !pwOk || !pw2Ok || !phoneOk){
      topError.classList.add('show');
      return;
    }

    hideTopError();
    goToStep(2);
  });

  // 링크의 href="login.html"이 그대로 동작하므로 별도 이벤트 처리 불필요

  document.getElementById('signupBtn').addEventListener('click', async function(){
    storeError.classList.remove('show');
    if(!businessChecked){
      storeError.textContent = '사업자등록번호 인증을 완료해 주세요.';
      storeError.classList.add('show');
      return;
    }
    if(!selectedStore || !storeNameInput.value.trim() || !zipCodeInput.value || !roadAddressInput.value){
      storeError.textContent = '상호명 검색 결과를 선택해 주소를 자동 입력해 주세요.';
      storeError.classList.add('show');
      return;
    }
    if(!Number.isFinite(Number(selectedStore.latitude)) || !Number.isFinite(Number(selectedStore.longitude))){
      storeError.textContent = '선택한 상호명에 위치 정보가 없습니다. 다른 검색 결과를 선택해 주세요.';
      storeError.classList.add('show');
      return;
    }
    if(!detailAddressInput.value.trim()){
      storeError.textContent = '상세 주소를 입력해 주세요.';
      storeError.classList.add('show');
      return;
    }
    if(detailAddressInput.value.length > 50){
      storeError.textContent = '상세 주소는 50자 이내로 작성해 주세요.';
      storeError.classList.add('show');
      return;
    }
    const signupBtn = document.getElementById('signupBtn');
    signupBtn.disabled = true;
    signupBtn.textContent = '가입 중...';
    try {
      await apiFetch('/api/auth/admin/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: emailInput.value.trim().toLowerCase(),
          password: pwInput.value,
          phone_number: phoneInput.value,
          store_name: storeNameInput.value.trim(),
          business_number: businessInput.value,
          zip_code: zipCodeInput.value,
          road_address: roadAddressInput.value,
          detail_address: detailAddressInput.value.trim(),
          latitude: selectedStore.latitude,
          longitude: selectedStore.longitude
        })
      });
      panelStep2.classList.remove('active');
      stepsIndicator.style.display = 'none';
      successPanel.classList.add('active');
      dividerBottom.style.display = 'none';
      backToLoginLink.style.display = 'none';
    } catch (err) {
      storeError.textContent = err.message || '회원가입에 실패했습니다.';
      storeError.classList.add('show');
      signupBtn.textContent = '회원가입 완료';
      updateSignupButton();
    }
  });

  document.getElementById('goLoginBtn').addEventListener('click', function(){
    window.location.href = '../AdminLoginPage/AdminLoginPage.html';
  });
  // backToLoginLink는 href="login.html"이 그대로 동작하므로 별도 이벤트 처리 불필요

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  updateNextButton();
  updateSignupButton();

})();
