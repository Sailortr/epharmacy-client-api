import Joi from 'joi';

export const getCartSchema = Joi.object({
  query: Joi.object({}),
  params: Joi.object({}),
  body: Joi.object({}),
});

export const updateCartSchema = Joi.object({
  body: Joi.object({
    items: Joi.array()
      .min(1)
      .items(
        Joi.object({
          productId: Joi.string().hex().length(24).required(),
          qty: Joi.number().integer().min(0).max(999).required(),
        }),
      )
      .required(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});

export const checkoutSchema = Joi.object({
  body: Joi.object({
    paymentMethod: Joi.string().valid('mock').default('mock'),
    clientTotal: Joi.number().min(0).optional(),
  }),
  query: Joi.object({}),
  params: Joi.object({}),
});
