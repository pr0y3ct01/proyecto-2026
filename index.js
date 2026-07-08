require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");

const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const PORT = process.env.PORT || 8080;

const SYSTEM_PROMPT = `
Eres Marisol Toledano, una asistente humana, cálida, servicial y amable que responde dudas por WhatsApp sobre un PLR de lectoescritura.

Tu trabajo es responder dudas de forma NATURAL, BREVE y HUMANA, como si fueras una persona real atendiendo con cariño a mamás, papás o maestras interesadas en apoyar a los niños con lectura y escritura.

IMPORTANTE:
- Nunca suenes robótica.
- Nunca respondas exactamente igual cada vez.
- Varía ligeramente las palabras y estructura.
- Mantén respuestas cálidas, claras y naturales.
- No escribas demasiado.
- Responde máximo en 1 o 2 párrafos cortos.

REGLAS:
- NO saludes.
- NO uses "Hola".
- NO hagas múltiples preguntas.
- NO hagas preguntas abiertas innecesarias.
- NO digas:
  - "¿Quieres saber más?"
  - "¿Te interesa?"
  - "¿Te gustaría?"
  - "¿Te ayudo en algo más?"
  - "¿Quieres que te cuente?"
- NO seas agresiva vendiendo.
- NO presiones.
- NO inventes información.
- NO seas grosera.
- NO digas que el material es físico.
- NO menciones correo electrónico.
- NO digas que se entrega antes del pago.
- NO digas que se envía automáticamente sin comprobante.
- NO confundas el producto con un servicio.

INFORMACIÓN REAL:
- El producto es un PLR de lectoescritura.
- Es un producto digital.
- La entrega es mediante un enlace de Google Drive.
- Todo el material viene en formato PDF.
- El material NO es físico.
- El cliente puede descargarlo e imprimirlo.
- El precio es de 59 pesos.
- Es venta directa, no donación.
- Se acepta transferencia bancaria o depósito en efectivo en Oxxo.
- La entrega se realiza cuando el cliente envía el comprobante de pago junto con la palabra "listo".
- El material sirve para apoyar a niños de kínder y primaria.
- El material contiene el Libro Mágico y también Juguemos a Leer.
- No inventes cantidad exacta de hojas si no está confirmada.

OBJETIVO:
Después de resolver la duda de forma amable y humana, dirige suavemente a la persona a realizar su compra mediante:
- transferencia bancaria
- depósito en efectivo en Oxxo

Haz que el cierre se sienta natural, amable y claro, nunca como presión de venta.
`;

function normalizarTexto(texto) {
  return String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function elegirAleatoria(opciones) {
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function limpiarRespuesta(texto) {
  texto = String(texto || "").trim();

  texto = texto
    .replace(/^¡?\s*hola\s*[����❤️✨��,\.\!]*\s*/gi, "")
    .replace(/^gracias por preguntar\s*[����❤️✨��,\.\!]*\s*/gi, "")
    .replace(/^buenos días\s*[����❤️✨��,\.\!]*\s*/gi, "")
    .replace(/^buenos dias\s*[����❤️✨��,\.\!]*\s*/gi, "")
    .replace(/^buenas tardes\s*[����❤️✨��,\.\!]*\s*/gi, "")
    .replace(/^buenas noches\s*[����❤️✨��,\.\!]*\s*/gi, "");

  texto = texto
    .replace(/¿[^?]*(quieres|te interesa|te gustaría|te gustaria|te cuento|te explico|te ayudo|puedo ayudarte|hay algo más|hay algo mas|te parece|te comparto|te paso)[^?]*\?/gi, "")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return texto;
}

function cierrePago() {
  const cierres = [
    `El material tiene un costo de $59 pesos. Puedes pagar por transferencia o depósito en Oxxo.

En cuanto envíes tu comprobante junto con la palabra "listo", te comparto el enlace de Google Drive para descargarlo.`,

    `El costo es de $59 pesos y la entrega es digital por enlace de Google Drive.

Puedes realizar tu pago por transferencia o depósito en Oxxo. Al enviarme el comprobante con la palabra "listo", te mando el acceso al material.`,

    `Para adquirirlo, el precio es de $59 pesos. Aceptamos transferencia y depósito en efectivo en Oxxo.

Cuando mandes tu comprobante junto con la palabra "listo", te envío el enlace de descarga por Google Drive.`,
  ];

  return elegirAleatoria(cierres);
}

function agregarCierre(texto) {
  const limpio = limpiarRespuesta(texto);

  if (!limpio) {
    return cierrePago();
  }

  return `${limpio}

${cierrePago()}`;
}

function respuestaDirecta(textoNormalizado) {
  if (
    textoNormalizado.includes("cuanto") ||
    textoNormalizado.includes("cuesta") ||
    textoNormalizado.includes("precio") ||
    textoNormalizado.includes("costo") ||
    textoNormalizado.includes("vale") ||
    textoNormalizado.includes("pagar") ||
    textoNormalizado.includes("pago")
  ) {
    const respuestasPrecio = [
      `El PLR de lectoescritura tiene un costo de $59 pesos. Es un material digital en PDF, listo para descargar, imprimir y trabajar con los niños.`,

      `El precio del material completo es de $59 pesos. La entrega se realiza de forma digital por enlace de Google Drive, después de enviar el comprobante de pago.`,

      `Tiene un costo total de $59 pesos. Todo se entrega en PDF mediante un enlace de Google Drive para que puedas descargarlo e imprimirlo.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasPrecio));
  }

  if (
    textoNormalizado.includes("fisico") ||
    textoNormalizado.includes("impreso") ||
    textoNormalizado.includes("envio") ||
    textoNormalizado.includes("enviar") ||
    textoNormalizado.includes("entrega") ||
    textoNormalizado.includes("recibir") ||
    textoNormalizado.includes("recibo") ||
    textoNormalizado.includes("digital") ||
    textoNormalizado.includes("pdf") ||
    textoNormalizado.includes("drive") ||
    textoNormalizado.includes("descargar") ||
    textoNormalizado.includes("archivo") ||
    textoNormalizado.includes("llega")
  ) {
    const respuestasEntrega = [
      `El material no es físico, es completamente digital. Se entrega en formato PDF mediante un enlace de Google Drive para que puedas descargarlo e imprimirlo.`,

      `La entrega es digital por Google Drive. Todo viene en PDF, así que puedes guardarlo en tu celular o computadora e imprimir las hojas que necesites.`,

      `No se envía material impreso. Es un producto digital en PDF y se comparte por medio de un enlace de Google Drive después de confirmar el pago.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasEntrega));
  }

  if (
    textoNormalizado.includes("kinder") ||
    textoNormalizado.includes("preescolar") ||
    textoNormalizado.includes("primaria") ||
    textoNormalizado.includes("niños") ||
    textoNormalizado.includes("ninos") ||
    textoNormalizado.includes("edad") ||
    textoNormalizado.includes("grado") ||
    textoNormalizado.includes("sirve")
  ) {
    const respuestasEdades = [
      `Sí, el material sirve para apoyar a niños de kínder y primaria en el proceso de lectura y escritura.`,

      `Sí, está pensado para reforzar lectoescritura en niños de kínder y primaria, ya sea en casa o como apoyo escolar.`,

      `Claro, puede utilizarse con niños de kínder y primaria que están iniciando o reforzando lectura y escritura.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasEdades));
  }

  if (
    textoNormalizado.includes("hojas") ||
    textoNormalizado.includes("paginas") ||
    textoNormalizado.includes("páginas") ||
    textoNormalizado.includes("cuantas") ||
    textoNormalizado.includes("cantidad") ||
    textoNormalizado.includes("incluye") ||
    textoNormalizado.includes("contiene") ||
    textoNormalizado.includes("trae")
  ) {
    const respuestasContenido = [
      `Incluye material de lectoescritura en PDF, listo para imprimir y trabajar. Como el paquete trae varios archivos, la cantidad de hojas puede variar según lo que decidas imprimir.`,

      `El paquete contiene varios materiales en PDF para lectura y escritura. Puedes imprimir solo las actividades que necesites o todo el material completo.`,

      `Vienen varios archivos digitales en PDF enfocados en lectoescritura. La cantidad de hojas puede depender de los materiales que elijas imprimir.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasContenido));
  }

  if (
    textoNormalizado.includes("libro magico") ||
    textoNormalizado.includes("libro mágico") ||
    textoNormalizado.includes("juguemos a leer") ||
    textoNormalizado.includes("magico") ||
    textoNormalizado.includes("mágico")
  ) {
    const respuestasLibros = [
      `Sí, el material contiene ambos libros: Libro Mágico y Juguemos a Leer.`,

      `Sí los incluye. El paquete contiene tanto el Libro Mágico como Juguemos a Leer, además de material de apoyo para lectoescritura.`,

      `Claro, contiene ambos: Libro Mágico y Juguemos a Leer, junto con otros recursos digitales para apoyar lectura y escritura.`,
    ];

    return agregarCierre(elegirAleatoria(respuestasLibros));
  }

  if (
    textoNormalizado.includes("oxxo") ||
    textoNormalizado.includes("deposito") ||
    textoNormalizado.includes("depósito") ||
    textoNormalizado.includes("transferencia") ||
    textoNormalizado.includes("banco") ||
    textoNormalizado.includes("tarjeta")
  ) {
    const respuestasMetodoPago = [
      `Puedes realizar tu pago por transferencia bancaria o depósito en efectivo en Oxxo.`,

      `Aceptamos transferencia y también depósito en Oxxo. Después de enviar el comprobante con la palabra "listo", se entrega el enlace del material.`,

      `El pago puede hacerse por transferencia o depósito en efectivo en Oxxo. La entrega se realiza cuando envías el comprobante junto con la palabra "listo".`,
    ];

    return agregarCierre(elegirAleatoria(respuestasMetodoPago));
  }

  return null;
}

app.get("/", (req, res) => {
  res.send("Bot ventas activo ✅");
});

app.post("/mensaje", async (req, res) => {
  try {
    const texto = req.body.texto || req.body.mensaje || req.body.message || "";

    console.log("Texto recibido:", texto);

    if (!texto) {
      return res.json({ respuesta: cierrePago() });
    }

    const textoNormalizado = normalizarTexto(texto);
    const directa = respuestaDirecta(textoNormalizado);

    if (directa) {
      console.log("Respuesta directa:", directa);
      return res.json({ respuesta: directa });
    }

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.4,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: texto },
      ],
    });

    const respuestaIA = response.output_text || "";
    const respuestaFinal = agregarCierre(respuestaIA);

    console.log("Respuesta enviada:", respuestaFinal);

    return res.json({ respuesta: respuestaFinal });
  } catch (error) {
    console.error("Error en /mensaje:", error);
    return res.json({ respuesta: cierrePago() });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
