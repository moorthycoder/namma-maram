(function () {
  const enter_btn_element = document.querySelector('.enter-btn');

  const handleButtonClickFeedback = (event_object) => {
    enter_btn_element.classList.add('pressed');
    setTimeout(() => {
      enter_btn_element.classList.remove('pressed');
    }, 150);
    return true;
  };

  enter_btn_element ? enter_btn_element.addEventListener('click', handleButtonClickFeedback) : null;
})();