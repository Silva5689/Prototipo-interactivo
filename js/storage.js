
"use strict";

// Adaptador de persistencia local.
(() => {
  const KEYS = {
    turns: "relevo-demo-created-turns-v2",
    assignments: "relevo-demo-assignments-v2",
    lastAction: "relevo-demo-last-action-v2",
  };

  function read(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  }

  function load() {
    return {
      createdTurns: read(KEYS.turns, []),
      assignments: read(KEYS.assignments, {}),
      lastAction: read(KEYS.lastAction, null),
    };
  }

  function save({ turns, assignments, lastAction }) {
    try {
      const createdTurns = turns.filter(turn => turn.created);

      localStorage.setItem(
        KEYS.turns,
        JSON.stringify(createdTurns)
      );

      localStorage.setItem(
        KEYS.assignments,
        JSON.stringify(assignments)
      );

      if (lastAction) {
        localStorage.setItem(
          KEYS.lastAction,
          JSON.stringify(lastAction)
        );
      } else {
        localStorage.removeItem(KEYS.lastAction);
      }
    } catch {
      // Si localStorage está bloqueado,
      // la demo continúa funcionando en memoria.
    }
  }

  window.Relevo.storage = { load, save };
})();
