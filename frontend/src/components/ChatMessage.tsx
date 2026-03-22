import React from 'react';
import { UserIcon, BotIcon } from 'lucide-react';
import { motion } from 'framer-motion';
interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
}
export function ChatMessage({ role, content }: ChatMessageProps) {
  const isUser = role === 'user';
  return (
    <motion.div
      className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
      initial={{
        opacity: 0,
        y: 12
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.25
      }}>
      
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center ${isUser ? 'bg-ibm-blue-60' : 'bg-ibm-gray-20'}`}
        aria-hidden="true">
        
        {isUser ?
        <UserIcon className="w-4 h-4 text-white" /> :

        <BotIcon className="w-4 h-4 text-ibm-gray-70" />
        }
      </div>

      {/* Bubble */}
      <div
        className={`px-4 py-3 rounded-lg text-sm leading-relaxed max-w-[85%] ${isUser ? 'bg-ibm-blue-60 text-white rounded-tr-sm' : 'bg-white text-ibm-gray-100 border border-ibm-gray-20 rounded-tl-sm shadow-sm'}`}>
        
        <p className="whitespace-pre-wrap break-words">{content}</p>
      </div>
    </motion.div>);

}