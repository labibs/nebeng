// /utils/chatHelper.js
import { useNavigate } from "react-router-dom";

/**
 * openChat - global helper untuk buka halaman chat
 * @param {string} convId - conversation ID
 * @param {object} opponent - lawan chat { name, avatar_url }
 * @param {object} navigate - function dari react-router-dom
 */
export const openChat = (convId, opponent, navigate) => {
  if (!convId || !opponent || !navigate) return;

  navigate(`/chat/${convId}`, {
    state: { recipient: { name: opponent.name, imageUrl: opponent.avatar_url } },
  });
};
