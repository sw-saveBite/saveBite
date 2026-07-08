(function () {
  const emailInput = document.getElementById('email');
  const emailWrap = document.getElementById('emailWrap');
  const emailMsg = document.getElementById('emailMsg');
  const pwInput = document.getElementById('password');
  const pwWrap = document.getElementById('pwWrap');
  const pwMsg = document.getElementById('pwMsg');
  const loginBtn = document.getElementById('loginBtn');
  const topBanner = document.getElementById('topBanner');

  const emailRegex = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
  const hasWhitespace = (v) => /\s/.test(v);

  function setMsg(el, wrap, text) {
    el.textContent = text || '';
    wrap.classList.toggle('error', !!text);
  }
  function setBanner(type, text) {
    topBanner.textContent = text || '';
    topBanner.className = 'top-banner' + (text ? ' ' + type : '');
  }
  function updateBtn() {
    loginBtn.classList.toggle('enabled', emailInput.value.length > 0 && pwInput.value.length > 0);
  }

  emailInput.addEventListener('input', () => { setMsg(emailMsg, emailWrap, ''); setBanner('', ''); updateBtn(); });
  pwInput.addEventListener('input', () => { setMsg(pwMsg, pwWrap, ''); setBanner('', ''); updateBtn(); });

  // 비밀번호 공백(스페이스바) 입력 절대 불가
  pwInput.addEventListener('keydown', (e) => { if (e.key === ' ') e.preventDefault(); });

  document.getElementById('pwEye').addEventListener('click', () => {
    pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
  });

  function validateEmail() {
    const v = emailInput.value;
    if (!v) return '이메일을 입력해 주세요.';
    if (hasWhitespace(v)) return '이메일에 공백이 포함되어있습니다.';
    if (!emailRegex.test(v)) return '올바른 이메일 형식이 아닙니다.';
    return '';
  }
  function validatePassword() {
    const v = pwInput.value;
    if (!v) return '비밀번호를 입력해 주세요.';
    if (hasWhitespace(v)) return '비밀번호에 공백이 포함되어있습니다.';
    return '';
  }

  async function attemptLogin() {
    const eErr = validateEmail();
    const pErr = validatePassword();
    setMsg(emailMsg, emailWrap, eErr);
    setMsg(pwMsg, pwWrap, pErr);
    if (eErr || pErr) return;

    loginBtn.disabled = true;
    loginBtn.textContent = '로그인 중...';
    try {
      const data = await apiFetch('/api/auth/user/login', {
        method: 'POST',
        body: JSON.stringify({
          email: emailInput.value.trim().toLowerCase(),
          password: pwInput.value
        })
      });
      Session.set({ token: data.token, email: emailInput.value.trim().toLowerCase() });
      setBanner('success', data.message || '로그인에 성공하였습니다.');
      setTimeout(() => { window.location.href = '../UserMainPage/UserMainPage.html'; }, 700);
    } catch (err) {
      setBanner('error', err.message || '로그인에 실패했습니다.');
      loginBtn.disabled = false;
      loginBtn.textContent = '로그인';
    }
  }

  loginBtn.addEventListener('click', attemptLogin);

  // 엔터(Enter) 키 입력 시 로그인 버튼 클릭과 동일하게 동작
  [emailInput, pwInput].forEach((el) => el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); attemptLogin(); }
  }));

  updateBtn();
})();
