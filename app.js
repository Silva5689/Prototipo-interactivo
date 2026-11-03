
"use strict";

// Demo semanal con datos inventados. No hay servidor ni sesiones de empleados.
const INITIAL_CLASSES = Object.freeze([
  { id: 'clase-1', day: 'Lunes', shortDay: 'LUN', hour: '18:00', title: 'Boxeo inicial', defaultCoach: 'Diego', created: false },
  { id: 'clase-2', day: 'Martes', shortDay: 'MAR', hour: '19:00', title: 'Boxeo técnico', defaultCoach: 'Marta', created: false },
  { id: 'clase-3', day: 'Miércoles', shortDay: 'MIÉ', hour: '18:30', title: 'Boxeo avanzado', defaultCoach: 'Lucía', created: false },
  { id: 'clase-4', day: 'Jueves', shortDay: 'JUE', hour: '19:00', title: 'Boxeo inicial', defaultCoach: 'Diego', created: false },
  { id: 'clase-5', day: 'Viernes', shortDay: 'VIE', hour: '17:30', title: 'Boxeo funcional', defaultCoach: 'Sergio', created: false },
]);
const COACHES = Object.freeze(['Diego', 'Marta', 'Lucía', 'Sergio']);
const DAYS = Object.freeze(['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']);
const SHORT_DAYS = Object.freeze(['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE']);
const TITLES = Object.freeze(['Boxeo inicial', 'Boxeo técnico', 'Boxeo avanzado', 'Boxeo funcional']);
const STORAGE_CLASSES_KEY = 'relevo-demo-created-turns-v2';
const STORAGE_ASSIGNMENTS_KEY = 'relevo-demo-assignments-v2';
const STORAGE_ACTION_KEY = 'relevo-demo-last-action-v2';
const MAX_CREATED = 25;
const qs = id => document.getElementById(id);

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; }
  catch { return fallback; }
}
function loadCreated() {
  const stored = readJSON(STORAGE_CLASSES_KEY, []);
  if (!Array.isArray(stored)) return [];
  const used = new Set(INITIAL_CLASSES.map(slot => slot.id));
  return stored.slice(0, MAX_CREATED).filter(item => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' ||
      !/^nuevo-[a-z0-9-]{1,64}$/.test(item.id) || used.has(item.id) ||
      !DAYS.includes(item.day) || !TITLES.includes(item.title) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.hour) || !COACHES.includes(item.defaultCoach)) return false;
    used.add(item.id);
    return true;
  }).map(item => ({ id: item.id, day: item.day, shortDay: SHORT_DAYS[DAYS.indexOf(item.day)], hour: item.hour,
    title: item.title, defaultCoach: item.defaultCoach, created: true }));
}
let classes = [...INITIAL_CLASSES, ...loadCreated()];
let assignments = loadAssignments();
let role = 'manager';
let editorMode = 'edit';
let selectedClassId = 'clase-3';
let currentCoach = 'Diego';
let lastAction = loadLastAction();

function loadAssignments() {
  const stored = readJSON(STORAGE_ASSIGNMENTS_KEY, {});
  const safe = {};
  for (const slot of classes) {
    const candidate = stored && typeof stored === 'object' ? stored[slot.id] : undefined;
    safe[slot.id] = COACHES.includes(candidate) ? candidate : slot.defaultCoach;
  }
  return safe;
}
function loadLastAction() {
  const saved = readJSON(STORAGE_ACTION_KEY, null);
  if (!saved || typeof saved !== 'object') return null;
  const slot = classes.find(item => item.id === saved.id);
  if (!slot || !COACHES.includes(saved.to) || assignments[saved.id] !== saved.to) return null;
  if (saved.type === 'create' && slot.created) return { type: 'create', id: slot.id, to: saved.to };
  if (saved.type === 'assign' && COACHES.includes(saved.from) && saved.from !== saved.to)
    return { type: 'assign', id: slot.id, from: saved.from, to: saved.to };
  return null;
}
function persist() {
  try {
    localStorage.setItem(STORAGE_CLASSES_KEY, JSON.stringify(classes.filter(item => item.created)));
    localStorage.setItem(STORAGE_ASSIGNMENTS_KEY, JSON.stringify(assignments));
    if (lastAction) localStorage.setItem(STORAGE_ACTION_KEY, JSON.stringify(lastAction));
    else localStorage.removeItem(STORAGE_ACTION_KEY);
  } catch { /* La demo funciona en memoria si el navegador bloquea el almacenamiento. */ }
}
function getClass(id) { return classes.find(item => item.id === id); }
function sortedClasses() { return [...classes].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.hour.localeCompare(b.hour)); }
function changeCount() { return classes.filter(item => item.created || assignments[item.id] !== item.defaultCoach).length; }
function updateStatus(message) { qs('status-text').textContent = message; }
function fillSelect(el, values, value) {
  el.replaceChildren();
  for (const item of values) {
    const option = document.createElement('option');
    option.value = item;
    option.textContent = item;
    el.append(option);
  }
  el.value = value;
}
function renderReceipt() {
  qs('change-receipt').hidden = !lastAction || role !== 'manager';
  if (!lastAction) return;
  const slot = getClass(lastAction.id);
  if (!slot) return;
  qs('receipt-description').textContent = lastAction.type === 'create'
    ? `${slot.title} · ${slot.day} ${slot.hour}: turno creado para ${lastAction.to}.`
    : `${slot.title} · ${slot.day} ${slot.hour}: ${lastAction.from} → ${lastAction.to}.`;
}
function classRow(slot, editable) {
  const edited = slot.created || assignments[slot.id] !== slot.defaultCoach;
  const row = document.createElement('div');
  row.className = `class-row${selectedClassId === slot.id && editable && editorMode === 'edit' ? ' selected' : ''}${edited ? ' modified' : ''}`;
  const day = document.createElement('div'); day.className = 'class-day';
  const dayShort = document.createElement('span'); dayShort.textContent = slot.shortDay;
  const hour = document.createElement('strong'); hour.textContent = slot.hour;
  day.append(dayShort, hour);
  const info = document.createElement('div'); info.className = 'class-info';
  const title = document.createElement('strong'); title.textContent = slot.title;
  const assigned = document.createElement('span'); assigned.textContent = `Monitor: ${assignments[slot.id]}`;
  info.append(title, assigned);
  if (edited) {
    const note = document.createElement('span'); note.className = 'class-status';
    note.textContent = slot.created ? '✓ Turno creado en la demo' : `✓ Reasignado: ${slot.defaultCoach} → ${assignments[slot.id]}`;
    info.append(note);
  }
  row.append(day, info);
  if (editable) {
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'change-class';
    button.textContent = selectedClassId === slot.id && editorMode === 'edit' ? 'Seleccionado' : 'Asignar';
    button.setAttribute('aria-label', `Asignar monitor al turno de ${slot.title} del ${slot.day} a las ${slot.hour}`);
    button.addEventListener('click', () => {
      selectedClassId = slot.id; editorMode = 'edit'; render();
      updateStatus(`Turno seleccionado: ${slot.title}, ${slot.day} ${slot.hour}.`);
      if (window.matchMedia('(max-width: 760px)').matches) qs('editor-heading').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    row.append(button);
  }
  return row;
}
function renderManager() {
  qs('manager-view').replaceChildren(...sortedClasses().map(slot => classRow(slot, true)));
  const selected = getClass(selectedClassId) || classes[0];
  selectedClassId = selected.id;
  const title = document.createElement('strong'); title.textContent = selected.title;
  const info = document.createElement('span');
  info.textContent = `${selected.day} · ${selected.hour} · Asignado a: ${assignments[selected.id]}`;
  qs('selected-class').replaceChildren(title, info);
  fillSelect(qs('new-coach'), COACHES, assignments[selected.id]);
  qs('save-button').disabled = true;
  qs('assignment-panel').hidden = editorMode !== 'edit';
  qs('creation-panel').hidden = editorMode !== 'create';
  qs('editor-heading').textContent = editorMode === 'create' ? 'Crear y asignar turno' : 'Asignar un turno';
  qs('editor-description').textContent = editorMode === 'create'
    ? 'Elige la clase, el día, la hora y el monitor. El turno aparecerá en su horario.'
    : 'Selecciona un turno y elige qué monitor lo cubrirá.';
  qs('create-turn-button').hidden = editorMode === 'create';
}
function renderCoach() {
  fillSelect(qs('coach-select'), COACHES, currentCoach);
  const slots = sortedClasses().filter(slot => assignments[slot.id] === currentCoach);
  qs('coach-classes').replaceChildren(...slots.map(slot => classRow(slot, false)));
  if (!slots.length) {
    const empty = document.createElement('div'); empty.className = 'empty-note';
    empty.textContent = 'Este monitor no tiene turnos asignados.';
    qs('coach-classes').append(empty);
  }
  qs('class-count').textContent = `${slots.length} ${slots.length === 1 ? 'turno' : 'turnos'}`;
  const gains = classes.filter(slot => assignments[slot.id] === currentCoach &&
    (slot.created || slot.defaultCoach !== currentCoach));
  const losses = classes.filter(slot => !slot.created && assignments[slot.id] !== currentCoach && slot.defaultCoach === currentCoach);
  const notices = [];
  if (gains.length) notices.push(`${gains.length} ${gains.length === 1 ? 'turno nuevo o reasignado' : 'turnos nuevos o reasignados'} a tu horario.`);
  if (losses.length) notices.push(`${losses.length} ${losses.length === 1 ? 'turno asignado a otra persona' : 'turnos asignados a otras personas'}.`);
  qs('coach-notice').textContent = notices.length ? `Resumen ficticio: ${notices.join(' ')}` : 'Sin cambios para este monitor.';
}
function render() {
  const isManager = role === 'manager';
  qs('role-manager').classList.toggle('active', isManager);
  qs('role-coach').classList.toggle('active', !isManager);
  qs('role-manager').setAttribute('aria-pressed', String(isManager));
  qs('role-coach').setAttribute('aria-pressed', String(!isManager));
  qs('manager-view').hidden = !isManager;
  qs('coach-view').hidden = isManager;
  qs('editor').hidden = !isManager;
  qs('coach-sidebar').hidden = isManager;
  qs('create-turn-button').hidden = !isManager || editorMode === 'create';
  qs('list-title').textContent = isManager ? 'Turnos del gimnasio' : 'Mis turnos';
  qs('list-subtitle').textContent = isManager
    ? 'Crea un turno o cambia el monitor asignado a uno existente.'
    : 'Elige un monitor ficticio para ver sus turnos asignados.';
  qs('class-count').textContent = `${classes.length} ${classes.length === 1 ? 'turno' : 'turnos'}`;
  const count = changeCount();
  qs('changes-chip').textContent = `${count} ${count === 1 ? 'cambio' : 'cambios'} ${count === 1 ? 'activo' : 'activos'}`;
  qs('changes-chip').classList.toggle('has-changes', count > 0);
  if (isManager) renderManager(); else renderCoach();
  renderReceipt();
}

qs('role-manager').addEventListener('click', () => {
  role = 'manager'; render(); updateStatus('Vista Encargado: crea o asigna turnos.');
});
qs('role-coach').addEventListener('click', () => {
  role = 'coach'; render(); updateStatus(`Vista Monitor: turnos de ${currentCoach}.`);
});
qs('coach-select').addEventListener('change', event => {
  currentCoach = event.target.value; renderCoach();
  updateStatus(`Mostrando los turnos de ${currentCoach}.`);
});
qs('new-coach').addEventListener('change', () => {
  qs('save-button').disabled = qs('new-coach').value === assignments[selectedClassId];
});
qs('save-button').addEventListener('click', () => {
  const next = qs('new-coach').value;
  const selected = getClass(selectedClassId);
  if (!selected || !COACHES.includes(next)) return;
  const previous = assignments[selected.id];
  if (next === previous) return;
  const conflict = classes.some(slot => slot.id !== selected.id && slot.day === selected.day &&
    slot.hour === selected.hour && assignments[slot.id] === next);
  if (conflict) {
    updateStatus(`No se puede asignar a ${next}: ya tiene otro turno el ${selected.day} a las ${selected.hour}.`);
    return;
  }
  assignments[selected.id] = next;
  lastAction = { type: 'assign', id: selected.id, from: previous, to: next };
  currentCoach = next;
  persist(); render();
  updateStatus(`Asignación guardada: ${selected.title} del ${selected.day} ahora corresponde a ${next}.`);
});
qs('create-turn-button').addEventListener('click', () => {
  editorMode = 'create'; qs('creation-warning').hidden = true; render();
  updateStatus('Elige el horario y el monitor para crear un turno.');
  if (window.matchMedia('(max-width: 760px)').matches) qs('editor-heading').scrollIntoView({ behavior: 'smooth', block: 'center' });
  qs('create-title').focus();
});
qs('cancel-create-button').addEventListener('click', () => {
  editorMode = 'edit'; render(); updateStatus('Puedes reasignar cualquiera de los turnos existentes.');
});
qs('creation-panel').addEventListener('submit', event => {
  event.preventDefault();
  const title = qs('create-title').value;
  const day = qs('create-day').value;
  const hour = qs('create-hour').value;
  const coach = qs('create-coach').value;
  const warning = qs('creation-warning');
  const showWarning = message => { warning.hidden = false; warning.textContent = message; };
  warning.hidden = true;
  if (!TITLES.includes(title) || !DAYS.includes(day) || !COACHES.includes(coach) ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(hour)) {
    showWarning('Completa correctamente los datos del turno.'); return;
  }
  if (classes.filter(slot => slot.created).length >= MAX_CREATED) {
    showWarning('Se ha alcanzado el límite de turnos de esta demo. Reinicia para empezar de nuevo.'); return;
  }
  if (classes.some(slot => slot.day === day && slot.hour === hour && assignments[slot.id] === coach)) {
    showWarning(`${coach} ya tiene asignada una clase el ${day} a las ${hour}. Elige otra hora o monitor.`); return;
  }
  const id = `nuevo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
  const slot = { id, title, day, shortDay: SHORT_DAYS[DAYS.indexOf(day)], hour, defaultCoach: coach, created: true };
  classes.push(slot);
  assignments[id] = coach;
  selectedClassId = id; currentCoach = coach;
  lastAction = { type: 'create', id, to: coach };
  editorMode = 'edit';
  persist(); render();
  updateStatus(`Turno creado: ${title}, ${day} ${hour}, asignado a ${coach}.`);
});
qs('see-coach-button').addEventListener('click', () => {
  if (!lastAction) return;
  currentCoach = lastAction.to; role = 'coach'; render();
  updateStatus(`Vista Monitor: ${currentCoach} ya puede ver el turno.`);
  qs('role-coach').focus();
});
qs('undo-button').addEventListener('click', () => {
  if (!lastAction) return;
  const action = lastAction;
  const slot = getClass(action.id);
  if (!slot) return;
  if (action.type === 'create') {
    classes = classes.filter(item => item.id !== action.id);
    delete assignments[action.id];
    selectedClassId = INITIAL_CLASSES[0].id;
  } else {
    assignments[action.id] = action.from;
    selectedClassId = action.id;
  }
  lastAction = null; role = 'manager'; editorMode = 'edit';
  persist(); render();
  updateStatus(action.type === 'create' ? 'Creación deshecha: el turno nuevo se ha eliminado.' : `Asignación deshecha: ${slot.title} vuelve a ${action.from}.`);
});
qs('reset-button').addEventListener('click', () => {
  classes = [...INITIAL_CLASSES];
  assignments = Object.fromEntries(classes.map(slot => [slot.id, slot.defaultCoach]));
  selectedClassId = 'clase-3'; currentCoach = 'Diego'; lastAction = null;
  role = 'manager'; editorMode = 'edit';
  persist(); render(); updateStatus('Demo reiniciada: volvemos a los cinco turnos originales.');
});

fillSelect(qs('create-coach'), COACHES, 'Diego');
render();
