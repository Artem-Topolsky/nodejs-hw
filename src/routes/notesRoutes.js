import { Router } from "express";
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../controllers/notesController.js";

const router = Router();


router.get("/", getAllNotes);
router.post("/", createNote);

router.get("/:noteId", getNoteById);
router.patch("/:noteId", updateNote);
router.delete("/:noteId", deleteNote);

export default router;
