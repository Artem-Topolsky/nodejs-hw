import { Joi, Segments } from "celebrate";
import { Types } from "mongoose";
import { TAGS } from "../constants/tags.js";

const objectIdValidator = (value, helpers) => {
  if (!Types.ObjectId.isValid(value)) {
    return helpers.message("Invalid noteId format");
  }
  return value;
};

export const getAllNotesSchema = {
  [Segments.QUERY]: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(5).max(50).default(10),
    tag: Joi.string().valid(...TAGS).optional(),
    search: Joi.string().allow(""),
  }),
};

export const noteIdSchema = {
  [Segments.PARAMS]: Joi.object({
    noteId: Joi.string().custom(objectIdValidator).required(),
  }),
};

export const createNoteSchema = {
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(1).required().messages({
      "string.base": "Title must be a string",
      "string.min": "Title should have at least {#limit} character(s)",
      "any.required": "Title is required",
    }),
    content: Joi.string().allow("").messages({
      "string.base": "Content must be a string",
    }),
    tag: Joi.string()
      .valid(...TAGS)
      .required()
      .messages({
        "string.base": "Tag must be a string",
        "any.only": `Tag must be one of: ${TAGS.join(", ")}`,
        "any.required": "Tag is required",
      }),
  }),
};

export const updateNoteSchema = {
  [Segments.PARAMS]: Joi.object({
    noteId: Joi.string().custom(objectIdValidator).required(),
  }),
  [Segments.BODY]: Joi.object({
    title: Joi.string().min(1),
    content: Joi.string().allow(""),
    tag: Joi.string().valid(...TAGS),
  }).min(1),
};
