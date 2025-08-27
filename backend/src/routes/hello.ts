import { Request, Response } from 'express';

export const helloHandler = (_req: Request, res: Response): void => {
  res.status(200).json({ message: 'Hello World' });
};