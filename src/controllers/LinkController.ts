import { Request, Response } from 'express';
import { getUserById } from '../models/UserModel';
import { User } from '../entities/User';
import { createNewLink, createLinkId, addLinkToDatabase } from '../models/linkModel';
import { parseDatabaseError } from '../utils/db-utils';

async function shortenUrl(req: Request, res: Response): Promise<void> {
  // Make sure the user is logged in
  // send the appropriate response
  const { link } = req.params as LinkParam;
  const { isLoggedIn, authenticatedUser } = req.session;
  const { userId } = authenticatedUser;
  if (!isLoggedIn) {
    // check to see user is logined in
    res.sendStatus(403); // 403 Forbidden
  }

  // Get the userId from `req.session`
  // Retrieve the user's account data using their ID
  // Check if you got back `null`
  // send the appropriate response
  const tempUser: User = await getUserById(userId);
  if (!tempUser) {
    res.sendStatus(404);
    return;
  }

  // Check if the user is neither a "pro" nor an "admin" account
  // check how many links they've already generated
  // if they have generated 5 links
  // send the appropriate response
  // Generate a `linkId`
  // Add the new link to the database (wrap this in try/catch)
  try {
    const linkId = await createLinkId(link, userId);
    const newLink = await createNewLink(link, linkId, tempUser);
    addLinkToDatabase(newLink);
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
    return;
  }
  // Respond with status 201 if the insert was successful
  res.sendStatus(201);
}

export { shortenUrl };
