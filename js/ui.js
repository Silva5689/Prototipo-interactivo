
"use strict";

// Interfaz y eventos de la demostración.
(() => {
  const { data } = window.Relevo;

  const byId = id => document.getElementById(id);

  function createNode(tag, className, text) {
    const node = document.createElement(tag);

    if (className) {
      node.className = className;
    }

    if (text !== undefined) {
      node.textContent = text;
    }

    return node;
  }

  function fillSelect(select, values, selected) {
    const options = values.map(
      value => new Option(value, value)
    );

    select.replaceChildren(...options);
    select.value = selected;
  }

  function createTurnRow(turn, { editable, selected }) {
    const classes = [
      "class-row",
      selected ? "selected" : "",
      turn.modified ? "modified" : "",
    ];

    const row = createNode(
      "div",
      classes.filter(Boolean).join(" ")
    );

    const date = createNode("div", "class-day");

    date.append(
      createNode("span", "", turn.shortDay),
      createNode("strong", "", turn.hour)
    );

    const info = createNode("div", "class-info");

    info.append(
      createNode("strong", "", turn.title),
      createNode("span", "", `Monitor: ${turn.coach}`)
    );

    if (turn.modified) {
      const message = turn.created
        ? "✓ Turno creado en la demo"
        : `✓ Reasignado: ${turn.defaultCoach} → ${turn.coach}`;

      info.append(
        createNode("span", "class-status", message)
      );
    }

    row.append(date, info);

    if (editable) {
      const button = createNode(
        "button",
        "change-class",
        selected ? "Seleccionado" : "Gestionar"
      );

      button.type = "button";
      button.dataset.turnId = turn.id;

      button.setAttribute(
        "aria-label",
        `Gestionar turno: ${turn.title}, ` +
          `${turn.day} ${turn.hour}`
      );

      row.append(button);
    }

    return row;
  }

  function createUI(turnService) {
    const elements = {
      roleManager: byId("role-manager"),
      roleCoach: byId("role-coach"),
      managerView: byId("manager-view"),
      coachView: byId("coach-view"),
      coachClasses: byId("coach-classes"),
      coachSelect: byId("coach-select"),
      coachNotice: byId("coach-notice"),
      coachSidebar: byId("coach-sidebar"),

      editor: byId("editor"),
      editorHeading: byId("editor-heading"),
      editorDescription: byId("editor-description"),
      assignmentPanel: byId("assignment-panel"),
      creationPanel: byId("creation-panel"),
      creationWarning: byId("creation-warning"),
      assignmentWarning: byId("assignment-warning"),
      selectedClass: byId("selected-class"),

      // NUEVOS CONTROLES SPRINT 3
      s3Actions: byId("s3-actions"),
      s3CreatedOnly: byId("s3-created-only"),
      scheduleForm: byId("schedule-form"),
      scheduleDay: byId("schedule-day"),
      scheduleHour: byId("schedule-hour"),
      scheduleWarning: byId("schedule-warning"),
      deleteTurnButton: byId("delete-turn-button"),

      newCoach: byId("new-coach"),
      saveButton: byId("save-button"),
      createTurnButton: byId("create-turn-button"),
      cancelCreateButton: byId("cancel-create-button"),
      changeReceipt: byId("change-receipt"),
      receiptDescription: byId("receipt-description"),
      seeCoachButton: byId("see-coach-button"),
      undoButton: byId("undo-button"),
      resetButton: byId("reset-button"),
      listTitle: byId("list-title"),
      listSubtitle: byId("list-subtitle"),
      classCount: byId("class-count"),
      changesChip: byId("changes-chip"),
      statusText: byId("status-text"),
    };

    // Estado exclusivamente visual.
    const view = {
      role: "manager",
      mode: "edit",
      selectedId: "clase-3",
      coach: "Diego",
    };

    function status(message) {
      elements.statusText.textContent = message;
    }

    function showWarning(element, message = "") {
      element.textContent = message;
      element.hidden = !message;
    }

    // SPRINT 3: mostrar edición y eliminación solo
    // para los turnos creados en esta demo.
    function renderS3Actions(turn) {
      const canEdit = Boolean(
        turn &&
        turn.created &&
        view.mode === "edit"
      );

      elements.s3Actions.hidden = !canEdit;

      elements.s3CreatedOnly.hidden =
        view.mode !== "edit" ||
        Boolean(turn && turn.created);

      if (canEdit) {
        fillSelect(
          elements.scheduleDay,
          data.days,
          turn.day
        );

        elements.scheduleHour.value = turn.hour;
      }

      showWarning(elements.scheduleWarning);
    }

    function renderManager() {
      const turns = turnService.listTurns();

      const selected =
        turns.find(turn => turn.id === view.selectedId) ||
        turns[0];

      view.selectedId = selected.id;

      renderS3Actions(selected);

      const rows = turns.map(turn =>
        createTurnRow(turn, {
          editable: true,
          selected:
            view.mode === "edit" &&
            turn.id === selected.id,
        })
      );

      elements.managerView.replaceChildren(...rows);

      elements.selectedClass.replaceChildren(
        createNode("strong", "", selected.title),
        createNode(
          "span",
          "",
          `${selected.day} · ${selected.hour} · ` +
            `Asignado a: ${selected.coach}`
        )
      );

      fillSelect(
        elements.newCoach,
        data.coaches,
        selected.coach
      );

      elements.saveButton.disabled = true;
      elements.assignmentPanel.hidden = view.mode !== "edit";
      elements.creationPanel.hidden = view.mode !== "create";
      elements.createTurnButton.hidden = view.mode === "create";

      elements.editorHeading.textContent =
        view.mode === "create"
          ? "Crear y asignar turno"
          : "Gestionar turno";

      elements.editorDescription.textContent =
        view.mode === "create"
          ? "Elige la clase, el día, la hora y el monitor. " +
            "El turno aparecerá en su horario."
          : "Selecciona un turno. Puedes cambiar el monitor y, si es nuevo, editarlo o eliminarlo.";

      showWarning(elements.assignmentWarning);
    }

    function renderCoach() {
      fillSelect(
        elements.coachSelect,
        data.coaches,
        view.coach
      );

      const turns = turnService.listTurns(view.coach);

      const rows = turns.map(turn =>
        createTurnRow(turn, {
          editable: false,
          selected: false,
        })
      );

      elements.coachClasses.replaceChildren(...rows);

      if (!turns.length) {
        elements.coachClasses.append(
          createNode(
            "div",
            "empty-note",
            "Este monitor no tiene turnos asignados."
          )
        );
      }

      elements.classCount.textContent =
        `${turns.length} ` +
        (turns.length === 1 ? "turno" : "turnos");

      elements.coachNotice.textContent =
        turnService.getCoachNotice(view.coach);
    }

    function renderReceipt() {
      const action = turnService.getLastAction();

      elements.changeReceipt.hidden =
        !action || view.role !== "manager";

      if (!action) {
        return;
      }

      const { turn } = action;

      elements.receiptDescription.textContent =
        action.type === "create"
          ? `${turn.title} · ${turn.day} ${turn.hour}: ` +
            `turno creado para ${action.to}.`
          : `${turn.title} · ${turn.day} ${turn.hour}: ` +
            `${action.from} → ${action.to}.`;
    }

    function render() {
      const manager = view.role === "manager";

      elements.roleManager.classList.toggle(
        "active",
        manager
      );

      elements.roleCoach.classList.toggle(
        "active",
        !manager
      );

      elements.roleManager.setAttribute(
        "aria-pressed",
        String(manager)
      );

      elements.roleCoach.setAttribute(
        "aria-pressed",
        String(!manager)
      );

      elements.managerView.hidden = !manager;
      elements.coachView.hidden = manager;
      elements.editor.hidden = !manager;
      elements.coachSidebar.hidden = manager;

      elements.createTurnButton.hidden =
        !manager || view.mode === "create";

      elements.listTitle.textContent = manager
        ? "Turnos del gimnasio"
        : "Mis turnos";

      elements.listSubtitle.textContent = manager
        ? "Crea o gestiona los turnos del gimnasio."
        : "Elige un monitor ficticio para ver sus turnos asignados.";

      const count = turnService.getChangesCount();

      elements.changesChip.textContent =
        `${count} ` +
        (count === 1
          ? "cambio activo"
          : "cambios activos");

      elements.changesChip.classList.toggle(
        "has-changes",
        count > 0
      );

      elements.classCount.textContent =
        `${turnService.listTurns().length} turnos`;

      if (manager) {
        renderManager();
      } else {
        renderCoach();
      }

      renderReceipt();
    }

    function selectTurn(id) {
      const exists = turnService.listTurns().some(
        turn => turn.id === id
      );

      if (!exists) {
        return;
      }

      view.selectedId = id;
      view.mode = "edit";

      render();

      status(
        "Turno seleccionado. Puedes gestionar sus opciones."
      );

      if (matchMedia("(max-width: 760px)").matches) {
        elements.editorHeading.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }

    function init() {
      fillSelect(
        byId("create-coach"),
        data.coaches,
        "Diego"
      );

      // Cambiar entre Encargado y Monitor.
      elements.roleManager.addEventListener(
        "click",
        () => {
          view.role = "manager";
          render();

          status(
            "Vista Encargado: crea o gestiona turnos."
          );
        }
      );

      elements.roleCoach.addEventListener(
        "click",
        () => {
          view.role = "coach";
          render();

          status(
            `Vista Monitor: turnos de ${view.coach}.`
          );
        }
      );

      // Seleccionar un turno.
      elements.managerView.addEventListener(
        "click",
        event => {
          const button = event.target.closest(
            "button[data-turn-id]"
          );

          if (button) {
            selectTurn(button.dataset.turnId);
          }
        }
      );

      elements.coachSelect.addEventListener(
        "change",
        event => {
          view.coach = event.target.value;
          renderCoach();

          status(
            `Mostrando los turnos de ${view.coach}.`
          );
        }
      );

      elements.newCoach.addEventListener(
        "change",
        () => {
          const selected = turnService
            .listTurns()
            .find(turn => turn.id === view.selectedId);

          elements.saveButton.disabled =
            !selected ||
            elements.newCoach.value === selected.coach;

          showWarning(elements.assignmentWarning);
        }
      );

      // Reasignar un turno.
      elements.saveButton.addEventListener(
        "click",
        () => {
          const result = turnService.assignTurn(
            view.selectedId,
            elements.newCoach.value
          );

          if (!result.ok) {
            showWarning(
              elements.assignmentWarning,
              result.message
            );

            status(result.message);
            return;
          }

          view.coach = result.coach;

          render();
          status(result.message);
        }
      );

      // Abrir formulario de creación.
      elements.createTurnButton.addEventListener(
        "click",
        () => {
          view.mode = "create";

          showWarning(elements.creationWarning);

          render();

          status(
            "Introduce el horario y el monitor del nuevo turno."
          );

          byId("create-title").focus();

          if (matchMedia("(max-width: 760px)").matches) {
            elements.editorHeading.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      );

      elements.cancelCreateButton.addEventListener(
        "click",
        () => {
          view.mode = "edit";

          render();

          status(
            "Puedes gestionar los turnos existentes."
          );
        }
      );

      // Crear y asignar turno.
      elements.creationPanel.addEventListener(
        "submit",
        event => {
          event.preventDefault();

          const result = turnService.addTurn({
            title: byId("create-title").value,
            day: byId("create-day").value,
            hour: byId("create-hour").value,
            coach: byId("create-coach").value,
          });

          if (!result.ok) {
            showWarning(
              elements.creationWarning,
              result.message
            );

            status(result.message);
            return;
          }

          view.selectedId = result.id;
          view.coach = result.coach;
          view.mode = "edit";

          render();
          status(result.message);
        }
      );

      // SPRINT 3: editar día y hora.
      // Álvaro implementará la lógica en turnos.js.
      elements.scheduleForm.addEventListener(
        "submit",
        event => {
          event.preventDefault();

          const turn = turnService.listTurns().find(
            item => item.id === view.selectedId
          );

          if (!turn || !turn.created) {
            showWarning(
              elements.scheduleWarning,
              "Solo puedes editar turnos creados en la demo."
            );
            return;
          }

          const day = elements.scheduleDay.value;
          const hour = elements.scheduleHour.value;

          if (day === turn.day && hour === turn.hour) {
            showWarning(
              elements.scheduleWarning,
              "No has cambiado ni el día ni la hora."
            );
            return;
          }

          if (
            typeof turnService.editTurnSchedule !== "function"
          ) {
            showWarning(
              elements.scheduleWarning,
              "Falta conectar editTurnSchedule(id, day, hour) en js/turnos.js."
            );
            return;
          }

          const result = turnService.editTurnSchedule(
            turn.id,
            day,
            hour
          );

          if (!result?.ok) {
            const message =
              result?.message ||
              "No se ha podido actualizar el horario.";

            showWarning(
              elements.scheduleWarning,
              message
            );

            status(message);
            return;
          }

          render();

          // El recibo antiguo no debe aparentar
          // ser la confirmación del nuevo cambio.
          elements.changeReceipt.hidden = true;

          status(
            result.message ||
            "Horario actualizado correctamente."
          );
        }
      );

      // SPRINT 3: eliminar un turno creado.
      elements.deleteTurnButton.addEventListener(
        "click",
        () => {
          const turn = turnService.listTurns().find(
            item => item.id === view.selectedId
          );

          if (!turn || !turn.created) {
            showWarning(
              elements.scheduleWarning,
              "Los turnos originales no se pueden eliminar."
            );
            return;
          }

          if (typeof turnService.deleteTurn !== "function") {
            showWarning(
              elements.scheduleWarning,
              "Falta conectar deleteTurn(id) en js/turnos.js."
            );
            return;
          }

          const confirmed = window.confirm(
            `¿Eliminar «${turn.title}» del ${turn.day} a las ${turn.hour}?`
          );

          if (!confirmed) {
            return;
          }

          const result = turnService.deleteTurn(turn.id);

          if (!result?.ok) {
            const message =
              result?.message ||
              "No se ha podido eliminar el turno.";

            showWarning(
              elements.scheduleWarning,
              message
            );

            status(message);
            return;
          }

          view.selectedId =
            turnService.listTurns()[0]?.id ?? null;

          view.mode = "edit";

          render();
          elements.changeReceipt.hidden = true;

          status(
            result.message ||
            "Turno eliminado correctamente."
          );
        }
      );

      // Consultar resultado como monitor.
      elements.seeCoachButton.addEventListener(
        "click",
        () => {
          const action = turnService.getLastAction();

          if (!action) {
            return;
          }

          view.coach = action.to;
          view.role = "coach";

          render();

          status(
            `${view.coach} ya puede consultar su turno ` +
            "en esta simulación."
          );

          elements.roleCoach.focus();
        }
      );

      // Deshacer la última operación.
      elements.undoButton.addEventListener(
        "click",
        () => {
          const result = turnService.undo();

          view.role = "manager";
          view.mode = "edit";
          view.selectedId = "clase-3";

          render();
          status(result.message);
        }
      );

      // Restaurar datos iniciales.
      elements.resetButton.addEventListener(
        "click",
        () => {
          turnService.reset();

          view.role = "manager";
          view.mode = "edit";
          view.selectedId = "clase-3";
          view.coach = "Diego";

          render();

          status(
            "Demo reiniciada: cinco turnos ficticios originales."
          );
        }
      );

      render();
    }

    return { init };
  }

  window.Relevo.createUI = createUI;
})();
