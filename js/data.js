
"use strict";

// Datos ficticios de la demostración.
(() => {
  const days = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
  ];

  const shortDays = ["LUN", "MAR", "MIÉ", "JUE", "VIE"];

  const coaches = [
    "Diego",
    "Marta",
    "Lucía",
    "Sergio",
  ];

  const classTypes = [
    "Boxeo inicial",
    "Boxeo técnico",
    "Boxeo avanzado",
    "Boxeo funcional",
  ];

  const initialTurns = [
    {
      id: "clase-1",
      day: "Lunes",
      hour: "18:00",
      title: "Boxeo inicial",
      defaultCoach: "Diego",
    },
    {
      id: "clase-2",
      day: "Martes",
      hour: "19:00",
      title: "Boxeo técnico",
      defaultCoach: "Marta",
    },
    {
      id: "clase-3",
      day: "Miércoles",
      hour: "18:30",
      title: "Boxeo avanzado",
      defaultCoach: "Lucía",
    },
    {
      id: "clase-4",
      day: "Jueves",
      hour: "19:00",
      title: "Boxeo inicial",
      defaultCoach: "Diego",
    },
    {
      id: "clase-5",
      day: "Viernes",
      hour: "17:30",
      title: "Boxeo funcional",
      defaultCoach: "Sergio",
    },
  ];

  window.Relevo = window.Relevo || {};

  window.Relevo.data = Object.freeze({
    days: Object.freeze(days),
    shortDays: Object.freeze(shortDays),
    coaches: Object.freeze(coaches),
    classTypes: Object.freeze(classTypes),

    initialTurns: Object.freeze(
      initialTurns.map(turn =>
        Object.freeze({ ...turn, created: false })
      )
    ),

    maxCreatedTurns: 25,
  });
})();
