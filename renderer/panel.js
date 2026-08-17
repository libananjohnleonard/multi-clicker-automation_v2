const targetLabel = document.getElementById('target-label');
const timerInput = document.getElementById('timer-input');
const timerSetBtn = document.getElementById('timer-set-btn');
const timerStatus = document.getElementById('timer-status');
const gridAddBtn = document.getElementById('grid-add-btn');
const gridRemoveBtn = document.getElementById('grid-remove-btn');

window.api.onTargetInfo((target) => {
  targetLabel.textContent = `${target.title} (${target.processName})`;
});

timerSetBtn.addEventListener('click', async () => {
  const seconds = parseInt(timerInput.value, 10);

  if (!Number.isInteger(seconds) || seconds < 1) {
    timerStatus.textContent = 'Enter a whole number of seconds (1+)';
    return;
  }

  const confirmed = await window.api.setTimerInterval(seconds);
  timerInput.value = confirmed;
  timerStatus.textContent = `Interval: ${confirmed}s`;
});

gridAddBtn.addEventListener('click', async () => {
  await window.api.addGrid();
  gridAddBtn.disabled = true;
  gridRemoveBtn.disabled = false;
});

gridRemoveBtn.addEventListener('click', async () => {
  await window.api.removeGrid();
  gridAddBtn.disabled = false;
  gridRemoveBtn.disabled = true;
});
