(function () {
  const enter_btn_element = document.querySelector('.enter-btn');
  const scan_btn_element = document.querySelector('.scan-qr-btn');

  const handleButtonClickFeedback = (event_object) => {
    const target_element = event_object ? event_object.currentTarget : null;
    target_element ? target_element.classList.add('pressed') : null;
    setTimeout(() => {
      target_element ? target_element.classList.remove('pressed') : null;
    }, 150);
    return true;
  };

  enter_btn_element ? enter_btn_element.addEventListener('click', handleButtonClickFeedback) : null;
  scan_btn_element ? scan_btn_element.addEventListener('click', handleButtonClickFeedback) : null;
})();