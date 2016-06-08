import {
  chain as Chain,
  isArray as IsArray,
  isNull as IsNull,
  isUndefined as IsUndefined,
  get as Get,
  includes as Includes,
} from 'lodash';


function generateRelation(type, ref, refValue) {
  return {
    data: {
      type,
      id: String(refValue),
    },
  };
}

function handleArrayParse(schema, reference, potentialRelation, parseFn) {
  const relationList = potentialRelation.map(d => parseFn(schema, reference, d));

  if (!relationList.length) {
    return null;
  }

  return Chain(relationList)
    .omitBy(IsNull)
    .map(d => d.data)
    .uniqWith((c, cTo) => {
      return c.type === cTo.type && c.id === cTo.id;
    })
    .reduce((accum, d) => {
      accum.data.push(d);

      return accum;
    }, { data: [] })
    .value();
}

export function BelongsTo(refOnReferencee) {
  function parseBelongsTo(relationSchema, referencee, potentialRelation) {
    if (IsArray(potentialRelation)) {
      const result = handleArrayParse(
        relationSchema,
        referencee,
        potentialRelation,
        parseBelongsTo
      );

      if (result && result.data.length) {
        result.data = result.data[0];

        return result;
      }

      return null;
    }

    const refValueOnReferencee = Get(referencee, refOnReferencee);
    const refValueOnRelation = Get(potentialRelation, relationSchema.ref);

    if (refValueOnReferencee !== refValueOnRelation) {
      return null;
    }

    return generateRelation(
      relationSchema.type,
      relationSchema.ref,
      Get(potentialRelation, relationSchema.ref)
    );
  }

  parseBelongsTo.type = 'BelongsTo';

  return parseBelongsTo;
}

export function HasMany(refOnRelation) {
  function parseHasMany(relationSchema, refValue, potentialRelation) {
    if (IsArray(potentialRelation)) {
      return handleArrayParse(relationSchema, refValue, potentialRelation, parseHasMany);
    }

    const refValueOnRelation = Get(potentialRelation, refOnRelation);

    // If the potentialRelation doesn't have a property matching the relationRef
    // or if the compareTo value from the potentialRelation doesn't match the
    // relationRef value from the refrencee then we'll return null as
    // there is no relation.
    if (IsUndefined(refValueOnRelation) ||
        !IsArray(refValueOnRelation) && refValueOnRelation !== refValue ||
        IsArray(refValueOnRelation) && !Includes(refValueOnRelation, refValue)) {
      return null;
    }


    return generateRelation(
      relationSchema.type,
      relationSchema.ref,
      Get(potentialRelation, relationSchema.ref)
    );
  }

  parseHasMany.type = 'HasMany';

  return parseHasMany;
}

export function BelongsToMany(refOnRelation) {
  function parseBelongsToMany(relationSchema, refValue, potentialRelation) {
    if (IsArray(potentialRelation)) {
      return handleArrayParse(relationSchema, refValue, potentialRelation, parseBelongsToMany);
    }

    const refValueOnRelation = Get(potentialRelation, refOnRelation);

    return generateRelation(
      relationSchema.type,
      relationSchema.ref,
      Get(potentialRelation, relationSchema.ref)
    );
  }

  parseBelongsToMany.type = 'BelongsToMany';

  return parseBelongsToMany;
}
