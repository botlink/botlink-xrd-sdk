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

export const auth = async (email: string, password: string) : Promise<Credentials> => {
  const response = await fetch(urls.API + loginPath, { 
    method: 'POST',
    body: JSON.stringify({
      email,
      password
    }),
    headers: { 'Content-Type': 'application/json' }
  })

  if(!response.ok) {
    if(response.status >= 400 && response.status < 500) {
      throw new Error('Invalid username or password')
    } else {
      throw new Error(response.statusText)
    }
    
  }

  const credentials = await response.json()

  const { user, token } = credentials

  return { user, token }
}

export class Api {
  credentials: Credentials
  constructor(credentials: Credentials) {
      this.credentials = credentials
  }
}

export class XRDApi extends Api {
  async list() : Promise<Array<XRD>> {
    const response = await fetch(urls.API + xrdsPath(this.credentials.user.id), {
      headers: [
          ['Authorization', this.credentials.token]
      ]
    })

    if(!response.ok) {
      throw new Error(response.statusText)
    }

    const body = await response.json()

    return <Array<XRD>>body.map((xrd: any) => {
      return { 
        id: xrd.id,
        hardwareId: xrd.hardwareId,
        name: xrd.name || xrd.emei
      }
    })
  }
}