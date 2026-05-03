/** Sinema / sosyal tema — id Firestore `avatars.{userId}` alanında saklanır. */
export const AVATAR_CHOICES = [
  { id: 'clapper', emoji: '🎬' },
  { id: 'popcorn', emoji: '🍿' },
  { id: 'star', emoji: '⭐' },
  { id: 'film', emoji: '🎥' },
  { id: 'mask', emoji: '🎭' },
  { id: 'rocket', emoji: '🚀' },
  { id: 'heart', emoji: '💖' },
  { id: 'moon', emoji: '🌙' },
];

export function getAvatarEmoji(avatarId) {
  const found = AVATAR_CHOICES.find((a) => a.id === avatarId);
  return found ? found.emoji : '🎬';
}
