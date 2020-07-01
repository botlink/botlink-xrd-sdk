const { Transform } = require('stream')

// TODO: Switch to a Mavlink library once a stable one for js comes out
const MavlinkMessagesEnum = {
  PING: 4,
  CHANGE_OPERATOR_CONTROL: 5,
  SET_MODE: 11,
  PARAM_REQUEST_READ: 20,
  PARAM_REQUEST_LIST: 21,
  PARAM_SET: 23,
  MISSION_REQUEST_PARTIAL_LIST: 37,
  MISSION_WRITE_PARTIAL_LIST: 38,
  MISSION_ITEM: 39,
  MISSION_REQUEST: 40,
  MISSION_SET_CURRENT: 41,
  MISSION_REQUEST_LIST: 43,
  MISSION_COUNT: 44,
  MISSION_CLEAR_ALL: 45,
  MISSION_ACK: 47,
  SET_GPS_GLOBAL_ORIGIN: 48,
  PARAM_MAP_RC: 50,
  MISSION_REQUEST_INT: 51,
  SAFETY_SET_ALLOWED_AREA: 54,
  REQUEST_DATA_STREAM: 66,
  RC_CHANNELS_OVERRIDE: 70,
  MISSION_ITEM_INT: 73,
  COMMAND_INT: 75,
  COMMAND_LONG: 76,
  COMMAND_ACK: 77,
  COMMAND_CANCEL: 80,
  SET_ATTITUDE_TARGET: 82,
  SET_POSITION_TARGET_LOCAL_NED: 84,
  SET_POSITION_TARGET_GLOBAL_INT: 86,
  FILE_TRANSFER_PROTOCOL: 110,
  LOG_REQUEST_LIST: 117,
  LOG_REQUEST_DATA: 119,
  LOG_ERASE: 121,
  LOG_REQUEST_END: 122,
  GPS_INJECT_DATA: 123,
  SET_ACTUATOR_CONTROL_TARGET: 139,
  SET_HOME_POSITION: 243,
  V2_EXTENSION: 248,
  SETUP_SIGNING: 256,
  PLAY_TUNE: 258,
  LOGGING_DATA: 266,
  LOGGING_DATA_ACKED: 267,
  LOGGING_ACK: 268,
  GIMBAL_MANAGER_SET_ATTITUDE: 282,
  GIMBAL_DEVICE_SET_ATTITUDE: 284,
  GIMBAL_DEVICE_ATTITUDE_STATUS: 285,
  AUTOPILOT_STATE_FOR_GIMBAL_DEVICE: 286,
  PARAM_EXT_REQUEST_READ: 320,
  PARAM_EXT_REQUEST_LIST: 321,
  PARAM_EXT_SET: 323,
  TUNNEL: 385,
  PLAY_TUNE_V2: 400,
  SUPPORTED_TUNES: 401,
  OPEN_DRONE_ID_BASIC_ID: 12900,
  OPEN_DRONE_ID_LOCATION: 12901,
  OPEN_DRONE_ID_AUTHENTICATION: 12902,
  OPEN_DRONE_ID_SELF_ID: 12903,
  OPEN_DRONE_ID_SYSTEM: 12904,
  OPEN_DRONE_ID_OPERATOR_ID: 12905,
  OPEN_DRONE_ID_MESSAGE_PACK: 12915,
}

class MavlinkMessageTransform extends Transform {
  constructor(systemId, tcpToXrd, options) {
    super(options)

    this.systemId = systemId
    this.tcpToXrd = tcpToXrd
  }

  _transform(chunk, encoding, callback) {
    if (encoding !== 'buffer') {
      const nonBufferFound = `Non buffer found in MavlinkMessageTransform transform. SystemId: ${this.systemId}`
      console.log(nonBufferFound)
      return callback(new Error(nonBufferFound))
    }

    const isMavlink1 = (chunk[0] === 0xFE)
    const isMavlink2 = (chunk[0] === 0xFD)

    if (!(isMavlink1 || isMavlink2)) {
      const notMavlinkMessage = `Received buffer is not a valid mavlink message. SystemId: ${this.systemId}`
      console.log(notMavlinkMessage)
      return callback(new Error(notMavlinkMessage))
    }

    if (this.tcpToXrd) {
      const messageId = isMavlink1 ? chunk[5] : ((chunk[9] << 16) + (chunk[8] << 8) + (chunk[7] << 0))
      const messagePayloadStartIndex = isMavlink1 ? 6 : 10

      const targetSystemIndex = this.getTargetSystemIndexBasedOnMessageType(messagePayloadStartIndex, messageId)

      console.log(`tcpToXrd`)
      console.log(`isMavlink1: ${isMavlink1} isMavlink2: ${isMavlink2} messageId ${messageId} target ${chunk[targetSystemIndex]} targetSystemIndex: ${targetSystemIndex}`)

      if (targetSystemIndex === undefined) { return callback(null, chunk) }
      if (chunk[targetSystemIndex] !== this.systemId) { return callback() }

      // chunk[targetSystemIndex] = 1
      return callback(null, chunk)
    } else {
      const systemByteIndex = isMavlink1 ? 3 : 5
      if (chunk[systemByteIndex] != this.systemId) {
        console.log(`xrdToTcp expected systemId ${this.systemId} but received ${chunk[systemByteIndex]}`)
      }

      console.log(`xrdToTcp ${[...chunk]}`)
      console.log(`isMavlink1: ${isMavlink1} isMavlink2: ${isMavlink2}`)

      // chunk[systemByteIndex] = this.systemId
      return callback(null, chunk)
    }
  }

  getTargetSystemIndexBasedOnMessageType(messagePayloadStartIndex, messageId) {
    let payloadTargetSystemIndex

    // Based on the message type, the targetSystem has a different byte position
    switch (messageId) {
      case MavlinkMessagesEnum.CHANGE_OPERATOR_CONTROL:
      case MavlinkMessagesEnum.SET_MODE:
      case MavlinkMessagesEnum.PARAM_REQUEST_READ:
      case MavlinkMessagesEnum.PARAM_REQUEST_LIST:
      case MavlinkMessagesEnum.PARAM_SET:
      case MavlinkMessagesEnum.MISSION_REQUEST_PARTIAL_LIST:
      case MavlinkMessagesEnum.MISSION_WRITE_PARTIAL_LIST:
      case MavlinkMessagesEnum.MISSION_ITEM:
      case MavlinkMessagesEnum.MISSION_REQUEST:
      case MavlinkMessagesEnum.MISSION_SET_CURRENT:
      case MavlinkMessagesEnum.MISSION_REQUEST_LIST:
      case MavlinkMessagesEnum.MISSION_COUNT:
      case MavlinkMessagesEnum.MISSION_CLEAR_ALL:
      case MavlinkMessagesEnum.MISSION_ACK:
      case MavlinkMessagesEnum.SET_GPS_GLOBAL_ORIGIN:
      case MavlinkMessagesEnum.PARAM_MAP_RC:
      case MavlinkMessagesEnum.MISSION_REQUEST_INT:
      case MavlinkMessagesEnum.SAFETY_SET_ALLOWED_AREA:
      case MavlinkMessagesEnum.REQUEST_DATA_STREAM:
      case MavlinkMessagesEnum.RC_CHANNELS_OVERRIDE:
      case MavlinkMessagesEnum.MISSION_ITEM_INT:
      case MavlinkMessagesEnum.COMMAND_INT:
      case MavlinkMessagesEnum.COMMAND_LONG:
      case MavlinkMessagesEnum.COMMAND_CANCEL:
      case MavlinkMessagesEnum.FILE_TRANSFER_PROTOCOL:
      case MavlinkMessagesEnum.LOG_REQUEST_LIST:
      case MavlinkMessagesEnum.LOG_REQUEST_DATA:
      case MavlinkMessagesEnum.LOG_ERASE:
      case MavlinkMessagesEnum.LOG_REQUEST_END:
      case MavlinkMessagesEnum.GPS_INJECT_DATA:
      case MavlinkMessagesEnum.SET_HOME_POSITION:
      case MavlinkMessagesEnum.SETUP_SIGNING:
      case MavlinkMessagesEnum.PLAY_TUNE:
      case MavlinkMessagesEnum.LOGGING_DATA:
      case MavlinkMessagesEnum.LOGGING_DATA_ACKED:
      case MavlinkMessagesEnum.LOGGING_ACK:
      case MavlinkMessagesEnum.GIMBAL_MANAGER_SET_ATTITUDE:
      case MavlinkMessagesEnum.GIMBAL_DEVICE_SET_ATTITUDE:
      case MavlinkMessagesEnum.GIMBAL_DEVICE_ATTITUDE_STATUS:
      case MavlinkMessagesEnum.PARAM_EXT_REQUEST_READ:
      case MavlinkMessagesEnum.PARAM_EXT_REQUEST_LIST:
      case MavlinkMessagesEnum.PARAM_EXT_SET:
      case MavlinkMessagesEnum.TUNNEL:
      case MavlinkMessagesEnum.PLAY_TUNE_V2:
      case MavlinkMessagesEnum.SUPPORTED_TUNES:
      case MavlinkMessagesEnum.OPEN_DRONE_ID_BASIC_ID:
      case MavlinkMessagesEnum.OPEN_DRONE_ID_LOCATION:
      case MavlinkMessagesEnum.OPEN_DRONE_ID_AUTHENTICATION:
      case MavlinkMessagesEnum.OPEN_DRONE_ID_SELF_ID:
      case MavlinkMessagesEnum.OPEN_DRONE_ID_SYSTEM:
      case MavlinkMessagesEnum.OPEN_DRONE_ID_OPERATOR_ID:
      case MavlinkMessagesEnum.OPEN_DRONE_ID_MESSAGE_PACK:
        payloadTargetSystemIndex = 0
        break;
      case MavlinkMessagesEnum.FILE_TRANSFER_PROTOCOL:
        payloadTargetSystemIndex = 1
        break;
      case MavlinkMessagesEnum.V2_EXTENSION:
        payloadTargetSystemIndex = 2
        break;
      case MavlinkMessagesEnum.SET_ATTITUDE_TARGET:
      case MavlinkMessagesEnum.SET_POSITION_TARGET_LOCAL_NED:
      case MavlinkMessagesEnum.SET_POSITION_TARGET_GLOBAL_INT:
        payloadTargetSystemIndex = 4
        break;
      case MavlinkMessagesEnum.COMMAND_ACK:
      case MavlinkMessagesEnum.AUTOPILOT_STATE_FOR_GIMBAL_DEVICE:
        payloadTargetSystemIndex = 8
      case MavlinkMessagesEnum.SET_ACTUATOR_CONTROL_TARGET:
        payloadTargetSystemIndex = 9
      default:
        return
    }

    const targetSystemIndex = messagePayloadStartIndex + payloadTargetSystemIndex
    return targetSystemIndex
  }
}

module.exports = MavlinkMessageTransform
