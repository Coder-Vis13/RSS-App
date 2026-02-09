import { Request, Response } from 'express';
import { addUser } from '../models';
import { handleError } from '../utils/helpers';


interface AddUser {
  userName: string;
  userEmail: string;
  password: string;
}

//create a new user or get existing one
export const addUserHandler = async (req: Request<{}, {}, AddUser>, res: Response): Promise<void> => {
  const { userName, userEmail, password } = req.body;

  if (!userName || !userEmail || !password) {
    console.warn('WARN: Missing registration params:', req.body);
    res.status(400).json({ error: 'Missing username or email or password' });
    return;
  }

  try {
    const user = await addUser({ name: userName, email: userEmail, password_hash: password });

    res.json({
      message: user.created
        ? 'User created successfully: '
        : 'User already exists with this email: ',
      user,
    });
  } catch (error) {
    handleError(res, error, 500, 'Could not register user');
  }
};