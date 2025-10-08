import createError from 'http-errors';
import Joi from 'joi';

export const validate =
  (schema, source = 'body') =>
  (req, _res, next) => {
    const isJoi = (s) =>
      s &&
      typeof s === 'object' &&
      typeof s.validate === 'function' &&
      typeof s.describe === 'function';

    let isWrapper = false;
    let compiled = schema;

    if (!isJoi(schema) && schema && typeof schema === 'object') {
      const hasWrapperKeys = ['body', 'query', 'params'].some((k) =>
        Object.prototype.hasOwnProperty.call(schema, k),
      );

      if (hasWrapperKeys) {
        isWrapper = true;
        const shape = {};

        if (schema.body) shape.body = schema.body;
        if (schema.query) shape.query = schema.query;
        if (schema.params) shape.params = schema.params;

        compiled = Joi.object(shape).unknown(true);
      }
    }

    if (isJoi(schema)) {
      const desc = schema.describe?.();
      const keys = desc?.keys ? Object.keys(desc.keys) : [];
      isWrapper = ['body', 'query', 'params'].some((k) => keys.includes(k));
      compiled = schema;
    }

    const toValidate = isWrapper
      ? { body: req.body, query: req.query, params: req.params }
      : req[source];

    const { error, value } = compiled.validate(toValidate, {
      abortEarly: false,
      stripUnknown: false,
      convert: true,
    });

    if (!error) {
      if (isWrapper) {
        if (value?.body !== undefined) req.body = value.body;
        if (value?.query !== undefined) req.query = value.query;
        if (value?.params !== undefined) req.params = value.params;
      } else {
        req[source] = value;
      }
      return next();
    }

    const isTest = process.env.NODE_ENV === 'test';
    const details = error.details?.map((d) => ({
      path: d.path.join('.'),
      message: d.message,
      type: d.type,
    }));

    return next(
      createError(
        400,
        isTest ? `Validation error: ${JSON.stringify(details)}` : 'Validation error',
      ),
    );
  };
