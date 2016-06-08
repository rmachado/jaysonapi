'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Registry = exports.Relationships = undefined;
exports.default = Serializer;

var _lodash = require('lodash');

var _errors = require('./errors');

var _relationships = require('./relationships');

var _registry = require('./registry');

var _registry2 = _interopRequireDefault(_registry);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var defaultConfig = {
  ref: 'id',
  registry: (0, _registry2.default)()
};

function Serializer(type, serializerSchema) {
  var configuration = arguments.length <= 2 || arguments[2] === undefined ? {} : arguments[2];

  var config = (0, _lodash.defaults)(configuration, defaultConfig);
  var ref = config.ref;
  var registry = config.registry;
  var attributes = serializerSchema.attributes;
  var relationships = serializerSchema.relationships;
  var links = serializerSchema.links;

  /**
   * Parse Serializer
   *
   * @param serializer {function,object,string}
   *
   * @return object
   */

  function parseSerializer(serializer) {
    // Support embeded serializers
    if ((0, _lodash.isFunction)(serializer)) {
      return serializer;
    }

    // Support serializer registry
    if ((0, _lodash.isString)(serializer)) {
      var name = serializer;
      var registeredSerializer = registry.get(name.toLowerCase());

      if (!registeredSerializer) {
        var msg = name + ' is not a registered serializer.';
        throw new _errors.SerializerNotRegisteredError(msg);
      }

      return registeredSerializer;
    }

    // Support dynamic serializer creation
    return Serializer(serializer.type, serializer, serializer.config || {});
  }

  /**
   * Process Data Relationships
   *
   * @param data {object}
   * @param included {object} { address: [] | {}, phone: [] | {} }
   *
   * @return object|array
   */
  function processDataRelationships(data, included) {
    if ((0, _lodash.isEmpty)(relationships) || (0, _lodash.isEmpty)(data) || (0, _lodash.isEmpty)(included)) {
      return undefined;
    }

    var toInclude = (0, _lodash.pick)(included, Object.keys(relationships));

    if ((0, _lodash.isEmpty)(toInclude)) {
      return undefined;
    }

    var dataRelationships = (0, _lodash.reduce)(toInclude, function (accum, relationData, relationName) {
      var relation = (0, _lodash.get)(relationships, relationName);
      var relationSerializer = parseSerializer(relation.serializer);
      var relationParser = relation.relationshipType;
      var parserData = relationParser.type === 'HasMany' ? (0, _lodash.get)(data, ref) : data;

      var parsedRelation = relationParser(relationSerializer, parserData, relationData);

      if ((0, _lodash.isNull)(parsedRelation) || (0, _lodash.isArray)(parsedRelation.data) && (0, _lodash.isEmpty)(parsedRelation.data)) {
        return accum;
      }

      return (0, _lodash.set)(accum, relationName, parsedRelation);
    }, {});

    return (0, _lodash.isEmpty)(dataRelationships) ? undefined : dataRelationships;
  }

  function processDataLinks(data) {
    var toProcess = (0, _lodash.pick)(links, ['self', 'related']);

    if ((0, _lodash.isEmpty)(toProcess)) {
      return undefined;
    }

    return (0, _lodash.reduce)(toProcess, function (accum, fn, key) {
      accum[key] = fn(data);

      return accum;
    }, {});
  }

  /**
   * Process Data
   *
   * @param data {object}
   * @param included {object} { address: [] | {}, phone: [] | {} }
   *
   * @return object|array
   */
  function processData(data, included) {
    var _resourceObject;

    if ((0, _lodash.isEmpty)(data)) {
      if ((0, _lodash.isUndefined)(data)) {
        return data;
      }

      return (0, _lodash.isArray)(data) ? data : null;
    }

    if ((0, _lodash.isArray)(data)) {
      return data.map(function (d) {
        return processData(d, included);
      });
    }

    var refValue = (0, _lodash.get)(data, ref);

    if (!refValue) {
      var msg = ref + ' property must be defined within data';
      throw new _errors.DataReferenceError(msg);
    }

    var serializedAttributes = (0, _lodash.pick)(data, attributes);
    var serializedRelationships = processDataRelationships(data, included);
    var serializedLinks = processDataLinks(data);

    var resourceObject = (_resourceObject = {
      type: type
    }, _defineProperty(_resourceObject, ref, String(refValue)), _defineProperty(_resourceObject, 'attributes', (0, _lodash.isEmpty)(serializedAttributes) ? undefined : serializedAttributes), _defineProperty(_resourceObject, 'relationships', serializedRelationships), _defineProperty(_resourceObject, 'links', serializedLinks), _resourceObject);

    return (0, _lodash.omitBy)(resourceObject, _lodash.isUndefined);
  }

  /**
   * Process Included
   *
   * TODO: Spec calls for including included data, even if its not directly related
   * to the data - they can be related to each other. Currently i don't see a simple
   * way to include non-related data - there isn't a way to specify the serializers for them.
   *
   * @param relationship {object} { address: { serializer: {}, relationship: {} } }
   * @param included {object} { address: [] | {}, phone: [] | {} }
   *
   * @return array
   */
  function processIncluded(included) {
    if ((0, _lodash.isEmpty)(relationships) || (0, _lodash.isEmpty)(included)) {
      return undefined;
    }

    var relationshipNameList = Object.keys(relationships);
    var toInclude = (0, _lodash.pick)(included, relationshipNameList);

    if ((0, _lodash.isEmpty)(toInclude)) {
      return undefined;
    }

    return (0, _lodash.chain)(Object.keys(toInclude)).map(function (relationName) {
      var relationSchema = (0, _lodash.get)(relationships, relationName);
      var relationData = (0, _lodash.get)(toInclude, relationName);
      var relationSerializer = parseSerializer(relationSchema.serializer);

      return relationSerializer.serialize({ data: relationData }).data;
    }).flatten().uniqWith(function (c, cTo) {
      // TODO(digia): Is this harming performance enough to refactor?
      // We do this to dynamically detect the reference property.
      // Top level of an include - at this time - should only be
      // id, "ref", and attributes. Ref can be configured.
      var kL = Object.keys((0, _lodash.omit)(c, 'attributes'));

      return (0, _lodash.get)(c, kL[0]) === (0, _lodash.get)(cTo, kL[0]) && (0, _lodash.get)(c, kL[1]) === (0, _lodash.get)(cTo, kL[1]);
    }).value();
  }

  function processTopLevelLinks(links) {
    // self: the link that generated the current response document.
    // related: a related resource link when the primary data represents a resource relationship.
    // pagination: (Deprecated) pagination links for the primary data.
    // first: the first page of data
    // last: the last page of data
    // prev: the previous page of data
    // next: the next page of data
    var topLevelLinks = (0, _lodash.pick)(links, ['self', 'related', 'pagination', 'first', 'last', 'prev', 'next']);

    if ((0, _lodash.isEmpty)(topLevelLinks)) {
      return undefined;
    }

    return topLevelLinks;
  }

  function serialize() {
    var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    var data = _ref.data;
    var included = _ref.included;
    var meta = _ref.meta;
    var links = _ref.links;
    var errors = _ref.errors;
    // eslint-disable-line
    var serialized = {
      data: processData(data, included),
      included: processIncluded(included),
      meta: meta,
      links: processTopLevelLinks(links),
      errors: errors
    };

    if ((0, _lodash.isUndefined)(serialized.data) && (0, _lodash.isEmpty)(serialized.errors) && (0, _lodash.isEmpty)(serialized.meta)) {
      var msg = 'One of the following must be included data, errors, meta';
      throw new _errors.TopLevelDocumentError(msg);
    }

    // "If a document does not contain a top-level data key - or data is empty,
    // the included member MUST NOT be present either."
    if ((0, _lodash.isUndefined)(serialized.data) || (0, _lodash.isEmpty)(serialized.data) && !(0, _lodash.isUndefined)(serialized.included)) {
      return (0, _lodash.chain)(serialized).omit('included').omitBy(_lodash.isUndefined).value();
    }

    return (0, _lodash.omitBy)(serialized, _lodash.isUndefined);
  }

  return { type: type, ref: ref, attributes: attributes, relationships: relationships, serialize: serialize };
}

var Relationships = exports.Relationships = {
  hasMany: _relationships.HasMany,
  belongsTo: _relationships.BelongsTo,
  belongsToMany: _relationships.BelongsToMany
};

var Registry = exports.Registry = (0, _registry2.default)();