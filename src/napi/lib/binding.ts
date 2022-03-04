//const CxxClient = require('bindings')('botlink_xrd_sdk_bindings')
var binary = require('@mapbox/node-pre-gyp');
var path = require('path');
// top-level directory starting from dist/src/napi/lib
var binding_path = binary.find(path.resolve(path.join(__dirname, '../../../.././package.json')));
const CxxClient = require(binding_path);
import { EventEmitter } from 'events'
import { inherits } from 'util'

/**
 * Events emitted by BotlinkApi
 *
 * [[`BotlinkApi`]] emits these
 */
export enum BotlinkApiEvents {
  NewTokens = 'NewTokens'
}

/**
 * The status of a connection to an XRD.
 *
 * [[`XrdConnection`]] emits this as part of an
 * [[`XrdConnectionEvents.ConnectionStatus`]] event.
 */
export enum XrdConnectionStatus {
  Connected = 'Connected',
  Connecting = 'Connecting',
  Disconnected = 'Disconnected'
}

/**
 * This interface represents an XRD associated with a user's account.
 */
export interface Xrd {
  /** TODO: The backend has this value but doesn't seem useful. Purpose is unknown. */
  id: number,
  /** The unique identifier for an XRD */
  hardwareId: string,
  /** The user-assigned name for an XRD */
  name: string
}

/**
 * Video resolutions that can be selected for RTP stream
 */
export enum XrdVideoResolution {
  Unsupported = 'Unsupported',
  /** 256x144 */
  Resolution_144 = '144',
  /** 426x240 */
  Resolution_240 = '240',
  /** 640x360 */
  Resolution_360 = '360',
  /** 854x480 */
  Resolution_480 = '480',
  /** 1280x720 */
  Resolution_720 = '720',
  /** 1920x1080 */
  Resolution_1080 = '1080',
  /** 3840x2160 */
  Resolution_4k = '4k'
}
/**
 * Codecs used by the XRD to encode video.
 */
export enum XrdVideoCodec {
  Unknown = 'Unknown',
  H264 = 'H264',
  H265 = 'H265'
}
/**
 * State of the video stream from the XRD
 */
export enum XrdVideoState {
  Unknown = 'Unknown',
  Paused = 'Paused',
  Playing = 'Playing'
}
/**
 * Interface for an object used to configure the RTP stream sent from an XRD.
 */
export interface XrdVideoConfig {
  resolution: XrdVideoResolution
  framerate: number,
  codec: XrdVideoCodec,
  state: XrdVideoState
}

/**
 * Interface for an object used to hold the ping response from an XRD.
 *
 * Note that the timestamps are based off of independent monotonic clocks (one
 * clock on this machine, one on the XRD).
 */
export interface XrdPingResponse {
  /** the sequence number of the ping message and response */
  sequence: number,
  /** time in microseconds when we sent the ping message */
  senderTimestampUs: number,
  /** time in microseconds when the XRD received the ping message */
  receiverTimestampUs: number,
  /** time in microseconds when we sent received the response from the XRD */
  senderReceivedTimestampUs: number,
  /** calculated latency in microseconds */
  latencyUs: number,
  /** calculated jitter of the latency in microseconds */
  jitterUs: number
}

/**
 * Interface for an object used to log in to the Botlink Cloud with a
 * username and password.
 */
export interface ApiLoginUsername {
  username: string,
  password: string
}

/**
 * Interface for an object used to log in to the Botlink Cloud with an
 * auth token or refresh token.
 *
 * It is recommended to use the refresh token instead of an auth token if both
 * are available. The refresh token can be used by [[`BotlinkApi`]] to obtain an
 * auth token and to refresh both tokens before they expire.
 */
export interface ApiLoginToken {
  token: string
}

/**
 * This is the TypeScript interface for the C++ [[`BotlinkApi`]] bindings.
 *
 * The [[`BotlinkApi`]] implementation of this interface may throw an
 * exception for any method in the interface when an error occurs.
 *
 * The default timeout for methods with a `timeoutSeconds` optional parameter is
 * 10 seconds. See `BotlinkApi::defaultTimeout` in C++ SDK's api.h.
 *
 * The [[`BotlinkApi`]] implementation opportunistically refreshes the tokens
 * when any method is called.
 */
export interface ApiBindings {
  new(): ApiBindings
  /**
   * Log in to a Botlink account.
   *
   * @param auth An `ApiLoginUsername` object if authenticating with a username
   *             and password, or an `ApiLoginToken` object if authenticating
   *             with a token
   * @param timeoutSeconds How long to wait to log in before timing out, uses
   *                       default timeout if not specified.
   *
   * @returns `true` if logged in successfully, `false` otherwise
   */
  login(auth: ApiLoginUsername | ApiLoginToken, timeoutSeconds?: number): Promise<boolean>
  /**
   * Register callbacks for [[`BotlinkApiEvents`]].
   */
  on(event: BotlinkApiEvents.NewTokens, callback: (tokens: { auth: string, refresh: string }) => void): void
  /**
   * Refresh the tokens.
   *
   * This method only refreshes the tokens if the auth token has passed its
   * half-life.
   *
   * @param timeoutSeconds How long to wait to get the refreshed tokens before
   *                       timing out, uses default timeout if not specified.
   *
   * @returns `true` if tokens refreshed successfully or no refresh was
   *          required, `false` otherwise
   */
  refresh(timeoutSeconds?: number): Promise<boolean>
  /**
   * Get a list of XRDs associated with the currently logged-in account.
   *
   * @param timeoutSeconds How long to wait to get the list of XRDs before
   *                       timing out, uses default timeout if not specified.
   *
   * @returns An `Array` of `Xrd` objects, the array is empty if no XRDs are
   *          associated with the account.
   */
  listXrds(timeoutSeconds?: number): Promise<Array<Xrd>>
  /**
   * Get the refresh token.
   *
   * Note that the refresh token is not available if [[`login`]] was called with
   * an auth token. In this case, this method throws an exception.
   *
   * This method also throws an exception if the refresh token has expired.
   *
   * @param timeoutSeconds How long to wait to get the refresh token before
   *                       timing out, uses default timeout if not specified.
   *
   * @returns The refresh token
   */
  getRefreshToken(timeoutSeconds?: number): Promise<string>
  /**
   * Get the auth token.
   *
   * This method throws an exception if the auth token is expired and refreshing
   * the auth token failed.
   *
   * @param timeoutSeconds How long to wait to get the auth token before timing
   *                       out, uses default timeout if not specified.
   *
   * @returns The auth token
   */
  getAuthToken(timeoutSeconds?: number): Promise<string>
  /**
   * Register an XRD with the authenticated account.
   *
   * This method throws an exception if registration failed
   *
   * @param xrdId The hardware ID of the XRD to register
   *
   * @param timeoutSeconds How long to wait to register the XRD before timing
   *                       out, uses default timeout if not specified.
   *
   * @returns boolean, true if successful
   */
  registerXrd(xrdId: string, timeoutSeconds?: number): Promise<boolean>
  /**
   * Deregisters an XRD from the authenticated account.
   *
   * This method throws an exception if deregistration failed
   *
   * @param xrd The XRD to deregister
   *
   * @param timeoutSeconds How long to wait to deregister the XRD before timing
   *                       out, uses default timeout if not specified.
   *
   * @returns boolean, true if successful
   */
  deregisterXrd(xrd: Xrd, timeoutSeconds?: number): Promise<boolean>
}

/**
 * Events that [[`XrdConnection`]] emits.
 *
 * See [[`XrdConnectionBindings.on`]] for registering callbacks.
 */
export enum XrdConnectionEvents {
  /** Event when the connection received an autopilot message from the XRD. */
  AutopilotMessage = 'autopilotMessage',
  /** Event when the status of the connection to the XRD changes. */
  ConnectionStatus = 'connectionStatus',
  /** Event when the connection received a video configuration message from the XRD. */
  VideoConfig = 'videoConfig',
  /** Event when the connection received a ping response message from the XRD. */
  PingResponse = 'pingResponse',
}

/**
 * This is the TypeScript interface for the C++ [[`XrdConnection`]] bindings.
 *
 * The [[`XrdConnection`]] implementation of this interface may throw an
 * exception for any method in the interface when an error occurs.
 */
export interface XrdConnectionBindings {
  /**
   *
   * @param api The object used to interact with the Botlink Cloud servers
   * @param xrd The XRD to which to connect
   * @param binaryLogger An object used to log autopilot messages sent to and
   *                     from the XRD
   */
  new(api: ApiBindings, xrd: Xrd, binaryLogger?: XrdLoggerBindings): XrdConnectionBindings
  /**
   * Open a connection to an XRD.
   *
   * This should not be called if the connection is already open. In other words
   * it should only be called on a new object or after calling
   * [[`closeConnection`]].
   *
   * @returns `true` if connected to XRD, `false` otherwise
   */
  openConnection(connectionTimeoutInSeconds: number): Promise<boolean>
  /**
   * Close a connection to an XRD.
   *
   * This can be called multiple times.
   *
   * In the case of failing to close the connection, it's best to use a new
   * [[`XrdConnection`]] object when reopening the connection.
   *
   * @returns `true` if connection closed successfully, `false` otherwise
   */
  closeConnection(): boolean
  /**
   * Query if state of the connection to an XRD
   *
   * @returns An [[`XrdConnectionStatus`]] value
   */
  getConnectionStatus(): XrdConnectionStatus
  /**
   * Register callbacks for [[`XrdConnectionEvents`]].
   */
  on(event: XrdConnectionEvents.AutopilotMessage, callback: (message: Buffer) => void): void
  on(event: XrdConnectionEvents.ConnectionStatus, callback: (status: XrdConnectionStatus) => void): void
  on(event: XrdConnectionEvents.VideoConfig, callback: (config: XrdVideoConfig) => void): void
  on(event: XrdConnectionEvents.PingResponse, callback: (response: XrdPingResponse) => void): void
  /**
   * Send an autopilot message to the XRD.
   *
   * @param data A `Buffer` object containing the autopilot message
   *
   * @returns `true` if message sent successfully, `false` otherwise
   */
  sendAutopilotMessage(data: Buffer): boolean
  /**
   * Add a video track to the XRD connection.
   *
   * This must be called before [[`openConnection`]] if video is desired.
   */
  addVideoTrack(): boolean
  /**
   * Set the UDP port, and optionally the address, to which to forward the RTP
   * stream from the XRD's video track.
   *
   * @param port The UDP port to use
   * @param address The address to use, defaults to `localhost`
   */
  setVideoForwardPort(port: number, address?: string): boolean
  /**
   * Send an `XrdVideoConfig` to the currently connected XRD.
   *
   * After calling this method, the caller should wait for an
   * [[`XrdConnectionEvents.VideoConfig`]] event to know if the XRD accepted the
   * video config.
   *
   * @param config The video config to use
   *
   * @returns `true` if video config successfully sent, `false` otherwise
   */
  setVideoConfig(config: XrdVideoConfig): boolean
  /**
   * Send a ping message to the currently connected XRD.
   *
   * After calling this method sucessfully, the caller gets an
   * [[`XrdConnectionEvents.PingResponse`]] event when the response from the
   * XRD is received.
   *
   * @returns `number` the sequence number of the ping message if sent successfully, `null` otherwise
   */
  pingXrd(): number | null
  /**
   * Pause the video stream from the XRD connection.
   */
  pauseVideo(): boolean
  /**
   * Resume the video stream from the XRD connection.
   */
  resumeVideo(): boolean
  /**
   * Send a request to the XRD to save its logs
   *
   * @param callback The function to call when a response to the request is
   *                 received from the XRD
   *
   * @returns `true` if the request successfully sent, `false`  otherwise
   */
  saveLogs(callback: (success: boolean) => void): boolean
}

/**
 * Enum used to tag the source of an autopilot message when logging an autopilot
 * message.
 *
 * This enum is meant for use with [[`XrdLogger`]]. The values for tagging an
 * autopilot message sent to or received from an XRD are not listed here as that
 * is handled internally by [[`XrdConnection`]].
 */
export enum XrdLoggerSource {
  /** Autopilot message is from an unknown source. */
  Unknown = 0,
  /** Autopilot message received from the Ground Control Software */
  FromGcs = 7,
  /** Autopilot message sent to the Ground Control Software */
  ToGcs = 8
}

/**
 * This is the TypeScript interface for the C++ [[`XrdLogger`]] bindings.
 */
export interface XrdLoggerBindings {
  /**
   * @param path The path to the file in which to save logs.
   */
  new(path: string): XrdLoggerBindings
  /**
   * Log an autopilot message.
   *
   * @param source The source of the autopilot message
   * @param message The autopilot message
   */
  logMessage(source: XrdLoggerSource, message: Buffer): void
}

inherits(CxxClient.BotlinkApi, EventEmitter)
inherits(CxxClient.XrdConnection, EventEmitter)

/** C++ implementation of [[`ApiBindings`]] */
let BotlinkApi: ApiBindings = CxxClient.BotlinkApi
/** C++ implementation of [[`XrdConnectionBindings`]] */
let XrdConnection: XrdConnectionBindings = CxxClient.XrdConnection
/** C++ implementation of [[`XrdLoggerBindings`]] */
let XrdLogger: XrdLoggerBindings = CxxClient.XrdLogger

export { BotlinkApi, XrdConnection, XrdLogger }
