document.body.addEventListener('mouseenter', () => {
  window.api.setIgnoreMouseEvents(false);
});

document.body.addEventListener('mouseleave', () => {
  window.api.setIgnoreMouseEvents(true);
});
