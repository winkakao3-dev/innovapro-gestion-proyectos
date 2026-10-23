# Sesión de validación con el personal de Innovapro (actividad 14)

Semana 12 del plan: del 23 al 27 de noviembre de 2026. Este documento es el guion de la sesión y el formato para registrar las observaciones. Se llena durante la sesión.

## Datos de la sesión

| Dato | Valor |
| --- | --- |
| Fecha y hora | |
| Lugar o enlace | |
| Participantes (puesto, sin nombre) | |
| Versión del módulo | Commit o dirección de la versión publicada |
| Duración | 60 minutos |

## Preparación

- La base está reiniciada con los datos de prueba (`npm run bd:reiniciar`) o la versión de prueba está publicada.
- Se tiene a la mano un proyecto real de Innovapro (sin datos confidenciales) para capturarlo durante la sesión.
- El formato de observaciones está abierto para llenarlo en el momento.

## Agenda

| Minutos | Parte | Qué se hace |
| --- | --- | --- |
| 0 a 5 | Presentación | Para qué sirve el módulo y qué se espera de la sesión: que lo usen y digan qué no les sirve. |
| 5 a 40 | Tareas | El personal hace las tareas de la tabla siguiente sin ayuda; solo se interviene si se atora más de dos minutos. |
| 40 a 50 | Vista del cliente | Se entra con una cuenta de cliente y se revisa si lo que ve es lo que el cliente necesita saber. |
| 50 a 60 | Cierre | Preguntas abiertas y prioridad de cada observación. |

## Tareas para el personal

Se lee la tarea en voz alta y se anota si se completa, cuánto tarda y dónde duda.

| N.º | Tarea | ¿Se completó? | Tiempo | Dudas o comentarios |
| --- | --- | --- | --- | --- |
| T1 | Registra un cliente nuevo con su contacto. | | | |
| T2 | Registra un proyecto real de ese cliente con sus fechas. | | | |
| T3 | Agrega las etapas con las que trabajan ese tipo de proyecto. | | | |
| T4 | Agrega dos actividades a la primera etapa, con responsable y fecha límite. | | | |
| T5 | Marca una actividad como terminada. | | | |
| T6 | Termina la primera etapa y registra el avance del proyecto. | | | |
| T7 | Encuentra todos los proyectos pausados. | | | |
| T8 | Encuentra los proyectos de un cliente sin usar el filtro de estado. | | | |
| T9 | Como cliente, revisa en qué etapa va su proyecto y cuánto lleva. | | | |

## Preguntas de cierre

1. ¿Qué dato de un proyecto necesitan y no encontraron?
2. ¿Hay algo que el módulo pida y que en su trabajo no se use?
3. ¿Las etapas de ejemplo (levantamiento, diseño, ejecución y entrega) corresponden a como trabajan?
4. ¿Lo que ve el cliente es suficiente? ¿Hay algo que no debería ver?
5. ¿Quién actualizaría el avance y cada cuánto?

## Registro de observaciones

Prioridad: **alta** impide usar el módulo; **media** lo hace más lento o confuso; **baja** es una mejora.

| N.º | Pantalla | Observación | Prioridad | Corrección | Estado |
| --- | --- | --- | --- | --- | --- |
| O1 | | | | | Pendiente |
| O2 | | | | | Pendiente |
| O3 | | | | | Pendiente |

Después de la sesión, cada corrección se hace en su propia rama, se vuelven a ejecutar los casos de prueba (`npm run pruebas:funcionales`) y se marca la observación como corregida con el commit que la resolvió.
