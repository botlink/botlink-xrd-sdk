import "isomorphic-fetch";
import * as urls from "./urls";
import jwt from "jsonwebtoken";

const loginPath = "/sessions/auth";
const refreshPath = "/sessions/refresh";

export interface Credentials {
  token: string;
  refresh: string;
  user: {
    id: number;
  };
}

export const auth = async (email: string, password: string): Promise<Credentials> => {
  const response = await fetch(urls.API + loginPath, {
    method: "POST",
    body: JSON.stringify({
      email,
      password
    }),
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    }
  });

  if (!response.ok) {
    if (response.status >= 400 && response.status < 500) {
      throw new Error("Invalid username or password");
    } else {
      throw new Error(response.statusText);
    }
  }

  const credentials = await response.json();

  const { auth, refresh } = credentials;

  const decoded = jwt.decode(auth) as any;

  return { token: auth, refresh, user: { id: +decoded.id } };
};

export const refresh = async (refreshToken: string): Promise<Credentials> => {
  const response = await fetch(urls.API + refreshPath, {
    method: "POST",
    headers: [
      ["Authorization", refreshToken],
      ["Accept", "application/json"]
    ]
  });

  if (!response.ok) {
    throw new Error(response.statusText);
  }

  const credentials = await response.json();

  const { auth, refresh } = credentials;

  const decoded = jwt.decode(auth) as any;

  return { token: auth, refresh, user: { id: +decoded.id } };
};

export class AuthManager {
  private scheduledRefresh?: NodeJS.Timeout

  constructor() { }

  async scheduleRefresh(accessToken: string, refreshToken: string, credentialsCallback: Function) {
    if (this.scheduledRefresh) return

    const decoded = jwt.decode(accessToken) as any;

    if (!decoded.exp) { throw new Error('Token does not have a expiration(exp) defined.') }
    if (!decoded.iat) { throw new Error('Token does not have a issued at(iat) defined.') }

    const dateDifference = decoded.exp - decoded.iat;
    const halfLife = new Date((decoded.iat + (dateDifference / 2)) * 1000);
    const runJobInXMilliseconds = halfLife.getTime() - (new Date().getTime())

    this.scheduledRefresh = setTimeout(async () => {
      this.scheduledRefresh = undefined

      try {
        const newCredentials = await refresh(refreshToken)
        this.scheduleRefresh(newCredentials.token, newCredentials.refresh, credentialsCallback)
        credentialsCallback(newCredentials)
      } catch (error) {
        this.scheduledRefresh = setTimeout(async () => {
          this.scheduledRefresh = undefined
          this.scheduleRefresh(accessToken, refreshToken, credentialsCallback)
        }, 5000)
      }
    }, runJobInXMilliseconds)
  }
}