import template from "url-template";
import "isomorphic-fetch";
import * as urls from "./urls";
import { XRD, XRDPresence } from "./xrd";

import { AuthManager, Credentials } from './auth'

let xrdsPathTemplate = template.parse('/users/{id}/botboxes')
let xrdPathTemplate = template.parse('/botboxes/{id}')
let xrdRegisterPathTemplate = template.parse(`/registerbotbox/{userId}`)
let xrdConfigPathTemplate = template.parse(`/xrd/{xrdId}/config`)
let xrdsPresenceTemplate = template.parse("/xrds/{id}/presence");

export class Api {
  private authManager: AuthManager;
  protected credentials: Credentials;

  constructor(credentials: Credentials) {
    this.credentials = credentials;
    this.authManager = new AuthManager();

    if (this.credentials.token && this.credentials.refresh) {
      this.authManager.scheduleRefresh(this.credentials.token, this.credentials.refresh, (newCredentials: Credentials) => {
        this.credentials = newCredentials
      })
    }
  }
}

export class XRDApi extends Api {
  async list(): Promise<Array<XRD>> {
    const requestUrl = urls.API + xrdsPathTemplate.expand({ id: this.credentials.user.id })
    const response = await fetch(requestUrl, {
      headers: [["Authorization", this.credentials.token]]
    });

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

  async updateXRD(xrdId: string, updateData: any) {
    const requestUrl = urls.API + xrdPathTemplate.expand({ id: xrdId })
    const response = await fetch(requestUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.credentials.token
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const updateResponse = await response.json();

    return updateResponse;
  }

  async registerXRD(hardwareId: string) {
    const requestUrl = urls.API + xrdRegisterPathTemplate.expand({ id: this.credentials.user.id })
    const response = await fetch(requestUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.credentials.token
      },
      body: JSON.stringify({
        hardwareId: (hardwareId || '').replace(/-/g, '') // remove dashes, matches rails backend expectations
      })
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const responseData = await response.json();

    return responseData;
  }

  async getXRDConfig(hardwareId: string) {
    const xrdId = (hardwareId || '').replace(/-/g, '')

    const requestUrl = urls.API + xrdConfigPathTemplate.expand({ xrdId })
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.credentials.token
      }
    });

    if (!response.ok) {
      throw new Error(response.statusText);
    }

    const xrdConfig = await response.json();

    return xrdConfig;
  }

  async presence(): Promise<Array<XRDPresence>> {
    const response = await fetch(
      urls.INFO + xrdsPresenceTemplate.expand({ id: this.credentials.user.id }),
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
