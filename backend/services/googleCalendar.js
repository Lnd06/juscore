import { google } from "googleapis";
import { User } from "../models/index.js";

const getOAuth2Client = () => {
  console.log(
    "🛠️ getOAuth2Client - ID:",
    process.env.GOOGLE_CLIENT_ID ? "OK" : "MISSING",
  );
  console.log("🛠️ getOAuth2Client - URL:", process.env.GOOGLE_REDIRECT_URI);
  if (
    !process.env.GOOGLE_CLIENT_ID ||
    !process.env.GOOGLE_CLIENT_SECRET ||
    !process.env.GOOGLE_REDIRECT_URI
  ) {
    return null;
  }
  return new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  });
};

export const getAuthUrl = () => {
  const client = getOAuth2Client();
  if (!client) {
    console.error("❌ Google OAuth2 credentials are missing in .env");
    return null;
  }

  const scopes = [
    "https://www.googleapis.com/auth/userinfo.profile",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  return client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent",
  });
};

export const getTokens = async (code) => {
  const client = getOAuth2Client();
  if (!client) throw new Error("Google Credentials missing");
  const { tokens } = await client.getToken(code);
  return tokens;
};

export const getUserInfo = async (tokens) => {
  const client = getOAuth2Client();
  if (!client) throw new Error("Google Credentials missing");
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data } = await oauth2.userinfo.get();
  return data;
};

const getAuthenticatedClient = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user || !user.googleTokens) {
    throw new Error("Usuário não conectado ao Google");
  }

  const tokens = JSON.parse(user.googleTokens);
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );
  client.setCredentials(tokens);

  client.on("tokens", async (newTokens) => {
    if (newTokens.refresh_token) {
      // Refresh token is only sent if it changed
      tokens.refresh_token = newTokens.refresh_token;
    }
    tokens.access_token = newTokens.access_token;
    tokens.expiry_date = newTokens.expiry_date;

    await user.update({ googleTokens: JSON.stringify(tokens) });
  });

  return client;
};

export const createGoogleEvent = async (userId, eventData) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: "v3", auth });

    const resource = {
      summary: eventData.titulo,
      description: eventData.observacoes,
      start: {
        dateTime: new Date(eventData.dataHora).toISOString(),
      },
      end: {
        dateTime: new Date(
          new Date(eventData.dataHora).getTime() + 60 * 60 * 1000,
        ).toISOString(), // +1 hour duration
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource,
    });

    return response.data.id;
  } catch (error) {
    console.error("Erro ao criar evento no Google:", error);
    return null;
  }
};

export const updateGoogleEvent = async (userId, googleEventId, eventData) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: "v3", auth });

    const resource = {
      summary: eventData.titulo,
      description: eventData.observacoes,
      start: {
        dateTime: new Date(eventData.dataHora).toISOString(),
      },
      end: {
        dateTime: new Date(
          new Date(eventData.dataHora).getTime() + 60 * 60 * 1000,
        ).toISOString(),
      },
    };

    await calendar.events.update({
      calendarId: "primary",
      eventId: googleEventId,
      resource,
    });
    return true;
  } catch (error) {
    console.error("Erro ao atualizar evento no Google:", error);
    return false;
  }
};

export const deleteGoogleEvent = async (userId, googleEventId) => {
  try {
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: "v3", auth });

    await calendar.events.delete({
      calendarId: "primary",
      eventId: googleEventId,
    });
    return true;
  } catch (error) {
    console.error("Erro ao deletar evento no Google:", error);
    return false;
  }
};
