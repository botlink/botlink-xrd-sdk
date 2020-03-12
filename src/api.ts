import template from "url-template";
import fetch from "node-fetch";
import * as urls from "./urls";
import { XRD, XRDPresence } from "./xrd";
import jwt from "jsonwebtoken";

let xrdsPathTemplate = template.parse("/users/{id}/botboxes");
let xrdsPresenceTemplate = template.parse("/xrds/{id}/presence");

const loginPath = "/sessions/auth";
const refreshPath = "/sessions/refresh";

const xrdsPresencePath = (userId: number) => {
  return xrdsPresenceTemplate.expand({ id: userId });
};

const xrdsPath = (userId: number) => {
  return xrdsPathTemplate.expand({ id: userId });
};

export interface Credentials {
  token: string;
  refresh: string;
  user: {
    id: number;
  };
}

export const auth = async (
  email: string,
  password: string
): Promise<Credentials> => {
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

export const refresh = async (token: string): Promise<Credentials> => {
  const response = await fetch(urls.API + refreshPath, {
    method: "GET",
    headers: [
      ["Authorization", "application/json"],
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

export class Api {
  credentials: Credentials;
  constructor(credentials: Credentials) {
    this.credentials = credentials;
  }
}

export class XRDApi extends Api {
  async list(): Promise<Array<XRD>> {
    const response = await fetch(
      urls.API + xrdsPath(this.credentials.user.id),
      {
        headers: [["Authorization", this.credentials.token]]
      }
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const body = await response.json();

    return <Array<XRD>>body.map((xrd: any) => {
      return {
        id: xrd.id,
        hardwareId: xrd.hardwareId,
        name: xrd.name || xrd.emei
      };
    });
  }

  async presence(): Promise<Array<XRDPresence>> {
    const response = await fetch(
      urls.INFO + xrdsPresencePath(this.credentials.user.id),
      {
        headers: [["Authorization", this.credentials.token]]
      }
    );

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const body = await response.json();

    return body as Array<XRDPresence>;
  }

  async health(): Promise<boolean> {
    try {
      const response = await fetch(urls.C3 + "/health");

      return response.ok;
    } catch (error) {
      return false;
    }
  }
}
