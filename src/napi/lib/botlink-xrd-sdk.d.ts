declare module 'botlink-xrd-sdk/src/napi/lib/binding.js' {
  enum XrdConnectionStatus {
    Connected = 'Connected',
    Connecting = 'Connecting',
    Disconnected = 'Disconnected'
  }

  type Xrd = {
    id: string
    name: string
  }

  class Api {
    login(usernameOrToken: string, passwordOrTimeoutSeconds?: string | number, timeoutSeconds?: number): Promise<boolean>
    refresh(timeoutSeconds?: number): Promise<boolean>

    listXrds(timeoutSeconds?: number): Promise<Array<Xrd>>
    getRefreshToken(timeoutSeconds?: number): Promise<string>
    getAuthToken(timeoutSeconds?: number): Promise<string>
  }

  class BinaryLogger { }

  class XrdConnection {
    constructor(api: Api, xrdId: string, binaryLogger?: BinaryLogger)

    openConnection(connectionTimeoutInSeconds: number): Promise<boolean>
    closeConnection(): boolean
    isConnected(): boolean

    // TODO(cgrahn): Change string to VideoConfig object when C++ is updated
    on(event: string, callback: (data: Buffer | XrdConnectionStatus | string) => void): void

    sendAutopilotMessage(data: Buffer): boolean

    // This configures the connection to have a video track. This must
    // be called before openConnection if video is desired.
    addVideoTrack(): boolean
    // This is the UDP port used to forward RTP stream from WebRTC media track
    setVideoPortInternal(port: number): boolean
    // TODO(cgrahn): Update to add codec parameter when C++ is updated
    setVideoConfig(width: number, height: number, framerate: number): boolean
  }
}
