declare module 'botlink-xrd-sdk/src/napi/lib/binding.js' {
  enum XrdConnectionStatus {
    Connected = 'Connected',
    Connecting = 'Connecting',
    Disconnected = 'Disconnected'
  }

  class Api {
    login(refreshToken:string)
    getAuthToken(): Promise<string>
  }

  class BinaryLogger {}

  class XrdConnection {
    constructor(api: Api, xrdId:string, enableMavlinkLogging: boolean, binaryLogger: BinaryLogger)

    openConnection(connectionTimeoutInSeconds: number): Promise<void>
    closeConnection()
    isConnected():boolean

    on(event:string, callback: (data:string|XrdConnectionStatus) => void)

    sendAutopilotMessage(data:string)
  }

}
