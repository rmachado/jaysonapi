'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BelongsTo = BelongsTo;
exports.HasMany = HasMany;
exports.BelongsToMany = BelongsToMany;

var _lodash = require('lodash');

function generateRelation(type, ref, refValue) {
  return {
    data: {
      type: type,
      id: String(refValue)
    }
  };
}

function handleArrayParse(schema, reference, potentialRelation, parseFn) {
  var relationList = potentialRelation.map(function (d) {
    return parseFn(schema, reference, d);
  });

  if (!relationList.length) {
    return null;
  }

  return (0, _lodash.chain)(relationList).omitBy(_lodash.isNull).map(function (d) {
    return d.data;
  }).uniqWith(function (c, cTo) {
    return c.type === cTo.type && c.id === cTo.id;
  }).reduce(function (accum, d) {
    accum.data.push(d);

    return accum;
  }, { data: [] }).value();
}

function BelongsTo(refOnReferencee) {
  function parseBelongsTo(relationSchema, referencee, potentialRelation) {
    if ((0, _lodash.isArray)(potentialRelation)) {
      var result = handleArrayParse(relationSchema, referencee, potentialRelation, parseBelongsTo);

      if (result && result.data.length) {
        result.data = result.data[0];

        return result;
      }

      return null;
    }

    var refValueOnReferencee = (0, _lodash.get)(referencee, refOnReferencee);
    var refValueOnRelation = (0, _lodash.get)(potentialRelation, relationSchema.ref);

    if (refValueOnReferencee !== refValueOnRelation) {
      return null;
    }

    return generateRelation(relationSchema.type, relationSchema.ref, (0, _lodash.get)(potentialRelation, relationSchema.ref));
  }

  parseBelongsTo.type = 'BelongsTo';

  return parseBelongsTo;
}

function HasMany(refOnRelation) {
  function parseHasMany(relationSchema, refValue, potentialRelation) {
    if ((0, _lodash.isArray)(potentialRelation)) {
      return handleArrayParse(relationSchema, refValue, potentialRelation, parseHasMany);
    }

    var refValueOnRelation = (0, _lodash.get)(potentialRelation, refOnRelation);

    // If the potentialRelation doesn't have a property matching the relationRef
    // or if the compareTo value from the potentialRelation doesn't match the
    // relationRef value from the refrencee then we'll return null as
    // there is no relation.
    if ((0, _lodash.isUndefined)(refValueOnRelation) || !(0, _lodash.isArray)(refValueOnRelation) && refValueOnRelation !== refValue || (0, _lodash.isArray)(refValueOnRelation) && !(0, _lodash.includes)(refValueOnRelation, refValue)) {
      return null;
    }

    return generateRelation(relationSchema.type, relationSchema.ref, (0, _lodash.get)(potentialRelation, relationSchema.ref));
  }

  parseHasMany.type = 'HasMany';

  return parseHasMany;
}

function BelongsToMany(refOnRelation) {
  function parseBelongsToMany(relationSchema, refValue, potentialRelation) {
    if ((0, _lodash.isArray)(potentialRelation)) {
      return handleArrayParse(relationSchema, refValue, potentialRelation, parseBelongsToMany);
    }

    var refValueOnRelation = (0, _lodash.get)(potentialRelation, refOnRelation);

    return generateRelation(relationSchema.type, relationSchema.ref, (0, _lodash.get)(potentialRelation, relationSchema.ref));
  }

  parseBelongsToMany.type = 'BelongsToMany';

  return parseBelongsToMany;
}