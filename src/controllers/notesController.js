import { Note } from "../models/note.js";
import createHttpError from "http-errors";

// GET /notes
export const getAllNotes = async (req, res) => {
  const notes = await Note.find();
  res.status(200).json(notes);
};

// GET /noteId
export const getNoteById = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findById(noteId);
  if (!note) {
    return next(createHttpError(404, "Note not found"));
  }
  res.status(200).json(note);
};

// POST
export const createNote = async (req, res) => {
  const note = await Note.create(req.body);
  res.status(201).json(note);
};

// PATCH
export const updateNote = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findByIdAndUpdate(noteId, req.body, { new: true });
  if (!note) {
    return next(createHttpError(404, "Note not found"));
  }
  res.status(200).json(note);
};

//DELETE
export const deleteNote = async (req, res, next) => {
  const { noteId } = req.params;
  const note = await Note.findByIdAndDelete(noteId);
  if (!note) {
    return next(createHttpError(404, "Note not found"));
  }
  res.status(200).json(note);
};
