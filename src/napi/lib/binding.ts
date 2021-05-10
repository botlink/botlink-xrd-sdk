const CxxClient = require('bindings')('botlink-cxx-client-bindings')
import { EventEmitter } from 'events'
import { inherits } from 'util'

export enum XrdConnectionStatus {
  Connected = 'Connected',
  Connecting = 'Connecting',
  Disconnected = 'Disconnected'
}

export type Xrd = {
  id: number,
  hardwareId: string,
  name: string
}

export enum XrdVideoCodec {
  Unknown = 'Unknown',
  H264 = 'H264',
  H265 = 'H265'
}

export interface XrdVideoConfig {
  width: number,
  height: number,
  framerate: number,
  codec: XrdVideoCodec
}

export interface ApiLoginUsername {
  username: string,
  password: string
}

// Can be auth or refresh token
export interface ApiLoginToken {
  token: string
}

export interface ApiBindings {
  new(): ApiBindings

  refresh (timeoutSeconds?: number): Promise<boolean>
  login(auth: ApiLoginUsername | ApiLoginToken, timeoutSeconds?: number): Promise<boolean>

  listXrds (timeoutSeconds?: number): Promise<Array<Xrd>>
  getRefreshToken (timeoutSeconds?: number): Promise<string>
  getAuthToken (timeoutSeconds?: number): Promise<string>
}

export enum XrdConnectionEvents {
  Data = 'data',
  ConnectionStatus = 'connectionStatus',
  VideoConfig = 'videoConfig'
}

export interface XrdConnectionBindings {
  new(api: ApiBindings, xrd: Xrd, binaryLogger?: XrdLoggerBindings): XrdConnectionBindings

  openConnection (connectionTimeoutInSeconds: number): Promise<boolean>
  closeConnection (): boolean
  isConnected (): boolean

  on(event: XrdConnectionEvents.Data, callback: (data: Buffer) => void): void
  on(event: XrdConnectionEvents.ConnectionStatus, callback: (data: XrdConnectionStatus) => void): void
  on(event: XrdConnectionEvents.VideoConfig, callback: (data: XrdVideoConfig) => void): void

  sendAutopilotMessage (data: Buffer): boolean

  // This configures the connection to have a video track. This must
  // be called before openConnection if video is desired.
  addVideoTrack (): boolean
  // This is the UDP port used to forward RTP stream from WebRTC media
  // track. The address defaults to localhost.
  setVideoForwardPort(port: number, address?: string): boolean

  setVideoConfig(config: XrdVideoConfig): boolean
}

// See MessageSource enum in api.h from C++ SDK
export enum XrdLoggerSource {
  NotDefined = 0,
  FromGcs = 7,
  ToGcs = 8
}

export interface XrdLoggerBindings {
  new(path: string): XrdLoggerBindings

  logMessage (source: number, message: Buffer): void
}

inherits(CxxClient.XrdConnection, EventEmitter)

let BotlinkApi: ApiBindings = CxxClient.BotlinkApi
let XrdConnection: XrdConnectionBindings = CxxClient.XrdConnection
let XrdLogger: XrdLoggerBindings = CxxClient.XrdLogger

export { BotlinkApi, XrdConnection, XrdLogger }
