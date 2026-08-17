const targetLabel = document.getElementById('target-label');

window.api.onTargetInfo((target) => {
  targetLabel.textContent = `${target.title} (${target.processName})`;
});
