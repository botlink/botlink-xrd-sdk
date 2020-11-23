const Botlink = require('bindings')('botlink-cxx-client-bindings');
const EventEmitter = require('events')
const inherits = require('util').inherits

inherits(Botlink.XrdConnection, EventEmitter)

module.exports.XrdConnection = Botlink.XrdConnection
module.exports.Api = Botlink.BotlinkApi
