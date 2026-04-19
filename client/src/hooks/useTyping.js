import { useRef, useCallback } from 'react';
import { emitTypingStart, emitTypingStop } from '../services/socket';

const useTyping = (conversationId) => {
  const typingRef = useRef(false);
  const timeoutRef = useRef(null);

  const startTyping = useCallback(() => {
    if (!conversationId) return;
    if (!typingRef.current) {
      typingRef.current = true;
      emitTypingStart(conversationId);
    }
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      typingRef.current = false;
      emitTypingStop(conversationId);
    }, 2500);
  }, [conversationId]);

  const stopTyping = useCallback(() => {
    if (!conversationId) return;
    clearTimeout(timeoutRef.current);
    if (typingRef.current) {
      typingRef.current = false;
      emitTypingStop(conversationId);
    }
  }, [conversationId]);

  return { startTyping, stopTyping };
};

export default useTyping;
