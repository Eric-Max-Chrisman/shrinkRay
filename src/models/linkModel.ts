import { createHash } from 'crypto';
import { AppDataSource } from '../dataSource';
import { Link } from '../entities/Link';
import { User } from '../entities/User';

const linkRepository = AppDataSource.getRepository(Link);

async function getLinkById(linkId: string): Promise<Link | null> {
  const link = await linkRepository.findOne({ where: { linkId } });
  return link;
}

function createLinkId(originalUrl: string, userId: string): string {
  const md5 = createHash('md5');
  md5.update(originalUrl.concat('', userId));
  const urlHash = md5.digest('base64url');
  const linkId = urlHash.slice(0, 9);

  return linkId;
}

async function createNewLink(originalUrl: string, linkId: string, creator: User): Promise<Link> {
  const newLinkHash: string = createLinkId(originalUrl, creator.userId);
  let newLink: Link;
  newLink.linkId = newLinkHash;
  newLink.originalUrl = originalUrl;
  newLink.user = creator;

  return newLink;
}

async function addLinkToDatabase(newLink: Link): Promise<Link | null> {
  const tempLink = await linkRepository.save(newLink);
  return tempLink;
}

async function updateLinkVisits(link: Link): Promise<Link> {
  // Increment the link's number of hits property
  const tempLink: Link = link;
  tempLink.numHits += 1;

  // Create a new date object and assign it to the link's `lastAccessedOn` property.
  const now = new Date();
  tempLink.lastAccessedOn = now;
  // Update the link's numHits and lastAccessedOn in the database
  await linkRepository
    .createQueryBuilder()
    .update(Link)
    .set({ numHits: tempLink.numHits, lastAccessedOn: tempLink.lastAccessedOn })
    .where({ linkId: tempLink.linkId })
    .execute();

  // return the updated link
  return tempLink;
}

async function getLinkByLinkId(linkId: string): Promise<Link | null> {
  return linkRepository.findOne({ where: { linkId } });
}

async function getLinksByUserId(userId: string): Promise<Link[]> {
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } }) // NOTES: This is how you do nested WHERE clauses
    .leftJoin('link.user', 'user')
    .select(['link.linkId', 'link.originalUrl', 'user'])
    .getMany();

  return links;
}

async function getLinksByUserIdForOwnAccount(userId: string): Promise<Link[]> {
  // TODO: This function is pretty much the same but it should return the fields
  const links = await linkRepository
    .createQueryBuilder('link')
    .where({ user: { userId } }) // NOTES: This is how you do nested WHERE clauses
    .leftJoin('link.user', 'user')
    .select(['link.linkId', 'link.originalUrl', 'link.numHits', 'link.lastAccessedOn', 'user'])
    .getMany();

  return links;
}

async function deleteLinkWithId(linkId: string): Promise<void> {
  await linkRepository
    .createQueryBuilder('link')
    .delete()
    .where('linkId = :linkId', { linkId })
    .execute();
}

export {
  getLinkById,
  createLinkId,
  createNewLink,
  addLinkToDatabase,
  updateLinkVisits,
  getLinkByLinkId,
  getLinksByUserId,
  getLinksByUserIdForOwnAccount,
  deleteLinkWithId,
};
