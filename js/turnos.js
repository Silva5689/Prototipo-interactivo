
"use strict";

// Reglas de negocio. Este archivo no conoce el DOM.
(() => {
  const { data, storage } = window.Relevo;

  const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
  const CREATED_ID_PATTERN = /^nuevo-[a-z0-9-]{1,64}$/;

  function validCreatedTurn(turn) {
    return (
      turn &&
      typeof turn === "object" &&
      typeof turn.id === "string" &&
      CREATED_ID_PATTERN.test(turn.id) &&
      data.days.includes(turn.day) &&
      data.classTypes.includes(turn.title) &&
      TIME_PATTERN.test(turn.hour) &&
      data.coaches.includes(turn.defaultCoach)
    );
  }

  function restoreTurns(rawTurns) {
    const turns = [...data.initialTurns];
    const ids = new Set(turns.map(turn => turn.id));

    if (!Array.isArray(rawTurns)) {
      return turns;
    }

    for (const turn of rawTurns.slice(0, data.maxCreatedTurns)) {
      if (!validCreatedTurn(turn) || ids.has(turn.id)) {
        continue;
      }

      ids.add(turn.id);

      turns.push({
        id: turn.id,
        title: turn.title,
        day: turn.day,
        hour: turn.hour,
        defaultCoach: turn.defaultCoach,
        created: true,
      });
    }

    return turns;
  }

  function restoreAssignments(turns, savedAssignments) {
    const safe =
      savedAssignments && typeof savedAssignments === "object"
        ? savedAssignments
        : {};

    return Object.fromEntries(
      turns.map(turn => [
        turn.id,
        data.coaches.includes(safe[turn.id])
          ? safe[turn.id]
          : turn.defaultCoach,
      ])
    );
  }

  function restoreLastAction(raw, turns, assignments) {
    if (!raw || typeof raw !== "object") {
      return null;
    }

    const turn = turns.find(item => item.id === raw.id);

    if (
      !turn ||
      !data.coaches.includes(raw.to) ||
      assignments[raw.id] !== raw.to
    ) {
      return null;
    }

    if (raw.type === "create" && turn.created) {
      return {
        type: "create",
        id: raw.id,
        to: raw.to,
      };
    }

    if (
      raw.type === "assign" &&
      data.coaches.includes(raw.from) &&
      raw.from !== raw.to
    ) {
      return {
        type: "assign",
        id: raw.id,
        from: raw.from,
        to: raw.to,
      };
    }

    if (
      raw.type === "schedule" &&
      turn.created &&
      data.days.includes(raw.fromDay) &&
      TIME_PATTERN.test(raw.fromHour) &&
      data.days.includes(raw.toDay) &&
      TIME_PATTERN.test(raw.toHour) &&
      (raw.fromDay !== raw.toDay ||
        raw.fromHour !== raw.toHour) &&
      turn.day === raw.toDay &&
      turn.hour === raw.toHour &&
      data.coaches.includes(raw.to) &&
      assignments[raw.id] === raw.to
    ) {
      return {
        type: "schedule",
        id: raw.id,
        fromDay: raw.fromDay,
        fromHour: raw.fromHour,
        toDay: raw.toDay,
        toHour: raw.toHour,
        to: raw.to,
      };
    }

    return null;
  }

  function createTurnService() {
    const saved = storage.load();

    let turns = restoreTurns(saved.createdTurns);

    let assignments = restoreAssignments(
      turns,
      saved.assignments
    );

    let lastAction = restoreLastAction(
      saved.lastAction,
      turns,
      assignments
    );

    const getTurn = id =>
      turns.find(turn => turn.id === id);

    const assignedTo = turn =>
      assignments[turn.id];

    function listTurns(coach = null) {
      return turns
        .filter(
          turn =>
            coach === null ||
            assignedTo(turn) === coach
        )
        .sort(
          (a, b) =>
            data.days.indexOf(a.day) -
              data.days.indexOf(b.day) ||
            a.hour.localeCompare(b.hour)
        )
        .map(turn => ({
          ...turn,
          shortDay:
            data.shortDays[data.days.indexOf(turn.day)],
          coach: assignedTo(turn),
          modified:
            turn.created ||
            assignedTo(turn) !== turn.defaultCoach,
        }));
    }

    function getLastAction() {
      if (!lastAction) {
        return null;
      }

      const turn = getTurn(lastAction.id);

      return turn
        ? { ...lastAction, turn: { ...turn } }
        : null;
    }

    function hasConflict({
      day,
      hour,
      coach,
      ignoreId = null,
    }) {
      return turns.some(
        turn =>
          turn.id !== ignoreId &&
          turn.day === day &&
          turn.hour === hour &&
          assignedTo(turn) === coach
      );
    }

    function assignTurn(id, coach) {
      const turn = getTurn(id);

      if (!turn || !data.coaches.includes(coach)) {
        return {
          ok: false,
          message: "La asignación no es válida.",
        };
      }

      const previous = assignedTo(turn);

      if (previous === coach) {
        return {
          ok: false,
          message: "Ese monitor ya está asignado al turno.",
        };
      }

      if (
        hasConflict({
          ...turn,
          coach,
          ignoreId: id,
        })
      ) {
        return {
          ok: false,
          message:
            `${coach} ya tiene una clase el ` +
            `${turn.day} a las ${turn.hour}.`,
        };
      }

      assignments[id] = coach;

      lastAction = {
        type: "assign",
        id,
        from: previous,
        to: coach,
      };

      storage.save({
        turns,
        assignments,
        lastAction,
      });

      return {
        ok: true,
        coach,
        message:
          `${turn.title} del ${turn.day}: ` +
          `asignado a ${coach}.`,
      };
    }

    function addTurn({ title, day, hour, coach }) {
      const valid =
        data.classTypes.includes(title) &&
        data.days.includes(day) &&
        TIME_PATTERN.test(hour) &&
        data.coaches.includes(coach);

      if (!valid) {
        return {
          ok: false,
          message: "Completa correctamente todos los campos.",
        };
      }

      const createdCount = turns.filter(
        turn => turn.created
      ).length;

      if (createdCount >= data.maxCreatedTurns) {
        return {
          ok: false,
          message:
            "Se ha alcanzado el límite de turnos de esta demo.",
        };
      }

      if (hasConflict({ day, hour, coach })) {
        return {
          ok: false,
          message:
            `${coach} ya tiene una clase el ` +
            `${day} a las ${hour}.`,
        };
      }

      const id =
        `nuevo-${Date.now().toString(36)}-` +
        Math.random().toString(36).slice(2, 8);

      turns.push({
        id,
        title,
        day,
        hour,
        defaultCoach: coach,
        created: true,
      });

      assignments[id] = coach;

      lastAction = {
        type: "create",
        id,
        to: coach,
      };

      storage.save({
        turns,
        assignments,
        lastAction,
      });

      return {
        ok: true,
        id,
        coach,
        message:
          `Turno creado: ${title}, ` +
          `${day} ${hour}, para ${coach}.`,
      };
    }

    function editTurnSchedule(id, day, hour) {
      const turn = getTurn(id);

      if (!turn || !turn.created) {
        return {
          ok: false,
          message:
            "Solo puedes editar turnos creados en la demo.",
        };
      }

      if (
        !data.days.includes(day) ||
        !TIME_PATTERN.test(hour)
      ) {
        return {
          ok: false,
          message: "El día o la hora no son válidos.",
        };
      }

      if (turn.day === day && turn.hour === hour) {
        return {
          ok: false,
          message: "No has cambiado ni el día ni la hora.",
        };
      }

      const coach = assignedTo(turn);

      if (hasConflict({ day, hour, coach, ignoreId: id })) {
        return {
          ok: false,
          message:
            `${coach} ya tiene una clase el ` +
            `${day} a las ${hour}.`,
        };
      }

      const previous = {
        day: turn.day,
        hour: turn.hour,
      };

      turn.day = day;
      turn.hour = hour;

      lastAction = {
        type: "schedule",
        id,
        fromDay: previous.day,
        fromHour: previous.hour,
        toDay: day,
        toHour: hour,
        to: coach,
      };

      storage.save({
        turns,
        assignments,
        lastAction,
      });

      return {
        ok: true,
        coach,
        message:
          `Horario actualizado: ${turn.title}, ` +
          `${day} ${hour}.`,
      };
    }

    function undo() {
      if (!lastAction) {
        return {
          ok: false,
          message: "No hay cambios que deshacer.",
        };
      }

      const action = lastAction;

      if (action.type === "create") {
        turns = turns.filter(
          turn => turn.id !== action.id
        );

        delete assignments[action.id];
      } else if (action.type === "schedule") {
        const turn = getTurn(action.id);

        if (turn) {
          turn.day = action.fromDay;
          turn.hour = action.fromHour;
        }
      } else {
        assignments[action.id] = action.from;
      }

      lastAction = null;

      storage.save({
        turns,
        assignments,
        lastAction,
      });

      return {
        ok: true,
        message: "Último cambio deshecho.",
      };
    }

    function reset() {
      turns = [...data.initialTurns];

      assignments = Object.fromEntries(
        turns.map(turn => [
          turn.id,
          turn.defaultCoach,
        ])
      );

      lastAction = null;

      storage.save({
        turns,
        assignments,
        lastAction,
      });
    }

    function getChangesCount() {
      return listTurns().filter(
        turn => turn.modified
      ).length;
    }

    function getCoachNotice(coach) {
      const additions = turns.filter(
        turn =>
          assignedTo(turn) === coach &&
          (
            turn.created ||
            turn.defaultCoach !== coach
          )
      ).length;

      const removals = turns.filter(
        turn =>
          !turn.created &&
          turn.defaultCoach === coach &&
          assignedTo(turn) !== coach
      ).length;

      if (!additions && !removals) {
        return "Sin cambios para este monitor.";
      }

      const messages = [];

      if (additions) {
        messages.push(
          `${additions} ${
            additions === 1
              ? "turno añadido"
              : "turnos añadidos"
          } a tu horario.`
        );
      }

      if (removals) {
        messages.push(
          `${removals} ${
            removals === 1
              ? "turno reasignado"
              : "turnos reasignados"
          } a otra persona.`
        );
      }

      return `Resumen ficticio: ${messages.join(" ")}`;
    }

    return {
      listTurns,
      getLastAction,
      getChangesCount,
      getCoachNotice,
      assignTurn,
      addTurn,
      editTurnSchedule,
      undo,
      reset,
    };
  }

  window.Relevo.createTurnService = createTurnService;
})();
