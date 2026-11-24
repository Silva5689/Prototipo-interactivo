
# Relevo — Demo del MVP

Prototipo interactivo de gestión de turnos para un gimnasio con clases de boxeo.

Proyecto independiente de la one-page del Sprint 2 de Proyectos III.

## Funcionalidades

### Encargado

- Consultar los turnos existentes.
- Crear nuevas clases.
- Editar el día y la hora de los turnos creados.
- Asignar un monitor.
- Reasignar un turno existente.
- Evitar conflictos de horario.
- Deshacer la última operación.
- Reiniciar la demo.

### Monitor

- Seleccionar un monitor ficticio.
- Consultar sus turnos.
- Ver los cambios realizados en la simulación.

## Tecnologías

- HTML5
- CSS3
- JavaScript
- localStorage

No se utilizan frameworks ni dependencias externas.

## Arquitectura

- `index.html`: estructura de la interfaz.
- `styles.css`: estilos y diseño responsive.
- `js/data.js`: datos y catálogos ficticios.
- `js/storage.js`: almacenamiento local.
- `js/turnos.js`: lógica de negocio.
- `js/ui.js`: representación e interacciones.
- `js/main.js`: inicialización.

## Ejecutar

Abrir `index.html` en un navegador.

No necesita npm ni servidor.

## Limitaciones

Este proyecto es un prototipo interactivo del MVP.

- No existe autenticación real.
- Los datos son ficticios.
- No hay backend ni base de datos compartida.
- Los cambios solo se guardan en el navegador actual.
- No existe sincronización entre dispositivos.
- No hay notificaciones reales ni integración con Google Calendar.

## Objetivo

Mostrar cómo un encargado puede crear y asignar turnos y cómo los empleados pueden consultar sus horarios.

El prototipo sirve como demostración adicional para el Sprint 2.
