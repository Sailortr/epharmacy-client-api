export const validate = (schema) => (req, _res, next) => {
  const data = { body: req.body, query: req.query, params: req.params };
  const { error, value } = schema.prefs({ abortEarly: false, stripUnknown: true }).validate(data);
  if (error)
    return next(
      Object.assign(new Error('Validation error'), {
        status: 400,
        expose: true,
        details: error.details,
      }),
    );
  Object.assign(req, value);
  next();
};
