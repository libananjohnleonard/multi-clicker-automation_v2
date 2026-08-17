const refreshBtn = document.getElementById('refresh-btn');
const listEl = document.getElementById('window-list');
const statusEl = document.getElementById('status');

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
    selectBtn.addEventListener('click', async () => {
      await window.api.selectWindow(win);
      document.querySelectorAll('#window-list li').forEach((el) => el.classList.remove('selected'));
      li.classList.add('selected');
      statusEl.textContent = `Selected: ${win.title}`;
    });

    li.appendChild(titleSpan);
    li.appendChild(selectBtn);
    listEl.appendChild(li);
  });

  statusEl.textContent = `Found ${windows.length} window(s).`;
}

refreshBtn.addEventListener('click', loadWindows);
loadWindows();
