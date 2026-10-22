import type { LegalDocument, LegalDocumentId } from '../models/legal-document.model';

// Fecha de aprobación original proporcionada por el usuario.
// La actualización registra esta corrección y la incorporación de datos del consultorio.
// Datos del consultorio tomados del proyecto web RubiRamos:
// src/app/politicas/page.tsx, src/app/terminos/page.tsx y
// src/components/footer/clinic-location.ts.
// Antes de publicar: confirmar finalidades, proveedores, transferencias,
// procedimientos ARCO y declaraciones de seguridad con la operación real.
// Las siguientes son instrucciones editoriales, no párrafos para pacientes:
// 2. Datos personales que se recopilan: No afirmar que la aplicación recopila ubicación, contactos del dispositivo, información publicitaria u otros datos que no estén respaldados por el código real.
// 3. Finalidades del tratamiento de datos: No afirmar que actualmente se realizan promociones ni tratamientos secundarios si no están implementados.
// 5. Almacenamiento y seguridad de la información: No asegurar que se utiliza una tecnología de cifrado, certificación de seguridad o infraestructura específica sin verificar previamente su implementación.
// 6. Uso compartido de información: Antes de publicar este documento deberán identificarse las transferencias de datos realmente efectuadas por el consultorio y distinguirlas de los servicios prestados por proveedores que tratan información por cuenta del responsable.
// 4. Consultas y citas: No inventar penalizaciones, plazos o restricciones que no estén aprobados.
// 9. Disponibilidad de la aplicación: No establecer exenciones absolutas de responsabilidad ni limitar derechos que correspondan legalmente a los usuarios.

export const LEGAL_DOCUMENTS: Readonly<Record<LegalDocumentId, LegalDocument>> = {
  "privacy": {
    "id": "privacy",
    "title": "Política de privacidad",
    "subtitle": "Aviso de privacidad para pacientes de Rubí Ramos Nutrióloga",
    "approvedAt": "30 de septiembre de 2025",
    "updatedAt": "22 de octubre de 2026",
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
            "text": "Para proporcionar los servicios de la aplicación y facilitar el seguimiento nutricional, el consultorio podrá tratar los siguientes datos cuando correspondan a los servicios utilizados:"
          },
          {
            "kind": "subheading",
            "text": "Datos de identificación y contacto:"
          },
          {
            "kind": "list",
            "items": [
              "Nombre y apellidos.",
              "Fecha de nacimiento y edad.",
              "Teléfono.",
              "Correo electrónico.",
              "Nombre de usuario."
            ]
          },
          {
            "kind": "subheading",
            "text": "Datos relacionados con la atención nutricional:"
          },
          {
            "kind": "list",
            "items": [
              "Peso y estatura.",
              "Índice de masa corporal.",
              "Porcentaje de grasa corporal.",
              "Masa muscular y medidas antropométricas.",
              "Antecedentes médicos y familiares.",
              "Información sobre alimentación y hábitos.",
              "Evaluaciones nutricionales.",
              "Objetivos del tratamiento.",
              "Diagnósticos y observaciones profesionales.",
              "Planes alimenticios y seguimiento del paciente."
            ]
          },
          {
            "kind": "subheading",
            "text": "Datos relacionados con citas y pagos:"
          },
          {
            "kind": "list",
            "items": [
              "Fechas y horarios de las citas.",
              "Estado de las reservaciones.",
              "Comprobantes de transferencia enviados por el paciente.",
              "Información necesaria para verificar la recepción de pagos."
            ]
          },
          {
            "kind": "paragraph",
            "text": "También podrán tratarse datos técnicos estrictamente necesarios para el funcionamiento y la seguridad de la sesión."
          }
        ]
      },
      {
        "title": "3. Finalidades del tratamiento de datos",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los datos personales se utilizan para las siguientes finalidades relacionadas con la prestación de los servicios del consultorio:"
          },
          {
            "kind": "list",
            "items": [
              "Identificar a los pacientes.",
              "Permitir el acceso seguro a la aplicación.",
              "Administrar la cuenta personal.",
              "Gestionar solicitudes y seguimiento de citas.",
              "Verificar comprobantes de pago.",
              "Registrar evaluaciones e historial nutricional.",
              "Consultar y dar seguimiento a mediciones corporales.",
              "Proporcionar planes alimenticios individualizados.",
              "Mantener la comunicación necesaria para la atención.",
              "Gestionar la seguridad y el funcionamiento del servicio.",
              "Atender obligaciones legales aplicables."
            ]
          },
          {
            "kind": "paragraph",
            "text": "El uso de los datos para finalidades adicionales, como publicidad o promociones, requerirá que dichas finalidades se informen adecuadamente y que se obtenga el consentimiento correspondiente cuando la ley lo exija."
          }
        ]
      },
      {
        "title": "4. Protección de datos de salud",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "La información médica y nutricional de los pacientes puede constituir información personal sensible, por lo que requiere especial protección."
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
            "text": "El consultorio debe implementar medidas administrativas, técnicas y físicas apropiadas para proteger los datos personales contra accesos no autorizados, pérdida, alteraciones o divulgación indebida."
          },
          {
            "kind": "paragraph",
            "text": "El acceso a los datos debe limitarse al paciente correspondiente y al personal autorizado para realizar las actividades necesarias."
          },
          {
            "kind": "paragraph",
            "text": "Los datos pueden procesarse mediante proveedores tecnológicos que prestan servicios al consultorio, bajo las obligaciones de confidencialidad, protección y tratamiento que correspondan."
          }
        ]
      },
      {
        "title": "6. Uso compartido de información",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los datos personales no deben compartirse con terceros para finalidades ajenas a las informadas sin contar con una base legal aplicable."
          },
          {
            "kind": "paragraph",
            "text": "Podrán realizarse comunicaciones de información cuando sean necesarias para prestar los servicios, cumplir obligaciones legales o atender requerimientos válidos de autoridades competentes, conforme a la legislación."
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
            "text": "La aplicación ya permite consultar cierta información personal y actualizar determinados datos de la cuenta."
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
        "title": "10. Modificaciones a esta política",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "El consultorio podrá actualizar este aviso para reflejar modificaciones en sus servicios, procedimientos o requisitos legales."
          },
          {
            "kind": "paragraph",
            "text": "Los cambios se comunicarán a través de la página de Aviso de Privacidad del sitio del consultorio, y la versión vigente estará disponible para consulta desde la aplicación."
          }
        ]
      }
    ]
  },
  "terms": {
    "id": "terms",
    "title": "Términos y condiciones",
    "subtitle": "Uso de la aplicación Rubí Ramos Nutrióloga",
    "approvedAt": "30 de septiembre de 2025",
    "updatedAt": "22 de octubre de 2026",
    "sections": [
      {
        "title": "1. Introducción",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Bienvenido a la aplicación móvil de Rubí Ramos Nutrióloga."
          },
          {
            "kind": "paragraph",
            "text": "Esta aplicación tiene como finalidad facilitar a los pacientes del consultorio el acceso a información relacionada con su seguimiento nutricional, citas, evaluaciones y planes alimenticios."
          },
          {
            "kind": "paragraph",
            "text": "Los presentes términos establecen las condiciones generales de utilización de las funcionalidades disponibles."
          }
        ]
      },
      {
        "title": "2. Acceso a la aplicación",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "La aplicación está destinada a los pacientes autorizados del consultorio que cuenten con credenciales de acceso."
          },
          {
            "kind": "paragraph",
            "text": "Para ingresar, el paciente debe utilizar su usuario o las credenciales admitidas por el sistema y su contraseña."
          },
          {
            "kind": "paragraph",
            "text": "Cada paciente es responsable de utilizar adecuadamente sus credenciales y evitar compartirlas con personas no autorizadas."
          },
          {
            "kind": "paragraph",
            "text": "En caso de sospechar que alguien accedió indebidamente a su cuenta, deberá comunicarse con el consultorio."
          }
        ]
      },
      {
        "title": "3. Información del perfil",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "La aplicación permite al paciente consultar y actualizar determinados datos personales."
          },
          {
            "kind": "paragraph",
            "text": "El usuario se compromete a proporcionar información correcta y actualizada para facilitar la comunicación y la prestación de los servicios."
          },
          {
            "kind": "paragraph",
            "text": "Algunos datos relacionados con la atención clínica podrán requerir la intervención del personal autorizado para su modificación."
          }
        ]
      },
      {
        "title": "4. Consultas y citas",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "La aplicación permite consultar información de citas, revisar disponibilidad y realizar solicitudes de reservación conforme a las funcionalidades habilitadas."
          },
          {
            "kind": "paragraph",
            "text": "La disponibilidad de horarios depende de la agenda del consultorio."
          },
          {
            "kind": "paragraph",
            "text": "Las solicitudes de citas están sujetas a las validaciones y estados de confirmación establecidos por el sistema y el consultorio."
          },
          {
            "kind": "paragraph",
            "text": "Las políticas específicas de cancelación, reprogramación, anticipos y reembolsos deberán informarse por separado cuando resulten aplicables."
          }
        ]
      },
      {
        "title": "5. Comprobantes de pago",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Cuando se solicite un pago por transferencia, el paciente podrá cargar el comprobante correspondiente mediante las funciones disponibles."
          },
          {
            "kind": "paragraph",
            "text": "El envío del comprobante sirve para proporcionar información que permita revisar el pago y no garantiza por sí mismo su validación definitiva."
          },
          {
            "kind": "paragraph",
            "text": "El paciente deberá verificar que los datos de transferencia correspondan a los proporcionados oficialmente por el consultorio."
          },
          {
            "kind": "paragraph",
            "text": "No almacenar ni solicitar contraseñas bancarias, NIP u otros datos que no resulten necesarios para verificar el comprobante."
          }
        ]
      },
      {
        "title": "6. Historial médico y seguimiento nutricional",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "La aplicación permite al paciente consultar sus evaluaciones, registros y mediciones nutricionales."
          },
          {
            "kind": "paragraph",
            "text": "Esta información refleja datos registrados durante su atención y puede incluir cálculos orientativos de progreso."
          },
          {
            "kind": "paragraph",
            "text": "Los indicadores de peso y composición corporal deben interpretarse dentro del contexto clínico de cada paciente."
          },
          {
            "kind": "paragraph",
            "text": "Los indicadores visuales, las gráficas y los cálculos automáticos no constituyen por sí mismos un diagnóstico médico ni sustituyen la valoración individual del profesional de salud."
          }
        ]
      },
      {
        "title": "7. Plan alimenticio",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los planes alimenticios que se muestran en la aplicación están destinados al paciente para el cual fueron preparados."
          },
          {
            "kind": "paragraph",
            "text": "El paciente deberá consultar con la profesional responsable cualquier duda relacionada con alimentos, cantidades, modificaciones o recomendaciones nutricionales."
          },
          {
            "kind": "paragraph",
            "text": "No se recomienda utilizar el plan de otra persona, debido a que las necesidades nutricionales pueden variar entre pacientes."
          }
        ]
      },
      {
        "title": "8. Responsabilidades del usuario",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Al utilizar la aplicación, el paciente deberá:"
          },
          {
            "kind": "list",
            "items": [
              "Proporcionar información verídica.",
              "Mantener la confidencialidad de sus credenciales.",
              "No intentar acceder a cuentas ajenas.",
              "Utilizar la plataforma de manera respetuosa.",
              "No realizar acciones destinadas a perjudicar la seguridad o el funcionamiento del servicio.",
              "Comunicar cualquier error importante detectado en sus datos o información clínica."
            ]
          }
        ]
      },
      {
        "title": "9. Disponibilidad de la aplicación",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "El consultorio procurará mantener disponibles las funciones de la aplicación."
          },
          {
            "kind": "paragraph",
            "text": "Sin embargo, pueden presentarse interrupciones temporales relacionadas con mantenimiento, conexión a internet o incidencias técnicas."
          },
          {
            "kind": "paragraph",
            "text": "En caso de fallas, los pacientes podrán utilizar los medios oficiales de contacto del consultorio para recibir orientación sobre sus citas o servicios."
          }
        ]
      },
      {
        "title": "10. Privacidad y protección de datos",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "El tratamiento de los datos personales de los pacientes se describe en el Aviso de privacidad disponible desde la pantalla de inicio de sesión."
          },
          {
            "kind": "paragraph",
            "text": "Los pacientes pueden consultar dicho documento para conocer cómo se utilizan sus datos y los medios disponibles para ejercer sus derechos ARCO."
          },
          {
            "kind": "paragraph",
            "text": "Estos términos y condiciones no sustituyen el aviso de privacidad ni los mecanismos de consentimiento requeridos legalmente."
          }
        ]
      },
      {
        "title": "11. Uso de los contenidos",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los textos, recursos visuales y materiales de la aplicación deberán utilizarse respetando los derechos de sus respectivos titulares."
          },
          {
            "kind": "paragraph",
            "text": "La información clínica personalizada está destinada al paciente correspondiente y debe manejarse de manera confidencial."
          }
        ]
      },
      {
        "title": "12. Modificaciones de los términos",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Los términos y condiciones podrán actualizarse cuando existan cambios en el funcionamiento de la aplicación o en las disposiciones aplicables."
          },
          {
            "kind": "paragraph",
            "text": "La versión vigente se pondrá a disposición de los usuarios y se informarán los cambios mediante los mecanismos correspondientes."
          }
        ]
      },
      {
        "title": "13. Contacto",
        "blocks": [
          {
            "kind": "paragraph",
            "text": "Para resolver dudas sobre la aplicación, las citas o los servicios del consultorio, el paciente podrá comunicarse mediante los canales oficiales."
          },
          {
            "kind": "paragraph",
            "text": "Correo: contacto@rubinutricion.com"
          }
        ]
      }
    ]
  }
};
