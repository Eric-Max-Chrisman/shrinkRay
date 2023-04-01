import { Request, Response } from 'express';
import { getUserById, getUserWithUsername } from '../models/UserModel';
import { User } from '../entities/User';
import { Link } from '../entities/Link';
import {
  createNewLink,
  createLinkId,
  addLinkToDatabase,
  updateLinkVisits,
  getLinkByLinkId,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  deleteLinkWithId,
} from '../models/linkModel';
import { parseDatabaseError } from '../utils/db-utils';

async function shortenUrl(req: Request, res: Response): Promise<void> {
  // Make sure the user is logged in
  // send the appropriate response
  const { link } = req.params as LinkParam;
  const { isLoggedIn, authenticatedUser } = req.session;
  const { userId } = authenticatedUser;
  if (!isLoggedIn) {
    res.sendStatus(401);
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
  if (tempUser.isAdmin || tempUser.isPro) {
    const numLinks: number = tempUser.links.length;
    if (numLinks > 5) {
      res.sendStatus(403);
      console.log('User reached link limit');
      return;
    }
  }

  // Generate a `linkId`
  // Add the new link to the database (wrap this in try/catch)
  try {
    const linkId = await createLinkId(link, userId);
    const newLink = await createNewLink(link, linkId, tempUser);
    addLinkToDatabase(newLink);
    console.log(res.json(newLink));
  } catch (err) {
    console.error(err);
    const databaseErrorMessage = parseDatabaseError(err);
    res.status(500).json(databaseErrorMessage);
    return;
  }
  // Respond with status 201 if the insert was successful
  res.sendStatus(201);
}

async function getOriginalUrl(req: Request, res: Response): Promise<void> {
  // Retrieve the link data using the targetLinkId from the path parameter
  const { link } = req.params as LinkParam;
  const refLink: Link = await getLinkByLinkId(link);

  // Check if you got back `null`
  if (!refLink) {
    // send the appropriate response
    res.sendStatus(404);
    return;
  }

  // Call the appropriate function to increment the number of hits and the last accessed date
  const printLink: Link = await updateLinkVisits(refLink);
  console.log(res.json(printLink));

  // Redirect the client to the original URL
  const redirectLink: string = refLink.originalUrl;
  res.sendStatus(201);
  window.location.replace(redirectLink); // from w3schools, shold redirect like <a href= "n">
}

async function getAllUsersLinks(req: Request, res: Response): Promise<void> {
  // set up variables
  const username = req.params as UserUserNameParam;
  const refUser: User = await getUserWithUsername(username.targetUserUserName);

  // see if user exist
  if (!refUser) {
    res.sendStatus(404);
    return;
  }

  // session managment
  const { isLoggedIn, authenticatedUser } = req.session;

  // if admin or logged in as the user get on info
  if (authenticatedUser.isAdmin || (isLoggedIn && authenticatedUser.userId === refUser.userId)) {
    // get everything
    const links: Link[] = await getLinksByUserIdForOwnAccount(refUser.userId);
    console.log(res.json(links));
  }
  // if not, get some info
  else {
    // get all links and some user info
    const links: Link[] = await getLinksByUserId(refUser.userId);
    console.log(res.json(links));
  }

  res.sendStatus(201);
}

async function deleteLink(req: Request, res: Response): Promise<void> {
  // set up variables
  const linkId = req.params as LinkParam;
  const link = await getLinkByLinkId(linkId.link);

  // check to see if link exist
  if (!link) {
    res.sendStatus(404);
    return;
  }

  // session managment
  const { isLoggedIn, authenticatedUser } = req.session;

  // if admin or logged in as owner of link, delete
  if (authenticatedUser.isAdmin || (isLoggedIn && authenticatedUser.userId === link.user.userId)) {
    deleteLinkWithId(linkId.link);
  }
  // else, error
  else {
    res.sendStatus(403);
    return;
  }

  res.sendStatus(201);
}
export { shortenUrl, getOriginalUrl, getAllUsersLinks, deleteLink };
