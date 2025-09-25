import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import pino from 'pino-http';

const app = express();
const PORT = process.env.PORT || 3030;


app.use(
  pino({
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'HH:MM:ss',
        ignore: 'pid,hostname',
      },
    },
  })
);


app.use(cors());
app.use(express.json());


app.get('/notes', (req, res) => {
  return res.status(200).json({ message: 'Retrieved all notes' });
});

app.get('/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  return res
    .status(200)
    .json({ message: `Retrieved note with ID: ${noteId}` });
});


app.get('/test-error', () => {
  throw new Error('Simulated server error');
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {

  if (req && req.log) req.log.error(err);
  console.error(err);
  res.status(500).json({ message: err.message || 'Simulated server error' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
