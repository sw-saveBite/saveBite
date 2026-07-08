(function(){
  // ---------- elements ----------
  const emailInput = document.getElementById('email');
  const emailWrap = document.getElementById('emailWrap');
  const emailMsg = document.getElementById('emailMsg');

  const pwInput = document.getElementById('password');
  const pwWrap = document.getElementById('pwWrap');
  const pwMsg = document.getElementById('pwMsg');

  const loginBtn = document.getElementById('loginBtn');
  const topError = document.getElementById('topError');
  const topSuccess = document.getElementById('topSuccess');

  // ---------- helpers ----------
  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  function hasWhitespace(str){ return /\s/.test(str); }

  function setMsg(el, text, type){
    el.textContent = text || '';
    el.className = 'msg' + (type ? ' ' + type : '');
  }
  function setWrapState(wrap, state){
    wrap.classList.remove('error','valid');
    if(state) wrap.classList.add(state);
  }
  function hideTopMsgs(){
    topError.classList.remove('show');
    topSuccess.classList.remove('show');
  }
  function showTopError(text){
    topSuccess.classList.remove('show');
    topError.textContent = text;
    topError.classList.add('show');
  }
  function showTopSuccess(text){
    topError.classList.remove('show');
    topSuccess.textContent = text;
    topSuccess.classList.add('show');
  }

  // ---------- 버튼 활성화: 이메일 + 비밀번호 모두 입력 시 ----------
  function updateLoginBtn(){
    const filled = emailInput.value.length > 0 && pwInput.value.length > 0;
    loginBtn.classList.toggle('enabled', filled);
  }

  emailInput.addEventListener('input', function(){
    setWrapState(emailWrap, '');
    setMsg(emailMsg, '');
    hideTopMsgs();
    updateLoginBtn();
  });
  pwInput.addEventListener('input', function(){
    setWrapState(pwWrap, '');
    setMsg(pwMsg, '');
    hideTopMsgs();
    updateLoginBtn();
  });

  document.getElementById('pwEye').addEventListener('click', function(){
    pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
  });

  // ---------- 필드 검증 ----------
  function validateEmail(){
    const val = emailInput.value;
    if(val.length === 0){
      setMsg(emailMsg, '이메일을 입력해 주세요.', 'error');
      setWrapState(emailWrap, 'error');
      return false;
    }
    if(hasWhitespace(val)){
      setMsg(emailMsg, '이메일에 공백이 포함되어있습니다.', 'error');
      setWrapState(emailWrap, 'error');
      return false;
    }
    if(!emailRegex.test(val)){
      setMsg(emailMsg, '이메일 형식이 올바르지 않습니다.', 'error');
      setWrapState(emailWrap, 'error');
      return false;
    }
    setWrapState(emailWrap, '');
    setMsg(emailMsg, '');
    return true;
  }

  function validatePassword(){
    const val = pwInput.value;
    if(val.length === 0){
      setMsg(pwMsg, '비밀번호를 입력해 주세요.', 'error');
      setWrapState(pwWrap, 'error');
      return false;
    }
    if(hasWhitespace(val)){
      setMsg(pwMsg, '비밀번호에 공백이 포함되어있습니다.', 'error');
      setWrapState(pwWrap, 'error');
      return false;
    }
    setWrapState(pwWrap, '');
    setMsg(pwMsg, '');
    return true;
  }

  // ---------- 로그인 처리 ----------
  async function attemptLogin(){
    hideTopMsgs();

    const emailOk = validateEmail();
    const pwOk = validatePassword();
    if(!emailOk || !pwOk) return;

    const emailVal = emailInput.value.trim().toLowerCase();
    const pwVal = pwInput.value;
    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';

    try {
      const data = await apiFetch('/api/auth/admin/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailVal, password: pwVal })
      });

      setWrapState(emailWrap, 'valid');
      setWrapState(pwWrap, 'valid');
      showTopSuccess(data.message || '로그인에 성공하였습니다. 대시보드로 이동합니다.');
      AdminSession.set({ token: data.token, email: emailVal });
      setTimeout(function(){
        window.location.href = '../AdminDashboardPage/AdminDashboardPage.html';
      }, 600);
    } catch (err) {
      showTopError(err.message || '로그인에 실패했습니다.');
      if (err.status === 404) setWrapState(emailWrap, 'error');
      if (err.status === 401) setWrapState(pwWrap, 'error');
      loginBtn.disabled = false;
      loginBtn.textContent = '로그인';
    }
  }

  loginBtn.addEventListener('click', function(){
    if(!loginBtn.classList.contains('enabled')){
      // 이메일/비밀번호 중 하나라도 비어있는 상태로 클릭한 경우
      if(emailInput.value.length === 0) setMsg(emailMsg, '이메일을 입력해 주세요.', 'error'), setWrapState(emailWrap,'error');
      if(pwInput.value.length === 0) setMsg(pwMsg, '비밀번호를 입력해 주세요.', 'error'), setWrapState(pwWrap,'error');
      return;
    }
    attemptLogin();
  });

  // ---------- 엔터(Enter) 키 입력 시 로그인 버튼 클릭과 동일 동작 ----------
  [emailInput, pwInput].forEach(function(el){
    el.addEventListener('keydown', function(e){
      if(e.key === 'Enter'){
        e.preventDefault();
        loginBtn.click();
      }
    });
  });

  // 링크의 href="index.html"이 그대로 동작하므로 별도 이벤트 처리 불필요
  // (JS가 막히거나 느리게 로드되어도 회원가입 페이지로 정상 이동합니다)
  document.getElementById('toUserPage').addEventListener('click', function(e){
    e.preventDefault();
    window.location.href = '../../UserPage/UserLoginPage/UserLoginPage.html';
  });

  updateLoginBtn();
})();
