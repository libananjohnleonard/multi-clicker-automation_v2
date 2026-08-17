const targetLabel = document.getElementById('target-label');
const timerInput = document.getElementById('timer-input');
const timerSetBtn = document.getElementById('timer-set-btn');
const timerStatus = document.getElementById('timer-status');
const gridAddBtn = document.getElementById('grid-add-btn');
const gridRemoveBtn = document.getElementById('grid-remove-btn');
const pointAddBtn = document.getElementById('point-add-btn');
const clickPointsList = document.getElementById('click-points-list');
const startBtn = document.getElementById('start-btn');
const countdownDisplay = document.getElementById('countdown-display');
const clickMethodBtn = document.getElementById('click-method-btn');

let hasGrid = false;
let isRunning = false;
let clickMethod = 'background';
const pointRows = new Map();

function updateStartAvailability() {
  startBtn.disabled = !isRunning && !hasGrid && pointRows.size === 0;
}

clickMethodBtn.addEventListener('click', async () => {
  const next = clickMethod === 'background' ? 'cursor' : 'background';
  clickMethod = await window.api.setClickMethod(next);
  clickMethodBtn.textContent = clickMethod === 'cursor' ? 'Cursor' : 'Background';
});

window.api.onTargetInfo((target) => {
  targetLabel.textContent = `${target.displayLabel || target.title} (${target.processName})`;
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
  hasGrid = true;
  gridAddBtn.disabled = true;
  gridRemoveBtn.disabled = false;
  updateStartAvailability();
});

gridRemoveBtn.addEventListener('click', async () => {
  await window.api.removeGrid();
  hasGrid = false;
  gridAddBtn.disabled = false;
  gridRemoveBtn.disabled = true;
  updateStartAvailability();
});

pointAddBtn.addEventListener('click', async () => {
  await window.api.addClickPoint();
});

startBtn.addEventListener('click', async () => {
  await window.api.toggleAutomation();
});

window.api.onAutomationState((state) => {
  isRunning = state.running;
  startBtn.textContent = state.running ? 'Stop' : 'Start';
  countdownDisplay.textContent = state.running && hasGrid ? String(state.countdown) : '';
  updateStartAvailability();
});

window.api.onClickPointsState((points) => {
  const currentIds = new Set(points.map((p) => p.id));

  for (const [id, entry] of pointRows) {
    if (!currentIds.has(id)) {
      entry.el.remove();
      pointRows.delete(id);
    }
  }

  points.forEach((point) => {
    let entry = pointRows.get(point.id);

    if (!entry) {
      const row = document.createElement('div');
      row.className = 'point-row';

      const label = document.createElement('span');
      label.textContent = `Point ${point.id}`;

      const timerField = document.createElement('input');
      timerField.type = 'number';
      timerField.min = '1';
      timerField.className = 'point-timer-input';
      timerField.value = point.intervalSeconds;

      const setBtn = document.createElement('button');
      setBtn.textContent = 'Set';
      setBtn.addEventListener('click', async () => {
        const seconds = parseInt(timerField.value, 10);
        if (Number.isInteger(seconds) && seconds >= 1) {
          await window.api.setPointTimer(point.id, seconds);
        }
      });

      const countdownSpan = document.createElement('span');
      countdownSpan.className = 'point-countdown';

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'x';
      removeBtn.addEventListener('click', async () => {
        await window.api.removeClickPoint(point.id);
      });

      row.appendChild(label);
      row.appendChild(timerField);
      row.appendChild(setBtn);
      row.appendChild(countdownSpan);
      row.appendChild(removeBtn);
      clickPointsList.appendChild(row);

      entry = { el: row, countdownSpan };
      pointRows.set(point.id, entry);
    }

    entry.countdownSpan.textContent = point.running ? String(point.countdown) : '';
  });

  updateStartAvailability();
});
