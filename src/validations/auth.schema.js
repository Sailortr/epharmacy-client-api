import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(80).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().allow('', null),
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/[A-Z]/) 
    .pattern(/[a-z]/) 
    .pattern(/[0-9]/) 
    .required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).optional(),
  role: Joi.string().valid('customer', 'admin').optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});
