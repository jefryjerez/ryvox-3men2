import type { Locale } from "@/i18n/config";

export interface LegalSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface LegalDocument {
  slug: "terminos" | "reembolsos" | "privacidad";
  title: string;
  eyebrow: string;
  description: string; // meta description
  updated: string;
  intro: string;
  sections: LegalSection[];
}

/*
 * Textos legales de la tienda. Datos de la empresa: Ryvox, 55 E Sunrise Hwy, Lindenhurst, NY 11757 · info@ryvoxshop.com.
 * Cuando exista la razón social definitiva (LLC), sustituir "Ryvox" por el nombre legal en el apartado "Quiénes somos".
 */

const es: Record<LegalDocument["slug"], LegalDocument> = {
  terminos: {
    slug: "terminos",
    title: "Términos y condiciones",
    eyebrow: "Legal",
    description: "Condiciones de compra en ryvoxshop.com: precios, pagos, envíos, garantía y uso de los productos RYVOX.",
    updated: "Última actualización: 10 de septiembre de 2026",
    intro:
      "Estos términos regulan el uso de ryvoxshop.com y cualquier compra que hagas en la tienda. Al navegar o hacer un pedido aceptas estas condiciones. Léelas con calma; si algo no te queda claro, escríbenos antes de comprar.",
    sections: [
      {
        heading: "1. Quiénes somos",
        paragraphs: [
          "RYVOX es una marca de herramientas y accesorios para barberos con sede en 55 E Sunrise Hwy, Lindenhurst, NY 11757, Estados Unidos. Puedes contactarnos en info@ryvoxshop.com. En estos términos, \"Ryvox\", \"nosotros\" o \"la tienda\" se refieren a esta empresa.",
        ],
      },
      {
        heading: "2. Uso de la tienda",
        paragraphs: [
          "Para comprar debes ser mayor de 18 años o contar con el permiso de un adulto responsable. Te comprometes a facilitar datos de contacto y de envío correctos y a usar la tienda solo para fines lícitos.",
          "Podemos rechazar o cancelar un pedido si detectamos un error en el precio, falta de inventario, sospecha de fraude o incumplimiento de estos términos. En ese caso te avisaremos por correo y reembolsaremos cualquier cargo realizado.",
        ],
      },
      {
        heading: "3. Productos, precios e inventario",
        paragraphs: [
          "Los precios se muestran en dólares estadounidenses (USD) e incluyen los impuestos que apliquen según la dirección de envío, que se calculan antes de confirmar el pago. Podemos cambiar precios y productos en cualquier momento; el precio válido es el que ves al confirmar tu pedido.",
          "Varios productos RYVOX se fabrican en impresión 3D y en acrílico. Pueden presentar pequeñas variaciones de textura, tono o acabado propias del proceso, que no se consideran defectos. Las imágenes y los modelos 3D de la web son representaciones del producto y pueden diferir ligeramente de la pieza real.",
          "Si un producto se agota después de tu compra, te avisaremos y podrás esperar la reposición o recibir el reembolso completo.",
        ],
      },
      {
        heading: "4. Pedidos y pago",
        paragraphs: [
          "El pedido queda confirmado cuando recibes el correo de confirmación con su número. Los pagos se procesan de forma segura a través de Stripe con tarjeta de crédito o débito, Apple Pay y Google Pay. Ryvox no almacena los datos de tu tarjeta.",
          "Si el pago no se completa o es rechazado, el pedido no se procesa. Puedes cancelar un pedido sin costo mientras no haya sido enviado escribiendo a info@ryvoxshop.com con tu número de pedido.",
        ],
      },
      {
        heading: "5. Envíos",
        paragraphs: [
          "Por ahora enviamos únicamente dentro de Estados Unidos. Preparamos los pedidos en 1 a 3 días hábiles y la entrega estimada es de 3 a 5 días hábiles con la opción estándar; también ofrecemos envío exprés. Las opciones y costos exactos se calculan con tu dirección en el checkout.",
          "El envío estándar es gratis en pedidos a partir de $49. Cuando el pedido sale de nuestro taller recibes por correo el número de guía para seguirlo. Los plazos de los transportistas son estimados y pueden variar por clima, temporada alta o causas ajenas a nosotros.",
          "Es tu responsabilidad indicar una dirección completa y correcta. Si un paquete se devuelve por dirección incorrecta o por no reclamarlo, el costo de reenvío corre por tu cuenta.",
        ],
        bullets: ["Procesamiento: 1 a 3 días hábiles.", "Entrega estándar estimada: 3 a 5 días hábiles.", "Envío estándar gratis desde $49."],
      },
      {
        heading: "6. Devoluciones y reembolsos",
        paragraphs: [
          "Tienes 30 días desde la entrega para cambios y devoluciones, según las condiciones de nuestra Política de reembolsos y devoluciones, que forma parte de estos términos.",
        ],
      },
      {
        heading: "7. Garantía",
        paragraphs: [
          "Todos los productos RYVOX tienen una garantía de 12 meses contra defectos de fabricación a partir de la fecha de entrega. La garantía no cubre desgaste normal, golpes, caídas, exposición a calor extremo o químicos agresivos, modificaciones ni uso distinto al previsto. Para hacerla efectiva escríbenos con tu número de pedido y fotos del problema; repararemos, sustituiremos o reembolsaremos el producto según el caso.",
        ],
      },
      {
        heading: "8. Uso seguro de los productos",
        paragraphs: [
          "Nuestros productos son herramientas profesionales de barbería. Úsalos siguiendo las instrucciones y el sentido común. Los productos relacionados con hojas de afeitar, como el dispensador de cuchillas, deben manipularse con cuidado y mantenerse fuera del alcance de niños. Ryvox no se hace responsable de daños causados por un uso indebido.",
        ],
      },
      {
        heading: "9. Propiedad intelectual",
        paragraphs: [
          "La marca RYVOX, el lema \"Build to evolve\", los diseños de los productos, los modelos 3D, las fotografías y los textos de esta web son propiedad de Ryvox. No pueden copiarse, reproducirse ni usarse con fines comerciales sin nuestra autorización por escrito.",
        ],
      },
      {
        heading: "10. Limitación de responsabilidad",
        paragraphs: [
          "En la medida que permita la ley, la responsabilidad de Ryvox por cualquier reclamación relacionada con un pedido se limita al importe pagado por ese pedido. No respondemos por daños indirectos, pérdida de ingresos ni perjuicios derivados de retrasos de transportistas o de causas fuera de nuestro control.",
        ],
      },
      {
        heading: "11. Ley aplicable",
        paragraphs: [
          "Estos términos se rigen por las leyes del Estado de Nueva York, Estados Unidos. Cualquier disputa se intentará resolver primero de forma amistosa a través de info@ryvoxshop.com.",
        ],
      },
      {
        heading: "12. Cambios en estos términos",
        paragraphs: [
          "Podemos actualizar estos términos cuando sea necesario. La versión publicada en esta página, con su fecha de actualización, es la que aplica a cada compra en el momento de realizarla.",
        ],
      },
    ],
  },
  reembolsos: {
    slug: "reembolsos",
    title: "Política de reembolsos y devoluciones",
    eyebrow: "Legal",
    description: "Cómo devolver o cambiar un producto RYVOX: 30 días desde la entrega, condiciones, plazos de reembolso y garantía de 12 meses.",
    updated: "Última actualización: 10 de septiembre de 2026",
    intro:
      "Queremos que uses tus herramientas RYVOX con confianza. Si algo no te convence, tienes 30 días desde la entrega para cambiarlo o devolverlo. Aquí te explicamos cómo funciona, sin letra pequeña.",
    sections: [
      {
        heading: "1. Plazo",
        paragraphs: ["Puedes solicitar un cambio o una devolución dentro de los 30 días siguientes a la fecha de entrega que indica el seguimiento del transportista."],
      },
      {
        heading: "2. Condiciones para devolver un producto",
        paragraphs: ["Para aceptar la devolución, el producto debe cumplir estas condiciones:"],
        bullets: [
          "Estar sin usar y en el mismo estado en que lo recibiste.",
          "Conservar su embalaje original y todos los accesorios incluidos.",
          "Por higiene, no aceptamos devoluciones de productos que hayan estado en contacto con la piel o el cabello, como plantillas usadas, salvo que tengan un defecto de fabricación.",
          "Los productos personalizados o fabricados a medida no admiten devolución, salvo defecto.",
        ],
      },
      {
        heading: "3. Cómo iniciar una devolución o cambio",
        paragraphs: [
          "Escríbenos a info@ryvoxshop.com con tu número de pedido, el producto que quieres devolver y el motivo. Si el producto llegó dañado o no es el que pediste, adjunta fotos. Te responderemos en un máximo de 2 días hábiles con las instrucciones y la dirección de envío. No envíes nada antes de recibir nuestra confirmación.",
        ],
      },
      {
        heading: "4. Costos del envío de devolución",
        paragraphs: [
          "Si la devolución es por un defecto o un error nuestro, te enviamos la etiqueta de devolución sin costo y reembolsamos el envío original. Si devuelves el producto por otro motivo, el envío de vuelta corre por tu cuenta y el costo del envío original no se reembolsa. Te recomendamos usar un servicio con seguimiento: no podemos responsabilizarnos de paquetes que no lleguen a nuestro taller.",
        ],
      },
      {
        heading: "5. Reembolsos",
        paragraphs: [
          "Cuando recibimos el producto lo revisamos en un plazo de 3 días hábiles. Si cumple las condiciones, emitimos el reembolso al mismo método de pago que usaste (tarjeta, Apple Pay o Google Pay). El dinero suele reflejarse en 5 a 10 días hábiles según tu banco. Te avisaremos por correo cuando lo emitamos.",
          "Si el producto llega usado, dañado por un uso indebido o sin su embalaje, podemos rechazar la devolución o aplicar un reembolso parcial; en ese caso te lo comunicaremos antes de decidir.",
        ],
      },
      {
        heading: "6. Cambios",
        paragraphs: [
          "Puedes cambiar un producto por el mismo modelo en otro color, o por otro producto de igual o mayor valor pagando la diferencia. El cambio se envía cuando recibimos el artículo original. Si prefieres, te emitimos un crédito de tienda para usar cuando quieras.",
        ],
      },
      {
        heading: "7. Productos dañados, defectuosos o incorrectos",
        paragraphs: [
          "Revisa tu pedido al recibirlo. Si llegó dañado, con un defecto o no es lo que pediste, avísanos en un plazo de 48 horas con fotos del producto y del paquete. Lo reemplazamos sin costo o te reembolsamos el importe completo, incluido el envío. Los daños de transporte se reclaman al transportista por nuestra parte; tú no tienes que hacer nada más.",
        ],
      },
      {
        heading: "8. Cancelaciones",
        paragraphs: [
          "Puedes cancelar un pedido sin costo mientras no haya sido enviado; el reembolso es completo e inmediato. Si el pedido ya salió, espera a recibirlo y sigue el proceso de devolución normal.",
        ],
      },
      {
        heading: "9. Garantía de 12 meses",
        paragraphs: [
          "Independientemente del plazo de devolución, todos los productos RYVOX tienen 12 meses de garantía contra defectos de fabricación desde la entrega. Si un producto falla por un defecto en ese periodo, lo reparamos, lo sustituimos o te devolvemos el dinero. La garantía no cubre desgaste normal, golpes, caídas ni uso indebido.",
        ],
      },
      {
        heading: "10. Contacto",
        paragraphs: ["Para cualquier duda sobre devoluciones, cambios o reembolsos: info@ryvoxshop.com. Atendemos de lunes a viernes y respondemos en un máximo de 2 días hábiles."],
      },
    ],
  },
  privacidad: {
    slug: "privacidad",
    title: "Política de privacidad",
    eyebrow: "Legal",
    description: "Qué datos recoge ryvoxshop.com, para qué se usan, con quién se comparten (Stripe, Shippo, Google, Cloudflare) y cómo ejercer tus derechos.",
    updated: "Última actualización: 10 de septiembre de 2026",
    intro:
      "En Ryvox solo pedimos los datos que hacen falta para enviarte tu pedido y atenderte. No vendemos tu información ni la usamos para publicidad de terceros. Aquí te explicamos qué recogemos, por qué y con quién lo compartimos.",
    sections: [
      {
        heading: "1. Responsable",
        paragraphs: ["Ryvox, 55 E Sunrise Hwy, Lindenhurst, NY 11757, Estados Unidos. Para cualquier asunto de privacidad escribe a info@ryvoxshop.com."],
      },
      {
        heading: "2. Qué datos recogemos",
        paragraphs: ["Recogemos únicamente lo necesario para procesar tu compra:"],
        bullets: [
          "Datos de contacto y envío: nombre, apellido, correo electrónico, teléfono y dirección postal.",
          "Datos del pedido: productos, importes, número de pedido, estado del envío y número de guía.",
          "Datos de pago: los gestiona Stripe directamente. Ryvox nunca ve ni guarda el número completo de tu tarjeta.",
          "Datos técnicos: dirección IP, idioma del navegador y tipo de dispositivo, usados para mostrar la web en tu idioma y protegerla de abusos.",
        ],
      },
      {
        heading: "3. Para qué los usamos",
        paragraphs: ["Usamos tus datos para:"],
        bullets: [
          "Procesar el pago, preparar y enviar tu pedido y gestionar devoluciones y garantías.",
          "Enviarte correos sobre tu pedido: confirmación, envío con número de guía y entrega.",
          "Responder a tus consultas en info@ryvoxshop.com.",
          "Cumplir obligaciones fiscales y contables.",
          "Prevenir fraudes y mantener la seguridad de la tienda.",
        ],
      },
      {
        heading: "4. Con quién compartimos tus datos",
        paragraphs: ["Solo compartimos datos con los proveedores imprescindibles para operar la tienda, y solo los que cada uno necesita:"],
        bullets: [
          "Stripe (pagos): procesa el pago con tarjeta, Apple Pay o Google Pay y aplica sus propios controles antifraude.",
          "Shippo y los transportistas (USPS, UPS, FedEx u otros): reciben tu nombre, dirección y teléfono para generar la etiqueta y entregar el paquete.",
          "Google (autocompletado de dirección): cuando escribes tu dirección en el checkout, el texto se envía a Google Places para sugerirte la dirección completa.",
          "Resend (correo electrónico): envía los correos de confirmación y seguimiento de tu pedido.",
          "Cloudflare (alojamiento y base de datos): la web y los datos de pedidos se alojan en la infraestructura de Cloudflare en Estados Unidos.",
        ],
      },
      {
        heading: "5. Cookies y almacenamiento en tu dispositivo",
        paragraphs: ["La tienda no usa cookies de publicidad ni de seguimiento de terceros. Solo utiliza lo estrictamente necesario:"],
        bullets: [
          "Una cookie que recuerda el idioma que elegiste.",
          "El carrito se guarda en el almacenamiento local de tu navegador, no en nuestros servidores, hasta que completas la compra.",
          "Stripe puede usar cookies propias durante el pago para prevenir fraudes.",
          "El panel de administración usa una cookie de sesión que solo afecta a nuestro personal.",
        ],
      },
      {
        heading: "6. Cuánto tiempo conservamos los datos",
        paragraphs: [
          "Conservamos los datos de los pedidos el tiempo necesario para gestionar devoluciones, garantías y obligaciones fiscales (normalmente hasta 7 años por exigencia contable). Los datos de contacto de consultas que no terminan en pedido se eliminan en un plazo razonable tras resolverlas.",
        ],
      },
      {
        heading: "7. Tus derechos",
        paragraphs: [
          "Puedes pedirnos en cualquier momento acceder a tus datos, corregirlos, eliminarlos o recibir una copia. Escribe a info@ryvoxshop.com desde el correo con el que hiciste el pedido y responderemos en un máximo de 10 días hábiles. Ten en cuenta que no podemos eliminar datos que la ley nos obligue a conservar, como facturas.",
          "Si resides en California, tienes además los derechos que reconoce la CCPA, incluido el de saber qué información recogemos y el de no ser discriminado por ejercerlos. No vendemos información personal.",
        ],
      },
      {
        heading: "8. Seguridad",
        paragraphs: [
          "Toda la web funciona bajo HTTPS. Los pagos se cifran y procesan en Stripe, las contraseñas del panel se guardan cifradas y el acceso a los datos de pedidos está restringido a nuestro personal.",
        ],
      },
      {
        heading: "9. Menores",
        paragraphs: ["La tienda está dirigida a adultos. No recogemos a sabiendas datos de menores de 18 años; si crees que un menor nos ha facilitado datos, escríbenos y los eliminaremos."],
      },
      {
        heading: "10. Cambios en esta política",
        paragraphs: ["Podemos actualizar esta política cuando cambien nuestros servicios o la ley. La versión vigente es siempre la publicada en esta página con su fecha de actualización."],
      },
    ],
  },
};

const en: Record<LegalDocument["slug"], LegalDocument> = {
  terminos: {
    slug: "terminos",
    title: "Terms and Conditions",
    eyebrow: "Legal",
    description: "Purchase terms for ryvoxshop.com: pricing, payments, shipping, warranty and safe use of RYVOX products.",
    updated: "Last updated: September 10, 2026",
    intro:
      "These terms govern your use of ryvoxshop.com and any purchase you make in the store. By browsing or placing an order you accept them. Read them carefully; if anything is unclear, write to us before buying.",
    sections: [
      {
        heading: "1. Who we are",
        paragraphs: [
          "RYVOX is a brand of tools and accessories for barbers based at 55 E Sunrise Hwy, Lindenhurst, NY 11757, United States. You can reach us at info@ryvoxshop.com. In these terms, \"Ryvox\", \"we\" or \"the store\" refer to this company.",
        ],
      },
      {
        heading: "2. Using the store",
        paragraphs: [
          "To place an order you must be 18 or older, or have the permission of a responsible adult. You agree to provide accurate contact and shipping details and to use the store only for lawful purposes.",
          "We may refuse or cancel an order if we detect a pricing error, lack of inventory, suspected fraud or a breach of these terms. In that case we will notify you by email and refund any charge made.",
        ],
      },
      {
        heading: "3. Products, prices and inventory",
        paragraphs: [
          "Prices are shown in US dollars (USD). Applicable sales tax is calculated from your shipping address before you confirm payment. We may change prices and products at any time; the valid price is the one shown when you confirm your order.",
          "Several RYVOX products are 3D printed or made of acrylic. They may show small variations in texture, shade or finish inherent to the process, which are not considered defects. Images and 3D models on the site are representations and may differ slightly from the actual piece.",
          "If a product sells out after your purchase, we will let you know and you can wait for restock or receive a full refund.",
        ],
      },
      {
        heading: "4. Orders and payment",
        paragraphs: [
          "Your order is confirmed when you receive the confirmation email with its number. Payments are processed securely through Stripe by credit or debit card, Apple Pay and Google Pay. Ryvox never stores your card details.",
          "If a payment fails or is declined, the order is not processed. You can cancel an order free of charge as long as it has not shipped by emailing info@ryvoxshop.com with your order number.",
        ],
      },
      {
        heading: "5. Shipping",
        paragraphs: [
          "For now we ship within the United States only. Orders are prepared in 1 to 3 business days and standard delivery is estimated at 3 to 5 business days; express shipping is also available. Exact options and costs are calculated from your address at checkout.",
          "Standard shipping is free on orders of $49 or more. When your order leaves our workshop you receive the tracking number by email. Carrier delivery times are estimates and may vary due to weather, peak season or causes beyond our control.",
          "You are responsible for providing a complete and correct address. If a package is returned because of an incorrect address or because it was not claimed, the reshipping cost is on you.",
        ],
        bullets: ["Processing: 1 to 3 business days.", "Estimated standard delivery: 3 to 5 business days.", "Free standard shipping from $49."],
      },
      {
        heading: "6. Returns and refunds",
        paragraphs: ["You have 30 days from delivery for exchanges and returns under our Refund and Return Policy, which is part of these terms."],
      },
      {
        heading: "7. Warranty",
        paragraphs: [
          "All RYVOX products carry a 12-month warranty against manufacturing defects from the delivery date. The warranty does not cover normal wear, impacts, drops, exposure to extreme heat or harsh chemicals, modifications, or use other than intended. To make a claim, email us with your order number and photos of the issue; we will repair, replace or refund the product as appropriate.",
        ],
      },
      {
        heading: "8. Safe use of the products",
        paragraphs: [
          "Our products are professional barber tools. Use them following the instructions and common sense. Products related to razor blades, such as the blade dispenser, must be handled with care and kept out of reach of children. Ryvox is not liable for damage caused by improper use.",
        ],
      },
      {
        heading: "9. Intellectual property",
        paragraphs: [
          "The RYVOX brand, the tagline \"Build to evolve\", product designs, 3D models, photographs and texts on this site are the property of Ryvox. They may not be copied, reproduced or used commercially without our written permission.",
        ],
      },
      {
        heading: "10. Limitation of liability",
        paragraphs: [
          "To the extent permitted by law, Ryvox's liability for any claim related to an order is limited to the amount paid for that order. We are not responsible for indirect damages, loss of income, or losses caused by carrier delays or events beyond our control.",
        ],
      },
      {
        heading: "11. Governing law",
        paragraphs: ["These terms are governed by the laws of the State of New York, United States. Any dispute will first be addressed amicably through info@ryvoxshop.com."],
      },
      {
        heading: "12. Changes to these terms",
        paragraphs: ["We may update these terms when necessary. The version published on this page, with its update date, is the one that applies to each purchase at the time it is made."],
      },
    ],
  },
  reembolsos: {
    slug: "reembolsos",
    title: "Refund and Return Policy",
    eyebrow: "Legal",
    description: "How to return or exchange a RYVOX product: 30 days from delivery, conditions, refund timelines and 12-month warranty.",
    updated: "Last updated: September 10, 2026",
    intro:
      "We want you to use your RYVOX tools with confidence. If something isn't right, you have 30 days from delivery to exchange or return it. Here is how it works, no fine print.",
    sections: [
      { heading: "1. Time frame", paragraphs: ["You can request an exchange or return within 30 days of the delivery date shown in the carrier's tracking."] },
      {
        heading: "2. Return conditions",
        paragraphs: ["To accept a return, the product must meet these conditions:"],
        bullets: [
          "Unused and in the same condition you received it.",
          "In its original packaging with all included accessories.",
          "For hygiene reasons we cannot accept returns of products that have been in contact with skin or hair, such as used templates, unless they have a manufacturing defect.",
          "Custom or made-to-order products cannot be returned unless defective.",
        ],
      },
      {
        heading: "3. How to start a return or exchange",
        paragraphs: [
          "Email info@ryvoxshop.com with your order number, the product you want to return and the reason. If the product arrived damaged or is not what you ordered, attach photos. We reply within 2 business days with instructions and the shipping address. Please do not ship anything before receiving our confirmation.",
        ],
      },
      {
        heading: "4. Return shipping costs",
        paragraphs: [
          "If the return is due to a defect or an error on our side, we send you a prepaid return label and refund the original shipping. If you return the product for any other reason, return shipping is on you and the original shipping cost is not refunded. We recommend a tracked service: we cannot take responsibility for packages that do not reach our workshop.",
        ],
      },
      {
        heading: "5. Refunds",
        paragraphs: [
          "Once we receive the product we inspect it within 3 business days. If it meets the conditions, we issue the refund to the same payment method you used (card, Apple Pay or Google Pay). Funds usually appear within 5 to 10 business days depending on your bank. We will email you when the refund is issued.",
          "If the product arrives used, damaged by misuse or without its packaging, we may reject the return or apply a partial refund; we will let you know before deciding.",
        ],
      },
      {
        heading: "6. Exchanges",
        paragraphs: [
          "You can exchange a product for the same model in another color, or for another product of equal or higher value by paying the difference. The exchange ships once we receive the original item. If you prefer, we can issue store credit to use whenever you like.",
        ],
      },
      {
        heading: "7. Damaged, defective or incorrect products",
        paragraphs: [
          "Check your order when it arrives. If it came damaged, defective or is not what you ordered, let us know within 48 hours with photos of the product and the package. We replace it at no cost or refund the full amount including shipping. We handle carrier damage claims ourselves; you don't need to do anything else.",
        ],
      },
      {
        heading: "8. Cancellations",
        paragraphs: ["You can cancel an order free of charge as long as it has not shipped; the refund is full and immediate. If the order has already shipped, wait to receive it and follow the normal return process."],
      },
      {
        heading: "9. 12-month warranty",
        paragraphs: [
          "Regardless of the return window, all RYVOX products carry a 12-month warranty against manufacturing defects from delivery. If a product fails due to a defect within that period, we repair it, replace it or refund your money. The warranty does not cover normal wear, impacts, drops or misuse.",
        ],
      },
      { heading: "10. Contact", paragraphs: ["For any question about returns, exchanges or refunds: info@ryvoxshop.com. We are available Monday to Friday and reply within 2 business days."] },
    ],
  },
  privacidad: {
    slug: "privacidad",
    title: "Privacy Policy",
    eyebrow: "Legal",
    description: "What data ryvoxshop.com collects, why, who it is shared with (Stripe, Shippo, Google, Cloudflare) and how to exercise your rights.",
    updated: "Last updated: September 10, 2026",
    intro:
      "At Ryvox we only ask for the data needed to ship your order and help you. We do not sell your information or use it for third-party advertising. Here is what we collect, why, and who we share it with.",
    sections: [
      { heading: "1. Data controller", paragraphs: ["Ryvox, 55 E Sunrise Hwy, Lindenhurst, NY 11757, United States. For any privacy matter write to info@ryvoxshop.com."] },
      {
        heading: "2. What we collect",
        paragraphs: ["We collect only what is needed to process your purchase:"],
        bullets: [
          "Contact and shipping details: first and last name, email, phone number and postal address.",
          "Order details: products, amounts, order number, shipping status and tracking number.",
          "Payment details: handled directly by Stripe. Ryvox never sees or stores your full card number.",
          "Technical data: IP address, browser language and device type, used to show the site in your language and protect it from abuse.",
        ],
      },
      {
        heading: "3. How we use it",
        paragraphs: ["We use your data to:"],
        bullets: [
          "Process payment, prepare and ship your order, and handle returns and warranty claims.",
          "Send you emails about your order: confirmation, shipment with tracking number and delivery.",
          "Answer your questions at info@ryvoxshop.com.",
          "Meet tax and accounting obligations.",
          "Prevent fraud and keep the store secure.",
        ],
      },
      {
        heading: "4. Who we share it with",
        paragraphs: ["We only share data with the providers essential to run the store, and only what each one needs:"],
        bullets: [
          "Stripe (payments): processes card, Apple Pay and Google Pay payments and applies its own fraud controls.",
          "Shippo and carriers (USPS, UPS, FedEx or others): receive your name, address and phone number to create the label and deliver the package.",
          "Google (address autocomplete): when you type your address at checkout, the text is sent to Google Places to suggest the full address.",
          "Resend (email): sends your order confirmation and tracking emails.",
          "Cloudflare (hosting and database): the site and order data are hosted on Cloudflare infrastructure in the United States.",
        ],
      },
      {
        heading: "5. Cookies and storage on your device",
        paragraphs: ["The store uses no advertising or third-party tracking cookies. Only what is strictly necessary:"],
        bullets: [
          "A cookie that remembers the language you chose.",
          "Your cart is stored in your browser's local storage, not on our servers, until you complete the purchase.",
          "Stripe may use its own cookies during payment to prevent fraud.",
          "The admin panel uses a session cookie that only affects our staff.",
        ],
      },
      {
        heading: "6. How long we keep data",
        paragraphs: [
          "We keep order data as long as needed to handle returns, warranties and tax obligations (usually up to 7 years for accounting requirements). Contact details from inquiries that do not become orders are deleted within a reasonable time after they are resolved.",
        ],
      },
      {
        heading: "7. Your rights",
        paragraphs: [
          "You can ask us at any time to access, correct or delete your data, or to receive a copy. Email info@ryvoxshop.com from the address you used for your order and we will reply within 10 business days. Note that we cannot delete data the law requires us to keep, such as invoices.",
          "If you live in California, you also have the rights granted by the CCPA, including the right to know what information we collect and not to be discriminated against for exercising them. We do not sell personal information.",
        ],
      },
      {
        heading: "8. Security",
        paragraphs: ["The whole site runs over HTTPS. Payments are encrypted and processed by Stripe, admin passwords are stored hashed, and access to order data is restricted to our staff."],
      },
      { heading: "9. Minors", paragraphs: ["The store is intended for adults. We do not knowingly collect data from anyone under 18; if you believe a minor has given us data, write to us and we will delete it."] },
      { heading: "10. Changes to this policy", paragraphs: ["We may update this policy when our services or the law change. The current version is always the one published on this page with its update date."] },
    ],
  },
};

export function getLegal(lang: Locale, slug: LegalDocument["slug"]): LegalDocument {
  return (lang === "es" ? es : en)[slug];
}
