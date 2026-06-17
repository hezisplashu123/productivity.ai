import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { ensureProfile } from './profile.controller';

export async function syncUser(req: Request, res: Response) {
  const { email, name, provider, socialId } = req.body;

  if (!email && !socialId) {
    return res.status(400).json({ error: 'email or socialId is required' });
  }

  try {
    const isGuest = typeof email === 'string' && email.endsWith('@hezi.app') && email.startsWith('guest_');
    const displayName = name || (isGuest ? 'Guest' : 'Player');
    const authProvider = provider || (isGuest ? 'guest' : 'email');

    let user;
    if (socialId) user = await prisma.user.findUnique({ where: { socialId } });
    if (!user && email) user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: displayName,
          socialId: socialId || user.socialId,
          provider: authProvider,
        },
      });
    } else {
      const finalEmail = email || `${socialId}@${authProvider}.com`;
      user = await prisma.user.create({
        data: {
          email: finalEmail,
          name: displayName,
          provider: authProvider,
          socialId: socialId ?? null,
        },
      });
    }

    const profile = await ensureProfile(user.id);
    const populatedUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { profile: true },
    });

    res.json({
      ...populatedUser,
      profile: populatedUser?.profile ?? profile,
      profileId: populatedUser?.profile?.id ?? profile.id,
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Failed to sync user', details: String(error) });
  }
}

export async function getUserByEmail(req: Request, res: Response) {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
}

export async function deleteUserByEmail(req: Request, res: Response) {
  const { email } = req.params;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prisma.user.delete({ where: { id: user.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
}
