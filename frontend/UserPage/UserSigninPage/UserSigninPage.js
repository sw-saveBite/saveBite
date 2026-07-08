(function () {
  let emailChecked = false;
  let emailIsDuplicate = false;

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
  const signupBtn = document.getElementById('signupBtn');
  const topBanner = document.getElementById('topBanner');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const hasWhitespace = (v) => /\s/.test(v);
  const pwCombo = (v) => {
    let c = 0;
    if (/[a-zA-Z]/.test(v)) c++;
    if (/[0-9]/.test(v)) c++;
    if (/[^a-zA-Z0-9\s]/.test(v)) c++;
    return c >= 2;
  };

  function setMsg(el, wrap, text, type) {
    el.textContent = text || '';
    el.className = 'msg' + (type === 'success' ? ' success' : '');
    wrap.classList.remove('error', 'valid');
    if (text && type === 'success') wrap.classList.add('valid');
    else if (text) wrap.classList.add('error');
  }
  function setBanner(type, text) {
    topBanner.textContent = text || '';
    topBanner.className = 'top-banner' + (text ? ' ' + type : '');
  }
  function resetDup() {
    emailChecked = false;
    emailIsDuplicate = false;
    dupBtn.textContent = '중복 확인';
    dupBtn.classList.remove('checked');
  }

  emailInput.addEventListener('input', () => { resetDup(); setMsg(emailMsg, emailWrap, ''); setBanner('', ''); refreshBtn(); });

  // 이메일 중복 확인 (localStorage 저장 계정 대상)
  dupBtn.addEventListener('click', () => {
    const v = emailInput.value;
    if (!v) return setMsg(emailMsg, emailWrap, '이메일을 입력해 주세요.');
    if (hasWhitespace(v)) return setMsg(emailMsg, emailWrap, '이메일에 공백이 포함되어있습니다.');
    if (!emailRegex.test(v)) return setMsg(emailMsg, emailWrap, '올바른 이메일 형식이 아닙니다.');

    emailChecked = true;
    emailIsDuplicate = UserStore.exists(v);
    if (emailIsDuplicate) {
      setMsg(emailMsg, emailWrap, '이미 사용 중인 이메일입니다.');
    } else {
      setMsg(emailMsg, emailWrap, '사용 가능한 이메일입니다.', 'success');
      dupBtn.textContent = '확인완료';
      dupBtn.classList.add('checked');
    }
    refreshBtn();
  });

  // 비밀번호 공백 입력 불가
  [pwInput, pw2Input].forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === ' ') e.preventDefault(); }));
  pwInput.addEventListener('input', () => { setMsg(pwMsg, pwWrap, ''); setBanner('', ''); refreshBtn(); });
  pw2Input.addEventListener('input', () => { setMsg(pw2Msg, pw2Wrap, ''); setBanner('', ''); refreshBtn(); });

  phoneInput.addEventListener('input', () => {
    phoneInput.value = phoneInput.value.replace(/[^0-9]/g, '');
    setMsg(phoneMsg, phoneWrap, ''); setBanner('', ''); refreshBtn();
  });

  document.getElementById('pwEye').addEventListener('click', () => { pwInput.type = pwInput.type === 'password' ? 'text' : 'password'; });
  document.getElementById('pw2Eye').addEventListener('click', () => { pw2Input.type = pw2Input.type === 'password' ? 'text' : 'password'; });

  function validateEmail() {
    const v = emailInput.value;
    if (!v) return '이메일을 입력해 주세요.';
    if (hasWhitespace(v)) return '이메일에 공백이 포함되어있습니다.';
    if (!emailRegex.test(v)) return '올바른 이메일 형식이 아닙니다.';
    if (!emailChecked) return '이메일 중복 확인을 해주세요.';
    if (emailIsDuplicate) return '이미 사용 중인 이메일입니다.';
    return '';
  }
  function validatePassword() {
    const v = pwInput.value;
    if (!v) return '비밀번호를 입력해 주세요.';
    if (hasWhitespace(v)) return '비밀번호에 공백은 사용할 수 없습니다.';
    if (v.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (v.length > 20) return '비밀번호는 20자 이하여야 합니다.';
    if (!pwCombo(v)) return '영문, 숫자, 특수문자 중 2가지 이상을 조합해 주세요.';
    return '';
  }
  function validatePassword2() {
    if (!pw2Input.value) return '비밀번호 확인을 입력해 주세요.';
    if (pw2Input.value !== pwInput.value) return '비밀번호가 일치하지 않습니다.';
    return '';
  }
  function validatePhone() {
    const v = phoneInput.value;
    if (!v) return '휴대폰 번호를 입력해 주세요.';
    if (!/^01[016789][0-9]{7,8}$/.test(v)) return '올바른 휴대폰 번호 형식이 아닙니다.';
    return '';
  }

  // 모든 필드가 유효할 때만 버튼을 활성 색으로 표시 (클릭 자체는 항상 가능)
  function allValid() {
    return !validateEmail() && !validatePassword() && !validatePassword2() && !validatePhone();
  }
  function refreshBtn() {
    signupBtn.classList.toggle('inactive', !allValid());
  }

  signupBtn.addEventListener('click', async () => {
    const eErr = validateEmail();
    const pErr = validatePassword();
    const p2Err = validatePassword2();
    const phErr = validatePhone();
    setMsg(emailMsg, emailWrap, eErr);
    setMsg(pwMsg, pwWrap, pErr);
    setMsg(pw2Msg, pw2Wrap, p2Err);
    setMsg(phoneMsg, phoneWrap, phErr);

    if (eErr || pErr || p2Err || phErr) {
      return setBanner('error', '필수항목을 모두 올바르게 입력해주세요.');
    }

    // 가입 직전 중복 재확인 (다른 탭에서 먼저 가입했을 수 있으므로)
    if (UserStore.exists(emailInput.value)) {
      emailChecked = true;
      emailIsDuplicate = true;
      setMsg(emailMsg, emailWrap, '이미 사용 중인 이메일입니다.');
      return setBanner('error', '이미 사용 중인 이메일입니다.');
    }

    UserStore.add({
      email: emailInput.value.trim(),
      password: pwInput.value,
      phone: phoneInput.value
    });
    alert('정상적으로 회원가입이 완료되었습니다.');
    window.location.href = '../UserLoginPage/UserLoginPage.html';
  });

  refreshBtn(); // 초기 상태: 비활성 색
})();
