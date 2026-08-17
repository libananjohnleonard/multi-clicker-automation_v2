const targetLabel = document.getElementById('target-label');
const timerInput = document.getElementById('timer-input');
const timerSetBtn = document.getElementById('timer-set-btn');
const timerStatus = document.getElementById('timer-status');

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
