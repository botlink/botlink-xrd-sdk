import io from "socket.io-client";
import MessageCoder from "./message-coder";
import { XRD } from "./xrd";
import * as urls from "./urls";
import { Duplex } from "stream";

import { AuthManager, Credentials } from './auth'

export interface XRDSocketOptions {
  xrd: XRD;
  credentials: Credentials;
  skipRefresh: boolean;
}

export class XRDSocket extends Duplex {
  private authManager: AuthManager;

  private socket?: SocketIOClient.Socket;
  private coder: MessageCoder = new MessageCoder();
  // TODO: Limit internal storage usage
  private credentials: Credentials;
  readonly xrd: XRD;
  bytesRead: number = 0;
  bytesWritten: number = 0;

  pending: boolean = true;
  connecting: boolean = false;

  remoteAddress?: string;
  private readyForBytes: boolean = true;

  constructor(options: XRDSocketOptions) {
    super({
      writableObjectMode: true
    });

    this.xrd = options.xrd;
    this.credentials = options.credentials;
    this.authManager = new AuthManager()

    if (!options.skipRefresh) {
      this.authManager.scheduleRefresh(this.credentials.token, this.credentials.refresh, (newCredentials: Credentials) => {
        this.credentials = newCredentials
      })
    }
  }

  async connect(callback?: Function) {
    this.connecting = true;

    this.socket = io.connect(urls.C3 + "/flight", {
      query: { auth: this.credentials.token, botBox: this.xrd.id }
    });

    this.socket.on("disconnect", () => {
      this.connecting = true;
      this.emit("disconnect");
    });

    this.socket.once("connect", () => {
      if (callback) {
        callback();
      }
    });

    this.socket.on("connect", () => {
      this.connecting = false;
      this.remoteAddress = urls.C3;

      this.emit("connect");
      this.emit("ready");

      if (this.socket) {
        this.socket.emit("subscribeToBotBox2", this.xrd.id);
      }
    });

    this.socket.on("error", (error: any) => {
      let wrappedError: Error;

      if (typeof error === "string") {
        wrappedError = new Error(error);
      } else if (error instanceof Error) {
        wrappedError = error;
      } else {
        wrappedError = new Error("Unknown error");
      }

      this.emit("error", wrappedError);

      this.close();
    });

    this.socket.on("onReceiveAutopilotMessage", (data: any) => {
      let messages = this.coder.decode(new Buffer(data, "base64"));

      if (messages) {
        messages.forEach(message => {
          if (this.readyForBytes) {
            this.readyForBytes = this.push(message);
          }
        });
      }
    });
  }

  _read(size: number) {
    this.readyForBytes = true;
  }

  _write(
    chunk: string | Buffer | Uint8Array,
    encoding: string,
    callback: Function
  ) {
    if (!this.socket) {
      return callback(new Error("No connection to XRD"));
    }

    if (this.connecting) {
      this.socket.once("connect", () => {
        this._write(chunk, encoding, callback);
      });

      return;
    }

    let encodedData = this.coder.encode([{ chunk, encoding }]);
    this.writeToSocketIO(encodedData);

    callback();
  }

  _writev(items: Array<{ chunk: any; encoding: string }>, callback: Function) {
    if (!this.socket) {
      return callback(new Error("No connection to XRD"));
    }

    if (this.connecting) {
      this.socket.once("connect", () => {
        this._writev(items, callback);
      });

      return;
    }

    let encodedData = this.coder.encode(items);
    this.writeToSocketIO(encodedData);

    callback();
  }

  _destroy(error: Error | null, callback: (error: Error | null) => void) {
    this.unsubscribe();
    callback(error);
  }

  _final(callback: (error?: Error | null | undefined) => void) {
    this.unsubscribe();
    callback();
  }

  private writeToSocketIO(bytes64: string) {
    this.bytesWritten += bytes64.length;

    if (this.socket) {
      this.socket.emit("sendAutopilotMessageToBotBox", this.xrd.id, bytes64);
    }
  }

  private unsubscribe() {
    if (this.socket) {
      this.socket.emit("unsubscribeFromBotBox2", this.xrd.id);

      this.socket.disconnect();
      this.socket = undefined;
      this.connecting = false;
      this.remoteAddress = undefined;
    }
  }

  close() {
    this.unsubscribe();
    this.emit("close");
  }
}
