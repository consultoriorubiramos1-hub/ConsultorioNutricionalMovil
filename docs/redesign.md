# Rediseño de Consultorio Nutricional Móvil

Implementado el 15 de octubre de 2026 sobre la aplicación existente (Expo SDK 57, React Native 0.86 y Expo Router). Se conserva la arquitectura MVVM, los adapters, los contratos REST y las rutas actuales. No se agregaron dependencias.

## Cambios por pantalla

| Pantalla | Cambios |
| --- | --- |
| Inicio de sesión | Logo PNG original centrado, bienvenida, fotografía local de alimentos, campos con iconos, mostrar/ocultar contraseña, avance de foco al campo de contraseña y botón naranja. Conserva autenticación y recuperación; sin registro público. |
| Recuperación de contraseña | Encabezado con logo y regreso, formularios claros y botones consistentes en todos los pasos. Conserva envío y validación del código y cambio de contraseña. |
| Inicio | Saludo del paciente, fotografía general, tarjetas de peso e IMC, próxima cita, plan activo, gráfica de peso y accesos rápidos. El plan usa el servicio existente `getActiveNutritionPlan`. Distingue datos ausentes y fallos parciales. |
| Menú lateral | Panel izquierdo sobre la pantalla actual, logo original, iconos, selección verde, fondo atenuado y cierre por botón, fondo o Atrás. Abrir/cerrar no navega; seleccionar la ruta actual solo cierra. |
| Perfil | Identidad con iniciales reales, pestaña Datos abierta inicialmente, tarjetas y campos adaptables con iconos, estados de foco y controles de contraseña. Mantiene todos los campos y guardados existentes. |
| Mis citas | Próxima cita destacada, calendario compacto y etiquetas por estado. Listas de próximas e historial, sin duplicar la cita destacada. Conserva cancelar y reprogramar, con las confirmaciones existentes. |
| Agendar/Reprogramar | Fecha, horarios con selección verde, referencia a hora CDMX, datos bancarios, notas, zona de comprobante, vista previa y solicitud. Mantiene restricciones de disponibilidad, anticipo y formatos. |
| Historial médico | Tarjeta del paciente, todas las secciones clínicas desplegables y evaluaciones con sus detalles. Se conservan los datos de contacto, antecedentes, antropometría, parámetros bioquímicos, diagnóstico, intervención y seguimiento. |
| Mi progreso | Tercera pestaña dentro del historial, peso inicial/actual, diferencia e IMC calculados con mediciones disponibles, gráfica con fechas reales y composición corporal existente. Sin porcentajes de cumplimiento inventados. |
| Plan alimenticio | Resumen del plan, horarios horizontales, pestañas de menús disponibles y tarjetas por comida con acceso a su preparación. Respeta días y textos del servidor. |
| Preparación | Vista secundaria modal con logo y regreso; conserva íntegramente las indicaciones, incluidos saltos de línea, y muestra tipo de comida y horario. |
| Muro informativo | Búsqueda compacta, tarjetas con miniatura cuando existe, fecha, título, resumen y lectura completa. Mantiene likes, enlaces, galerías y ampliación de imágenes. Sin publicaciones ni categorías inventadas. |

## Sistema visual y navegación

Fondo claro, texto oscuro, verde `#8CC63F`, naranja `#FF7925`, superficies suaves y sombras discretas. Los botones usan un naranja más oscuro y letra grande para mejorar contraste. Las tarjetas y formularios se limitan a un ancho legible en pantallas grandes y se adaptan a pantallas pequeñas. Se conserva Lato, ya instalado.

Se reutiliza un encabezado común con el logo y un menú o regreso, según corresponda. No se añadió una barra inferior: el repositorio utiliza Stack y menú lateral. Los formularios conservan desplazamiento vertical y tratamiento del teclado. Las listas extensas del historial y muro siguen virtualizadas.

## Información que depende del sistema existente

- Los datos bancarios siguen en `src/modules/citas/config/bank-transfer.ts`, con `null` hasta contar con valores confirmados. La interfaz muestra “Pendiente de configurar”. Los valores son seleccionables; no se añadió una dependencia para copiar al portapapeles.
- El comprobante sigue aceptando JPG, PNG o WEBP, hasta 5 MB. PDF no forma parte del proceso existente.
- El contrato actual del plan solo entrega `description` por comida. No hay campos independientes de nombre de receta, imagen, ingredientes o pasos. Se presenta el texto completo del servidor; no se fabrican esos datos ni se asignan fotos genéricas a una comida prescrita.
- No existe un peso objetivo numérico en el contrato actual. Se conservan los objetivos escritos en el detalle de intervención sin inferir una meta.
- Seguridad conserva su validación y aviso de que el cambio autenticado aún no está disponible. Se puede usar la recuperación de contraseña existente desde el acceso.
- No se agregaron hábitos diarios, hidratación, ejercicio, cuentas públicas ni modificaciones al backend o base de datos.

## Archivos modificados o añadidos

Base compartida:

- `src/constants/theme.ts`
- `src/components/ui/app-button.tsx`
- `src/components/ui/app-card.tsx`
- `src/components/ui/app-screen.tsx`
- `src/components/ui/app-header.tsx` (nuevo)
- `src/components/ui/app-icon.tsx` (nuevo)
- `src/components/ui/status-badge.tsx` (nuevo)
- `src/components/ui/weight-chart.tsx` (nuevo)
- `src/components/ui/index.ts`
- `assets/images/logo-rubi.png` (nuevo)
- `assets/images/nutrition-bowl.jpg` (nuevo)

Autenticación e inicio:

- `src/modules/auth/views/login-view.tsx`
- `src/modules/auth/views/password-recovery-view.tsx`
- `src/modules/dashboard/components/dashboard-menu.tsx`
- `src/modules/dashboard/views/dashboard-view.tsx`
- `src/modules/dashboard/models/dashboard.model.ts`
- `src/modules/dashboard/services/dashboard-service.ts`

Perfil:

- `src/modules/perfil/views/perfil-view.tsx`
- `src/modules/perfil/viewmodels/use-perfil-viewmodel.ts`
- `src/modules/perfil/components/perfil-tabs.tsx`
- `src/modules/perfil/components/perfil-field.tsx`
- `src/modules/perfil/components/datos-form.tsx`
- `src/modules/perfil/components/cuenta-form.tsx`
- `src/modules/perfil/components/seguridad-form.tsx`

Citas:

- `src/modules/citas/views/citas-view.tsx`
- `src/modules/citas/components/appointment-card.tsx`
- `src/modules/citas/components/appointment-date-picker.tsx`
- `src/modules/citas/components/appointment-form.tsx`
- `src/modules/citas/components/bank-transfer-card.tsx`

Historial y progreso:

- `src/modules/historial/views/historial-view.tsx`
- `src/modules/historial/models/historial.model.ts`
- `src/modules/historial/components/history-accordion.tsx`
- `src/modules/historial/components/patient-card.tsx`
- `src/modules/historial/components/progress-summary.tsx`
- `src/modules/historial/components/nutrition-progress.tsx` (nuevo)

Plan y muro:

- `src/modules/plan-alimenticio/views/plan-alimenticio-view.tsx`
- `src/modules/plan-alimenticio/components/plan-details.tsx`
- `src/modules/muro/views/muro-view.tsx`
- `src/modules/muro/components/post-card.tsx`
- `src/modules/muro/components/post-search.tsx`

Validación y documentación:

- `tests/unit/redesign-ui.test.ts` (nuevo)
- `tests/integration/mock/app-api.test.ts`
- `docs/redesign.md` (este archivo)

## Recursos gráficos

El logo se copió sin modificaciones desde `C:/Users/rmera/Downloads/RubiRamos/public/logo_rubi.png`, localizado durante la revisión de los recursos del consultorio. Se muestra mediante `expo-image` con `contentFit="contain"`.

La fotografía general es de Ella Olsson: [Salmon and quinoa dish](https://unsplash.com/photos/vegetable-salad-KPDbRyFOTnE), disponible bajo la [licencia de Unsplash](https://unsplash.com/license). Está incluida localmente para que inicio y acceso no dependan de una descarga remota. No representa una receta asignada al paciente.

## Verificaciones

- `npm run lint`: sin errores ni advertencias.
- `npm run typecheck`: correcto.
- Jest: 49 pruebas unitarias, incluyendo navegación del menú desde Perfil, transferencia/comprobante, mostrar contraseña, lectura de publicaciones y apertura/cierre de preparación.
- Pruebas heredadas: 67 pruebas correctas de adapters, servicios, disponibilidad, sesión y ViewModels.
- Integración simulada: 9 pruebas correctas; incluye el plan en el inicio, ausencia de plan, fallos parciales y sesión expirada.
- `expo export --platform web`: compilación de 11 rutas.
- `expo export --platform android`: bundle Hermes generado correctamente. No equivale a una APK ni a una prueba en un dispositivo.

La inspección visual mediante herramientas de navegador/escritorio no pudo completarse: no había navegador conectado y Chrome permaneció minimizado durante los intentos de captura. No se declara una validación visual en Android ni una prueba con el backend real. El servidor local puede iniciarse con `npm start`.
