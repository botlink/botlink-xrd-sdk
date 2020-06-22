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
    headers: [
      ["Content-Type", "application/json"],
      ["Accept", "application/json"]
    ]
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

export const checkRefresh = async (accessToken: string, refreshToken: string): Promise<Credentials | void> => {
  const decoded = jwt.decode(accessToken) as any;

  if (!decoded.exp) { throw new Error('Token does not have a expiration(exp) defined.') }
  if (!decoded.iat) { throw new Error('Token does not have a issued at(iat) defined.') }

  const dateDifference = decoded.exp - decoded.iat;
  const halfDate = new Date(decoded.iat + (dateDifference / 2));
  const tokenPastHalfLife = new Date() >= halfDate

  if (!tokenPastHalfLife) { return }

  const newCredentials = await refresh(refreshToken)
  return newCredentials
}

export class AuthManager {
  private scheduledRefresh?: NodeJS.Timeout

  constructor() { }

  async scheduleRefresh(accessToken: string, refreshToken: string, credentialsCallback: Function) {
    if (this.scheduledRefresh) return

    const decoded = jwt.decode(accessToken) as any;

    if (!decoded.exp) { throw new Error('Token does not have a expiration(exp) defined.') }
    if (!decoded.iat) { throw new Error('Token does not have a issued at(iat) defined.') }

    const dateDifference = decoded.exp - decoded.iat;
    const oneThridDate = new Date((decoded.iat + (dateDifference / 3)) * 1000);
    const runJobInXMilliseconds = oneThridDate.getTime() - (new Date().getTime())

    this.scheduledRefresh = setTimeout(async () => {
      const newCredentials = await this.checkRefresh(accessToken, refreshToken)

      if (newCredentials) {
        this.scheduleRefresh(newCredentials.token, newCredentials.refresh, credentialsCallback)
        credentialsCallback(newCredentials)
      } else {
        this.scheduleRefresh(accessToken, refreshToken, credentialsCallback)
      }

    }, runJobInXMilliseconds)
  }

  async checkRefresh(accessToken: string, refreshToken: string): Promise<Credentials | void> {
    return checkRefresh(accessToken, refreshToken)
  }
}