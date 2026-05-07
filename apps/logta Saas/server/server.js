const express = require("express");
const { google } = require("googleapis");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// OAuth2 Client Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/auth/callback"
);

// Rota de Teste Health Check
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "Logta SaaS Google API Bridge" });
});

// Criar evento no Google Calendar com Meet
app.post("/criar-evento", async (req, res) => {
  try {
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    const event = {
      summary: req.body.titulo,
      description: req.body.descricao,
      start: {
        dateTime: req.body.inicio,
        timeZone: "America/Sao_Paulo",
      },
      end: {
        dateTime: req.body.fim,
        timeZone: "America/Sao_Paulo",
      },
      conferenceData: {
        createRequest: {
          requestId: "meet-" + Date.now(),
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      conferenceDataVersion: 1,
    });

    res.json({
      sucesso: true,
      linkMeet: response.data.hangoutLink,
      evento: response.data,
    });
  } catch (error) {
    console.error("Erro no Calendar:", error);
    res.status(500).json({ erro: error.message });
  }
});

// Criar documento no Google Docs (Atendimento)
app.post("/criar-doc", async (req, res) => {
  try {
    const docs = google.docs({ version: "v1", auth: oauth2Client });

    const doc = await docs.documents.create({
      requestBody: {
        title: req.body.titulo || "Atendimento Cliente (Gerado via Logta)",
      },
    });

    res.json({
      sucesso: true,
      documentId: doc.data.documentId,
      link: `https://docs.google.com/document/d/${doc.data.documentId}/edit`
    });
  } catch (error) {
    console.error("Erro no Docs:", error);
    res.status(500).json({ erro: error.message });
  }
});

app.listen(3000, () => {
  console.log("🚀 Servidor Google API Bridge rodando em http://localhost:3000");
});
