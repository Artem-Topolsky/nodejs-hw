import bcrypt from 'bcrypt';
import createHttpError from 'http-errors';
import jwt from 'jsonwebtoken';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

const templatePath = path.join(
  process.cwd(),
  'src',
  'templates',
  'reset-password-email.html',
);

export const registerUser = async (req, res, next) => {
  const { email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(createHttpError(400, 'Email in use'));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({
    email,
    password: hashedPassword,
  });

  const newSession = await createSession(newUser._id);
  setSessionCookies(res, newSession);

  res.status(201).json(newUser);
};

export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    return next(createHttpError(401, 'User not found'));
  }

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) {
    return next(createHttpError(401, 'Invalid credentials'));
  }

  await Session.deleteOne({ userId: user._id });

  const newSession = await createSession(user._id);
  setSessionCookies(res, newSession);

  res.status(200).json(user);
};

export const logoutUser = async (req, res) => {
  const { sessionId } = req.cookies;

  if (sessionId) {
    await Session.deleteOne({ _id: sessionId });
  }

  res.clearCookie('sessionId');
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');

  res.status(204).send();
};

export const refreshUserSession = async (req, res, next) => {
  const session = await Session.findOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  if (!session) {
    return next(createHttpError(401, 'Session not found'));
  }

  const isRefreshTokenExpired =
    new Date() > new Date(session.refreshTokenValidUntil);
  if (isRefreshTokenExpired) {
    return next(createHttpError(401, 'Session token expired'));
  }

  await Session.deleteOne({
    _id: req.cookies.sessionId,
    refreshToken: req.cookies.refreshToken,
  });

  const newSession = await createSession(session.userId);
  setSessionCookies(res, newSession);

  res.status(200).json({
    message: 'Session refreshed',
  });
};

export const requestResetEmail = async (req, res, next) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.json({ message: 'Password reset email sent successfully' });
  }

  const token = jwt.sign({ sub: user._id, email }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });

  const template = await fs.readFile(templatePath, 'utf-8');
  const compileTemplate = handlebars.compile(template);
  const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${token}`;

  const html = compileTemplate({
    username: user.username,
    resetLink,
  });

  try {
    await sendEmail(email, 'Password Reset', html);
    res.json({ message: 'Password reset email sent successfully' });
  } catch {
    next(
      createHttpError(500, 'Failed to send the email, please try again later.'),
    );
  }
};

export const resetPassword = async (req, res, next) => {
  const { token, password } = req.body;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: payload.sub, email: payload.email });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return next(createHttpError(401, 'Invalid or expired token'));
    }
    next(err);
  }
};
