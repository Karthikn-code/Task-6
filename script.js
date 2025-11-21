(function(){
  const form = document.getElementById('contactForm');
  const nameInput = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const messageInput = document.getElementById('message');
  const nameError = document.getElementById('nameError');
  const emailError = document.getElementById('emailError');
  const messageError = document.getElementById('messageError');
  const successBox = document.getElementById('success');
  const submitBtn = document.getElementById('submitBtn');

  function validateEmail(email){
    // More robust but still practical regex for client-side validation
    const re = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return re.test(String(email).toLowerCase());
  }

  function showError(element, message){
    element.textContent = message;
  }
  function clearError(element){
    element.textContent = '';
  }
  function clearAllErrors(){
    clearError(nameError);
    clearError(emailError);
    clearError(messageError);
    nameInput.classList.remove('input-error');
    emailInput.classList.remove('input-error');
    messageInput.classList.remove('input-error');
  }

  // Live validation helpers
  function validateField(field){
    const val = field.value.trim();
    if(field === nameInput){
      if(!val){ showError(nameError, 'Please enter your name.'); nameInput.classList.add('input-error'); return false; }
      clearError(nameError); nameInput.classList.remove('input-error'); return true;
    }
    if(field === emailInput){
      if(!val){ showError(emailError, 'Please enter your email.'); emailInput.classList.add('input-error'); return false; }
      if(!validateEmail(val)){ showError(emailError, 'Please enter a valid email address.'); emailInput.classList.add('input-error'); return false; }
      clearError(emailError); emailInput.classList.remove('input-error'); return true;
    }
    if(field === messageInput){
      if(!val){ showError(messageError, 'Please enter a message.'); messageInput.classList.add('input-error'); return false; }
      clearError(messageError); messageInput.classList.remove('input-error'); return true;
    }
    return true;
  }

  // Debounce helper for input events
  function debounce(fn, wait){
    let t = null; return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); };
  }

  // Attach live input validation
  nameInput.addEventListener('input', debounce(()=>validateField(nameInput), 250));
  emailInput.addEventListener('input', debounce(()=>validateField(emailInput), 250));
  messageInput.addEventListener('input', debounce(()=>validateField(messageInput), 250));

  form.addEventListener('submit', function(e){
    e.preventDefault();
    clearAllErrors();
    successBox.hidden = true;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    // Run validation one more time before submit
    const okName = validateField(nameInput);
    const okEmail = validateField(emailInput);
    const okMessage = validateField(messageInput);
    if(!(okName && okEmail && okMessage)){
      const firstError = document.querySelector('.input-error');
      if(firstError) firstError.focus();
      return;
    }

    // Submit to backend endpoint
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, message })
    }).then(async res => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      if(!res.ok){
        const data = await res.json().catch(()=>({}));
        const errs = (data && data.errors) || {};
        if(errs.name) showError(nameError, errs.name), nameInput.classList.add('input-error');
        if(errs.email) showError(emailError, errs.email), emailInput.classList.add('input-error');
        if(errs.message) showError(messageError, errs.message), messageInput.classList.add('input-error');
        const firstError = document.querySelector('.input-error');
        if(firstError) firstError.focus();
        return;
      }
      // success
      const data = await res.json().catch(() => ({}));
      // show success box and any preview URLs returned by the server (Ethereal)
      successBox.innerHTML = 'Thank you — your message looks good!';
      if(data && Array.isArray(data.previewUrls) && data.previewUrls.length){
        const list = document.createElement('ul');
        data.previewUrls.forEach(url => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = url; a.textContent = 'View email (preview)'; a.target = '_blank';
          li.appendChild(a);
          list.appendChild(li);
        });
        successBox.appendChild(list);
      }
      successBox.hidden = false;
      form.reset();
    }).catch(err => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      showError(messageError, 'Network error. Please try again.');
      messageInput.classList.add('input-error');
    });
  });
})();