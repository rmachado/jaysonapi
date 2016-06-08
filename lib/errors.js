'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TopLevelDocumentError = exports.SerializerNotRegisteredError = exports.DataReferenceError = undefined;

var _createError = require('create-error');

var _createError2 = _interopRequireDefault(_createError);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var DataReferenceError = exports.DataReferenceError = (0, _createError2.default)('Data Reference Error');

var SerializerNotRegisteredError = exports.SerializerNotRegisteredError = (0, _createError2.default)('Serializer Not Registered Error');

var TopLevelDocumentError = exports.TopLevelDocumentError = (0, _createError2.default)('Top Level Document Error');