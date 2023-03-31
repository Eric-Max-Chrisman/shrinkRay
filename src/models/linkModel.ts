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

export { getLinkById, createLinkId, createNewLink, addLinkToDatabase };
