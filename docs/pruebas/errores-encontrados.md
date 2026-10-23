# Errores encontrados al ejecutar los casos de prueba

Registro de lo que falló en las ejecuciones anteriores a la que aparece en `casos-de-prueba.md`, y cómo se corrigió.

| N.º | Fecha | Qué pasó | Causa | Corrección | Comprobación |
| --- | --- | --- | --- | --- | --- |
| 1 | 23 oct 2026 | Los 20 casos fallaron: las pantallas mostraban «No se pudieron cargar los proyectos». | Al reiniciar la base de datos, PostgreSQL cerró las conexiones inactivas del servidor; el aviso de conexión cerrada no tenía quién lo atendiera y detuvo el proceso de los servicios por completo. | El servidor atiende ese aviso: registra el mensaje, descarta la conexión y abre otra en la siguiente consulta (`backend/src/datos/conexion.js`). | Prueba automatizada nueva en `backend/test/api.test.js` que corta las conexiones desde la base y vuelve a consultar. Falla sin la corrección y pasa con ella. |
| 2 | 23 oct 2026 | CP-17 y CP-18 fallaron. | Error del caso, no del módulo: después de agregar una actividad, el formulario sigue abierto y conserva el responsable para capturar varias seguidas. El caso no borraba el responsable, así que se guardó una segunda actividad, y CP-18 encontró «1 de 2» en lugar de «1 de 1». | El caso borra el responsable antes de enviar y comprueba que la etapa siga con una sola actividad. | Ejecución completa: 20 de 20. |
