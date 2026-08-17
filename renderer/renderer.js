const refreshBtn = document.getElementById('refresh-btn');
const listEl = document.getElementById('window-list');
const statusEl = document.getElementById('status');
const confirmPanel = document.getElementById('confirm-panel');
const confirmDetails = document.getElementById('confirm-details');
const continueBtn = document.getElementById('continue-btn');
const confirmedPanel = document.getElementById('confirmed-panel');
const confirmedDetails = document.getElementById('confirmed-details');
const changeTargetBtn = document.getElementById('change-target-btn');

let candidateWindow = null;

async function loadWindows() {
  statusEl.textContent = 'Loading...';
  listEl.innerHTML = '';

  const windows = await window.api.getWindows();

  if (windows.length === 0) {
    statusEl.textContent = 'No windows found.';
    return;
  }

  windows.forEach((win) => {
    const li = document.createElement('li');

    const titleSpan = document.createElement('span');
    titleSpan.className = 'win-title';
    titleSpan.textContent = win.title;

    const processSpan = document.createElement('span');
    processSpan.className = 'win-process';
    processSpan.textContent = win.processName;
    titleSpan.appendChild(processSpan);

    const selectBtn = document.createElement('button');
    selectBtn.textContent = 'Select';
    selectBtn.addEventListener('click', () => {
      candidateWindow = win;
      document.querySelectorAll('#window-list li').forEach((el) => el.classList.remove('selected'));
      li.classList.add('selected');

      confirmDetails.textContent = `${win.title} (${win.processName})`;
      confirmPanel.classList.add('visible');
    });

    li.appendChild(titleSpan);
    li.appendChild(selectBtn);
    listEl.appendChild(li);
  });

  statusEl.textContent = `Found ${windows.length} window(s).`;
}

continueBtn.addEventListener('click', async () => {
  if (!candidateWindow) return;

  continueBtn.disabled = true;
  continueBtn.textContent = 'Redirecting...';

  const target = await window.api.redirectToTarget(candidateWindow);

  confirmedDetails.textContent =
    `${target.title} (${target.processName})\n` +
    `Position: ${target.x}, ${target.y} | Size: ${target.width} x ${target.height}`;
  confirmedDetails.style.whiteSpace = 'pre-line';
  confirmedPanel.classList.add('visible');
  confirmPanel.classList.remove('visible');
  listEl.style.display = 'none';
  refreshBtn.style.display = 'none';
  statusEl.textContent = '';

  continueBtn.disabled = false;
  continueBtn.textContent = 'Continue';
});

changeTargetBtn.addEventListener('click', () => {
  candidateWindow = null;
  confirmedPanel.classList.remove('visible');
  listEl.style.display = '';
  refreshBtn.style.display = '';
  loadWindows();
});

refreshBtn.addEventListener('click', loadWindows);
loadWindows();
