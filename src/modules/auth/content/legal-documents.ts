import type { LegalDocument, LegalDocumentId } from '../models/legal-document.model';

// Aprobación histórica documentada: 30/09/2025; no aprueba esta revisión.
// Revisión de bienestar del 26/10/2026 pendiente de validación del responsable y jurídica.
// Identidad y domicilio conservados del contenido documentado del proyecto.
// Correo operativo y autorizado confirmado por el usuario el 26/10/2026.
// Validar antes de publicar proveedores, transferencias, conservación y consentimiento.
// Seguimiento y pendientes: docs/bienestar-movil.md. No mostrar notas editoriales en el modal.

export const LEGAL_DOCUMENTS: Readonly<Record<LegalDocumentId, LegalDocument>> = {
  "privacy": {
    "id": "privacy",
    "title": "Aviso de Privacidad",
    "subtitle": "Aviso de privacidad para pacientes de Rubí Ramos Nutrióloga",
    "approvedAt": "30 de septiembre de 2025",
    "updatedAt": "26 de octubre de 2026",
    "sections": [
      {
        "title": "1. Responsable de los datos personales",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "El consultorio Rubí Ramos Nutrióloga, a través de su responsable legal, la Lic. Rubí Ramos Álvarez, con domicilio en Calle Prof. Juan Mojica Ugalde 11-B, Capitán Antonio Reyes, 43000 Huejutla de Reyes, Hgo., es responsable del tratamiento de los datos personales proporcionados por sus pacientes, de acuerdo con la legislación mexicana aplicable en materia de protección de datos personales."
          },
          {
            "kind": "paragraph",
            "text": "Para cualquier consulta relacionada con la privacidad o el tratamiento de información personal, los pacientes podrán comunicarse mediante contacto@rubinutricion.com."
          }
        ]
      },
      {
        "title": "2. Datos personales que se recopilan",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "ConsultorioNutricionalMovil muestra datos de identificación y contacto, mediciones corporales, evolución descriptiva del peso y planes alimenticios asociados a la cuenta. El sistema conectado del consultorio también puede tratar información clínica, de citas y de pagos a través del backend y la aplicación web administrativa, aunque esos apartados no se muestren en esta versión móvil."
          },
          {
            "kind": "subheading",
            "text": "Datos de identificación y contacto:"
          },
          {
            "kind": "list",
            "items": [
              "Nombre y apellidos, nombre de usuario y correo electrónico.",
              "Fecha de nacimiento, edad, género, teléfono, estado civil y ocupación, cuando estén registrados."
            ]
          },
          {
            "kind": "subheading",
            "text": "Datos de seguimiento nutricional y bienestar en la aplicación móvil:"
          },
          {
            "kind": "list",
            "items": [
              "En Mi progreso nutricional: fecha de medición, peso en kg, grasa corporal en porcentaje, masa muscular en porcentaje y circunferencia de cintura en cm.",
              "Gráfica y diferencia de peso entre registros válidos, con fines exclusivamente descriptivos.",
              "En Inicio: peso e índice de masa corporal orientativo, calculado con la estatura registrada, cuando estén disponibles.",
              "Planes alimenticios asociados a la cuenta."
            ]
          },
          {
            "kind": "subheading",
            "text": "Información clínica y administrativa del sistema conectado:"
          },
          {
            "kind": "list",
            "items": [
              "Antecedentes médicos y familiares, enfermedades, tratamientos e información ginecológica.",
              "Diagnósticos, resultados bioquímicos y de laboratorio, presión arterial, intervenciones y observaciones profesionales.",
              "Hábitos alimenticios, actividad física, sueño, hidratación, objetivos, otras circunferencias y pliegues corporales conservados en el sistema conectado, sin apartados de detalle en Mi progreso nutricional.",
              "Fechas y horarios de citas, estados de reservación y comprobantes de transferencia previamente aportados al consultorio."
            ]
          },
          {
            "kind": "paragraph",
            "text": "La aplicación móvil no permite reservar citas clínicas ni cargar comprobantes de pago. Dejar de mostrar los apartados clínicos no elimina sus datos del servidor. La respuesta del servidor utilizada para consultar el progreso puede incluir datos clínicos. Mi progreso nutricional selecciona únicamente la fecha y las cuatro mediciones indicadas; no utiliza diagnósticos, tratamientos ni objetivos clínicos para clasificar la evolución."
          },
          {
            "kind": "paragraph",
            "text": "También se tratan credenciales y un token de sesión para el acceso, datos de solicitudes ARCO que el usuario decida enviar por correo e interacciones con el muro informativo, como búsquedas y likes."
          }
        ]
      },
      {
        "title": "3. Finalidades del tratamiento de datos",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "En la aplicación móvil, los datos se utilizan para identificar al usuario, permitir el acceso a su cuenta, consultar y rectificar determinados datos del perfil, mostrar mediciones y comparaciones nutricionales, consultar el plan alimenticio y utilizar el muro informativo."
          },
          {
            "kind": "paragraph",
            "text": "Los datos de salud del sistema conectado también pueden utilizarse para la atención del consultorio, registrar evaluaciones clínicas y gestionar citas y comprobantes desde la aplicación web administrativa. La versión móvil de bienestar no ofrece esas funciones clínicas."
          },
          {
            "kind": "paragraph",
            "text": "Otras finalidades son atender solicitudes ARCO, mantener la comunicación necesaria, gestionar la seguridad de la sesión y atender obligaciones legales aplicables. Las finalidades adicionales requieren información y consentimiento cuando corresponda."
          }
        ]
      },
      {
        "title": "4. Protección de datos de salud",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "La información nutricional, las mediciones corporales y la información clínica del sistema conectado pueden constituir datos personales sensibles relacionados con la salud, aunque esta versión móvil esté orientada al bienestar."
          },
          {
            "kind": "paragraph",
            "text": "El consultorio deberá tratar esta información únicamente para finalidades legítimas relacionadas con la atención del paciente y conforme a las bases jurídicas y los mecanismos de consentimiento que resulten aplicables."
          },
          {
            "kind": "paragraph",
            "text": "La información médica no debe utilizarse para finalidades ajenas a las informadas sin cumplir los requisitos legales correspondientes."
          },
          {
            "kind": "paragraph",
            "text": "La simple acción de iniciar sesión en la aplicación no representa por sí misma el consentimiento expreso y por escrito para tratar datos personales sensibles."
          }
        ]
      },
      {
        "title": "5. Almacenamiento y seguridad de la información",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "La aplicación consulta y actualiza información mediante el servidor del consultorio. El token de acceso se guarda en el dispositivo mediante el almacenamiento seguro del sistema y se retira al cerrar la sesión. Esto no elimina los datos conservados en el servidor."
          },
          {
            "kind": "paragraph",
            "text": "El consultorio debe implementar medidas administrativas, técnicas y físicas apropiadas y limitar el acceso al titular y al personal autorizado. Estas medidas no suponen una garantía absoluta de seguridad ni una certificación de la infraestructura."
          },
          {
            "kind": "paragraph",
            "text": "El almacenamiento y procesamiento del sistema conectado pueden realizarse mediante servicios tecnológicos contratados por el responsable. La conservación de esa información se rige por sus finalidades y las obligaciones aplicables."
          }
        ]
      },
      {
        "title": "6. Uso compartido de información",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los proveedores de alojamiento, almacenamiento y operación del sistema pueden tratar información por cuenta del responsable para prestar sus servicios. Ese tratamiento debe distinguirse de las transferencias a terceros que usan los datos para sus propias finalidades."
          },
          {
            "kind": "paragraph",
            "text": "Al preparar una solicitud ARCO, la aplicación abre el programa de correo elegido por el usuario con los datos de la solicitud. Su envío y el tratamiento por el proveedor de correo dependen de la acción del usuario y del servicio de correo utilizado."
          },
          {
            "kind": "paragraph",
            "text": "Los datos personales no deben compartirse para finalidades ajenas a las informadas sin una base legal aplicable. Las transferencias que correspondan deberán informarse y sujetarse a los requisitos aplicables; también podrán atenderse requerimientos válidos de autoridades competentes."
          }
        ]
      },
      {
        "title": "7. Derechos ARCO",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los pacientes tienen derecho a ejercer sus derechos de:"
          },
          {
            "kind": "paragraph",
            "text": "Acceso: conocer los datos personales que el consultorio mantiene sobre ellos y la información relacionada con su tratamiento."
          },
          {
            "kind": "paragraph",
            "text": "Rectificación: solicitar la corrección de datos personales inexactos, incompletos o desactualizados."
          },
          {
            "kind": "paragraph",
            "text": "Cancelación: solicitar la cancelación de datos personales cuando legalmente proceda."
          },
          {
            "kind": "paragraph",
            "text": "Oposición: solicitar que cese el tratamiento de sus datos personales cuando exista una causa legal que lo justifique."
          },
          {
            "kind": "paragraph",
            "text": "La aplicación permite el Acceso a cierta información mediante el perfil, el plan y el progreso, y la Rectificación de determinados datos del perfil y la cuenta. Las demás solicitudes de acceso o corrección pueden presentarse al correo oficial."
          },
          {
            "kind": "paragraph",
            "text": "Para ejercer formalmente cualquiera de los derechos ARCO, el paciente podrá comunicarse a contacto@rubinutricion.com."
          },
          {
            "kind": "paragraph",
            "text": "La solicitud deberá identificar al titular, incluir un medio de contacto y especificar el derecho que se desea ejercer. Podrá requerirse información para acreditar su identidad o representación legal y los documentos que correspondan al tipo de solicitud."
          },
          {
            "kind": "paragraph",
            "text": "El consultorio atenderá las solicitudes dentro de los plazos establecidos por la legislación aplicable e informará su determinación."
          },
          {
            "kind": "paragraph",
            "text": "La cancelación de información no implica necesariamente la eliminación inmediata del expediente clínico, ya que existen supuestos de conservación legal."
          },
          {
            "kind": "paragraph",
            "text": "Desde el perfil se puede preparar un correo para solicitar la Cancelación o la Oposición. Abrir el programa de correo no confirma el envío, la recepción ni la resolución de la solicitud. Estas solicitudes no eliminan automáticamente toda la información ni equivalen por sí mismas al cierre de la cuenta."
          }
        ]
      },
      {
        "title": "8. Conservación de datos personales",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los datos personales se conservarán durante el tiempo necesario para cumplir las finalidades informadas y las obligaciones legales aplicables."
          },
          {
            "kind": "paragraph",
            "text": "La conservación de expedientes clínicos deberá respetar los plazos y requisitos establecidos por las disposiciones sanitarias correspondientes."
          },
          {
            "kind": "paragraph",
            "text": "Al concluir el periodo legalmente aplicable, los datos deberán tratarse conforme a las reglas de conservación, bloqueo y supresión que correspondan."
          },
          {
            "kind": "paragraph",
            "text": "Ocultar un apartado en la aplicación móvil o cerrar la sesión no suprime la información del sistema conectado. Las solicitudes de supresión se revisan considerando los datos solicitados, las finalidades vigentes y las obligaciones de conservación aplicables."
          }
        ]
      },
      {
        "title": "9. Limitación de uso y revocación del consentimiento",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los pacientes pueden solicitar la limitación del uso o divulgación de sus datos personales y, cuando corresponda, la revocación del consentimiento otorgado."
          },
          {
            "kind": "paragraph",
            "text": "Estas solicitudes podrán presentarse mediante contacto@rubinutricion.com."
          },
          {
            "kind": "paragraph",
            "text": "La revocación se tramitará conforme a la legislación y no tendrá efectos retroactivos."
          }
        ]
      },
      {
        "title": "10. Modificaciones del aviso",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "El consultorio podrá actualizar este aviso para reflejar modificaciones en sus servicios, procedimientos o requisitos legales."
          },
          {
            "kind": "paragraph",
            "text": "La versión actualizada estará disponible desde la aplicación. Los cambios se comunicarán mediante los canales oficiales que correspondan."
          }
        ]
      }
    ],
    "validationStatus": "pending"
  },
  "terms": {
    "id": "terms",
    "title": "Términos y condiciones",
    "subtitle": "Seguimiento nutricional y bienestar personal en ConsultorioNutricionalMovil",
    "approvedAt": "30 de septiembre de 2025",
    "updatedAt": "26 de octubre de 2026",
    "sections": [
      {
        "title": "1. Introducción",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Bienvenido a ConsultorioNutricionalMovil, una aplicación orientada al seguimiento nutricional y al bienestar personal."
          },
          {
            "kind": "paragraph",
            "text": "La aplicación permite al usuario consultar sus mediciones corporales, observar su progreso a lo largo del tiempo, acceder a información sobre alimentación y visualizar los planes alimenticios disponibles en su cuenta."
          },
          {
            "kind": "paragraph",
            "text": "Estos términos establecen las condiciones generales para utilizar las funcionalidades disponibles."
          }
        ]
      },
      {
        "title": "2. Acceso a la aplicación",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Para utilizar las funciones que requieren identificación, el usuario deberá contar con una cuenta autorizada y proporcionar sus credenciales de acceso."
          },
          {
            "kind": "paragraph",
            "text": "El usuario es responsable de mantener la confidencialidad de su contraseña y de informar cualquier uso no autorizado de su cuenta mediante los canales oficiales."
          }
        ]
      },
      {
        "title": "3. Seguimiento nutricional",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "La aplicación permite visualizar información sobre peso corporal, composición corporal, medidas antropométricas y evolución nutricional."
          },
          {
            "kind": "paragraph",
            "text": "Mi progreso nutricional es una única pantalla de seguimiento. Cada tarjeta histórica muestra la fecha, el peso en kg, la grasa corporal y la masa muscular en porcentaje y la circunferencia de cintura en cm. No ofrece pestañas de evaluación ni acceso a detalles clínicos. La gráfica y la diferencia de peso describen registros válidos, sin clasificar el progreso según diagnósticos, tratamientos u objetivos clínicos."
          },
          {
            "kind": "paragraph",
            "text": "Las mediciones y comparaciones se presentan con fines de seguimiento e información personal. Su interpretación depende de las características de cada usuario y de las condiciones en que fueron obtenidas."
          }
        ]
      },
      {
        "title": "4. Información de bienestar y limitaciones",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los indicadores, gráficas y cálculos disponibles en la aplicación tienen carácter informativo y orientativo."
          },
          {
            "kind": "paragraph",
            "text": "La aplicación no realiza diagnósticos médicos automáticos y la información mostrada no sustituye una evaluación individual realizada por un profesional de salud."
          },
          {
            "kind": "paragraph",
            "text": "El usuario no debe utilizar estos indicadores como única base para tomar decisiones médicas o modificar tratamientos."
          }
        ]
      },
      {
        "title": "5. Plan alimenticio",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "El usuario podrá consultar los planes alimenticios asociados a su cuenta cuando estén disponibles."
          },
          {
            "kind": "paragraph",
            "text": "Los planes personalizados no deben compartirse como recomendaciones universales, ya que las necesidades nutricionales pueden variar entre personas."
          },
          {
            "kind": "paragraph",
            "text": "Ante dudas sobre alimentación o necesidades particulares de salud, se recomienda acudir a un profesional competente."
          }
        ]
      },
      {
        "title": "6. Uso responsable",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "El usuario deberá proporcionar información correcta cuando corresponda, proteger sus credenciales, respetar la privacidad de otras personas y evitar cualquier actividad que afecte la seguridad o el funcionamiento de la aplicación."
          }
        ]
      },
      {
        "title": "7. Disponibilidad",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "El funcionamiento de la aplicación puede verse afectado temporalmente por mantenimiento, problemas de conexión o incidencias técnicas."
          },
          {
            "kind": "paragraph",
            "text": "Se procurará comunicar y atender los problemas del servicio mediante los canales oficiales disponibles."
          }
        ]
      },
      {
        "title": "8. Privacidad",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "El tratamiento de datos personales se describe en el Aviso de Privacidad disponible en la aplicación."
          },
          {
            "kind": "paragraph",
            "text": "El usuario podrá consultar ese documento para conocer las finalidades del tratamiento de sus datos, los medios de contacto y los procedimientos disponibles para ejercer sus derechos ARCO."
          }
        ]
      },
      {
        "title": "9. Cambios en los términos",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Estos términos podrán actualizarse para reflejar modificaciones reales en las funcionalidades, la operación del servicio o las disposiciones aplicables."
          },
          {
            "kind": "paragraph",
            "text": "La versión vigente estará disponible para consulta desde la aplicación."
          }
        ]
      },
      {
        "title": "10. Contacto",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Para dudas relacionadas con la aplicación o el tratamiento de datos personales, el usuario podrá consultar los medios oficiales de contacto publicados por el responsable del servicio."
          },
          {
            "kind": "paragraph",
            "text": "Correo: contacto@rubinutricion.com"
          }
        ]
      }
    ],
    "validationStatus": "pending"
  }
};
