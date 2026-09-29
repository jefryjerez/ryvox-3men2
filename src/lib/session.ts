import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ryvox_session";
// La sesión no se vence sola: solo se cierra si el admin pulsa "Cerrar sesión". 400 días es el tope real
// que Chrome/Safari permiten para una cookie (no existe "para siempre" a nivel de navegador).
const MAX_AGE = 60 * 60 * 24 * 400;

export interface Session {
  sub: string;
  email: string;
  name: string;
}

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("Falta AUTH_SECRET");
  return new TextEncoder().encode(s ?? "dev-secret-cambiar");
}

export async function signSession(session: Session) {
  return new SignJWT({ email: session.email, name: session.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.sub)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<Session | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return { sub: payload.sub, email: String(payload.email ?? ""), name: String(payload.name ?? "") };
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  };
}
