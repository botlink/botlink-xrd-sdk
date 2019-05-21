import template from 'url-template'
import fetch from 'node-fetch'
import * as urls from './urls'
import { XRD } from './xrd'

let xrdsPathTemplate = template.parse('/users/{id}/botboxes')

const loginPath = '/sessions/login'

const xrdsPath = (userId: Number) => {
  return xrdsPathTemplate.expand({ id: userId })
}

export interface Credentials {
    token: string,
    user: {
      id: Number
    }
}

export const auth = (email: string, password: string) => {
  return fetch(urls.API + loginPath, { 
    method: 'POST',
    body: JSON.stringify({
      email,
      password
    }),
    headers: { 'Content-Type': 'application/json' }
  }).then((response) => response.json()).then((body) => {
    const {
      user,
      token
    } = body

    return { user, token }
  })
}

export class Api {
  credentials: Credentials
  constructor(credentials: Credentials) {
      this.credentials = credentials
  }
}

export class XRDApi extends Api {
  list() : Promise<Array<XRD>> {
    return fetch(urls.API + xrdsPath(this.credentials.user.id), {
        headers: [
            ['Authorization', this.credentials.token]
        ]
    }).then((response) => response.json()).then((body) => {
      return <Array<XRD>>body.map((xrd: any) => {
        return { 
          id: xrd.id,
          hardwareId: xrd.hardwareId,
          name: xrd.name || xrd.emei
        }
      })
    })
  }
}