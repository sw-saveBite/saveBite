(function(){
  // ---------- state ----------
  let emailChecked = false;
  let emailIsDuplicate = false;
  const takenEmails = ['admin@test.com','user@store.com','test@test.com'];

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
  const storeNameInput = document.getElementById('storeName');
  const storeNameWrap = document.getElementById('storeNameWrap');
  const storeNameMsg = document.getElementById('storeNameMsg');
  const zipcodeInput = document.getElementById('zipcode');
  const addressInput = document.getElementById('address');
  const addrWrap = document.getElementById('addrWrap');
  const addrMsg = document.getElementById('addrMsg');
  const addrDetailInput = document.getElementById('addressDetail');
  const addrDetailWrap = document.getElementById('addrDetailWrap');
  const addrDetailMsg = document.getElementById('addrDetailMsg');
  const addrSearchBtn = document.getElementById('addrSearchBtn');
  const signupBtn = document.getElementById('signupBtn');
  const topError2 = document.getElementById('topError2');

  const panelStep1 = document.getElementById('panelStep1');
  const panelStep2 = document.getElementById('panelStep2');
  const successPanel = document.getElementById('successPanel');
  const stepsIndicator = document.getElementById('stepsIndicator');
  const dividerBottom = document.getElementById('dividerBottom');
  const backToLoginLink = document.getElementById('backToLoginLink');

  const dotStep1 = document.getElementById('dotStep1');
  const dotStep2 = document.getElementById('dotStep2');
  const lineStep = document.getElementById('lineStep');

  // ---------- helpers ----------
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  function hasWhitespace(str){ return /\s/.test(str); }
  function setMsg(el, text, type){ el.textContent = text || ''; el.className = 'msg' + (type ? ' ' + type : ''); }
  function setWrapState(wrap, state){ wrap.classList.remove('error','valid'); if(state) wrap.classList.add(state); }

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
  });

  dupBtn.addEventListener('click', function(){
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
    const isDup = takenEmails.includes(val.trim().toLowerCase());
    emailChecked = true;
    emailIsDuplicate = isDup;
    if(isDup){
      setMsg(emailMsg, '이미 사용 중인 이메일입니다.', 'error');
      setWrapState(emailWrap, 'error');
      dupBtn.textContent = '중복 확인';
      dupBtn.classList.remove('checked');
    } else {
      setMsg(emailMsg, '사용 가능한 이메일입니다.', 'success');
      setWrapState(emailWrap, 'valid');
      dupBtn.textContent = '확인완료';
      dupBtn.classList.add('checked');
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
  });
  pw2Input.addEventListener('input', function(){ validatePassword2(true); hideTopError(); });

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

  /* ---------- STEP 2: 가게 정보 검증 ---------- */
  // 상호명 허용 문자: 한글/영문/숫자/공백 + 특수문자 ( ) [ ] - & 만
  const storeNameAllowed = /^[가-힣ㄱ-ㅎㅏ-ㅣa-zA-Z0-9()\[\]\-& ]*$/;

  function validateStoreName(showMsg){
    const val = storeNameInput.value;
    const trimmed = val.trim();
    if(trimmed.length === 0){
      if(showMsg){ setMsg(storeNameMsg, '상호명을 입력해 주세요.', 'error'); setWrapState(storeNameWrap,'error'); }
      return false;
    }
    if(!storeNameAllowed.test(val)){
      if(showMsg){ setMsg(storeNameMsg, '상호명에 사용할 수 없는 특수문자가 포함되어 있습니다.', 'error'); setWrapState(storeNameWrap,'error'); }
      return false;
    }
    if(showMsg){ setMsg(storeNameMsg, '', ''); setWrapState(storeNameWrap,'valid'); }
    return true;
  }

  function validateAddress(showMsg){
    const ok = zipcodeInput.value.trim().length > 0 && addressInput.value.trim().length > 0;
    if(!ok){
      if(showMsg){ setMsg(addrMsg, '가게 주소를 등록해 주세요.', 'error'); setWrapState(addrWrap,'error'); }
      return false;
    }
    if(showMsg){ setMsg(addrMsg, '', ''); setWrapState(addrWrap,'valid'); }
    return true;
  }

  function validateAddrDetail(showMsg){
    const val = addrDetailInput.value;
    if(val.length > 50){
      if(showMsg){ setMsg(addrDetailMsg, '상세 주소는 50자 이내로 작성해 주세요.', 'error'); setWrapState(addrDetailWrap,'error'); }
      return false;
    }
    if(val.trim().length === 0){
      if(showMsg){ setMsg(addrDetailMsg, '상세 주소를 정확히 입력해 주세요. (공백만 입력 불가)', 'error'); setWrapState(addrDetailWrap,'error'); }
      return false;
    }
    if(showMsg){ setMsg(addrDetailMsg, '', ''); setWrapState(addrDetailWrap,'valid'); }
    return true;
  }

  function updateSignupBtn(){
    const ok = validateStoreName(false) && validateAddress(false) && validateAddrDetail(false);
    signupBtn.classList.toggle('enabled', ok);
  }

  storeNameInput.addEventListener('input', function(){
    setWrapState(storeNameWrap, ''); setMsg(storeNameMsg, '', '');
    topError2.classList.remove('show');
    updateSignupBtn();
  });
  addrDetailInput.addEventListener('input', function(){
    setWrapState(addrDetailWrap, ''); setMsg(addrDetailMsg, '', '');
    topError2.classList.remove('show');
    updateSignupBtn();
  });

  // 주소 검색 (다음/카카오 우편번호 팝업)
  addrSearchBtn.addEventListener('click', function(){
    if(typeof daum === 'undefined' || !daum.Postcode){
      setMsg(addrMsg, '주소 검색 서비스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.', 'error');
      setWrapState(addrWrap, 'error');
      return;
    }
    new daum.Postcode({
      oncomplete: function(data){
        zipcodeInput.value = data.zonecode || '';
        addressInput.value = data.roadAddress || data.jibunAddress || '';
        setMsg(addrMsg, '', ''); setWrapState(addrWrap, 'valid');
        topError2.classList.remove('show');
        updateSignupBtn();
        addrDetailInput.focus();
      }
    }).open();
  });

  document.getElementById('signupBtn').addEventListener('click', function(){
    const okName = validateStoreName(true);
    const okAddr = validateAddress(true);
    const okDetail = validateAddrDetail(true);
    if(!okName || !okAddr || !okDetail){
      topError2.classList.add('show');
      return;
    }
    topError2.classList.remove('show');
    panelStep2.classList.remove('active');
    stepsIndicator.style.display = 'none';
    successPanel.classList.add('active');
    dividerBottom.style.display = 'none';
    backToLoginLink.style.display = 'none';
  });

  updateSignupBtn(); // 초기: 비활성

  document.getElementById('goLoginBtn').addEventListener('click', function(){
    window.location.href = '../AdminLoginPage/AdminLoginPage.html';
  });
  // backToLoginLink는 href="login.html"이 그대로 동작하므로 별도 이벤트 처리 불필요

})();