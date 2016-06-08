'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = SerializerRegister;

var _lodash = require('lodash');

// In memory shared registry.
var registry = {};

function SerializerRegister() {
  function register(name, serializer) {
    (0, _lodash.set)(registry, name.toLowerCase(), serializer);

    return this;
  }

  function all() {
    return (0, _lodash.clone)(registry);
  }

  function get(name) {
    return (0, _lodash.get)(registry, name.toLowerCase(), null);
  }

  function has(name) {
    return !(0, _lodash.isNull)(get(name.toLowerCase()));
  }

  function remove(name) {
    registry = (0, _lodash.omit)(registry, name.toLowerCase());

    return this;
  }

  function empty() {
    registry = {};

    return this;
  }

  return { register: register, all: all, get: get, has: has, remove: remove, empty: empty };
}
module.exports = exports['default'];