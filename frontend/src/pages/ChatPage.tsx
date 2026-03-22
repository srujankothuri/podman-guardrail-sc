import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  SendIcon,
  MessageSquareIcon,
  ShieldAlertIcon,
  AlertTriangleIcon,
  InfoIcon,
  ClockIcon,
  XIcon } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { submitPrompt, ApiRequestError, JobStatusValue } from '../lib/api';
import { useJobPoller } from '../hooks/useJobPoller';
import { ChatMessage } from '../components/ChatMessage';
import { StatusIndicator } from '../components/StatusIndicator';
const USER_ID = 'employee-1';
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}
interface Banner {
  id: string;
  type: 'blocked' | 'failed' | 'warning' | 'compliance' | 'rateLimit';
  message: string;
}
const TERMINAL_STATUSES: JobStatusValue[] = ['completed', 'blocked', 'failed'];
export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banners, setBanners] = useState<Banner[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    status,
    answer,
    insufficientData,
    error: pollerError,
    reset: resetPoller
  } = useJobPoller(jobId);
  const isProcessing =
  jobId !== null && status !== null && !TERMINAL_STATUSES.includes(status);
  const addBanner = useCallback((type: Banner['type'], message: string) => {
    const id = Date.now().toString();
    setBanners((prev) => [
    ...prev,
    {
      id,
      type,
      message
    }]
    );
  }, []);
  const removeBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);
  // Handle completed job
  useEffect(() => {
    if (!status || !jobId) return;
    if (status === 'completed' && answer) {
      setMessages((prev) => [
      ...prev,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: answer
      }]
      );
      if (insufficientData) {
        addBanner(
          'warning',
          'This response was generated with limited supporting data and may be incomplete.'
        );
      }
      setJobId(null);
      resetPoller();
    } else if (status === 'blocked') {
      addBanner(
        'blocked',
        'A response could not be generated because the retrieved content did not meet company compliance requirements.'
      );
      setJobId(null);
      resetPoller();
    } else if (status === 'failed') {
      addBanner('failed', 'Response generation failed. Please try again later.');
      setJobId(null);
      resetPoller();
    }
  }, [status, answer, insufficientData, jobId, addBanner, resetPoller]);
  // Handle poller error
  useEffect(() => {
    if (pollerError) {
      addBanner('failed', pollerError);
      setJobId(null);
      resetPoller();
    }
  }, [pollerError, addBanner, resetPoller]);
  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });
  }, [messages, status]);
  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || isSubmitting || isProcessing) return;
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSubmitting(true);
    try {
      const response = await submitPrompt(trimmed, USER_ID);
      setJobId(response.job_id);
    } catch (err) {
      if (err instanceof ApiRequestError) {
        if (err.status === 400) {
          addBanner('compliance', err.detail);
        } else if (err.status === 429) {
          addBanner(
            'rateLimit',
            'You are sending requests too quickly. Please wait a moment.'
          );
        } else {
          addBanner('failed', err.detail);
        }
      } else {
        addBanner('failed', 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      inputRef.current?.focus();
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
  const bannerConfig: Record<
    Banner['type'],
    {
      borderColor: string;
      bgColor: string;
      textColor: string;
      Icon: React.ElementType;
    }> =
  {
    blocked: {
      borderColor: 'border-l-ibm-red-60',
      bgColor: 'bg-ibm-red-bg',
      textColor: 'text-ibm-red-60',
      Icon: ShieldAlertIcon
    },
    failed: {
      borderColor: 'border-l-ibm-red-60',
      bgColor: 'bg-ibm-red-bg',
      textColor: 'text-ibm-red-60',
      Icon: AlertTriangleIcon
    },
    warning: {
      borderColor: 'border-l-ibm-yellow-30',
      bgColor: 'bg-ibm-yellow-bg',
      textColor: 'text-ibm-gray-100',
      Icon: AlertTriangleIcon
    },
    compliance: {
      borderColor: 'border-l-ibm-orange-40',
      bgColor: 'bg-ibm-orange-bg',
      textColor: 'text-ibm-gray-100',
      Icon: InfoIcon
    },
    rateLimit: {
      borderColor: 'border-l-ibm-orange-40',
      bgColor: 'bg-ibm-orange-bg',
      textColor: 'text-ibm-gray-100',
      Icon: ClockIcon
    }
  };
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-ibm-gray-20 px-6 py-4">
        <h1 className="text-xl font-semibold text-ibm-gray-100">
          AI Assistant
        </h1>
        <p className="text-sm text-ibm-gray-70 mt-0.5">
          Ask questions about company policies and procedures
        </p>
      </header>

      {/* Banners */}
      <AnimatePresence>
        {banners.map((banner) => {
          const config = bannerConfig[banner.type];
          const BannerIcon = config.Icon;
          return (
            <motion.div
              key={banner.id}
              className={`flex-shrink-0 flex items-start gap-3 px-6 py-3 border-l-4 ${config.borderColor} ${config.bgColor}`}
              initial={{
                opacity: 0,
                height: 0
              }}
              animate={{
                opacity: 1,
                height: 'auto'
              }}
              exit={{
                opacity: 0,
                height: 0
              }}
              role="alert">
              
              <BannerIcon
                className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.textColor}`} />
              
              <p className={`text-sm flex-1 ${config.textColor}`}>
                {banner.message}
              </p>
              <button
                onClick={() => removeBanner(banner.id)}
                className="flex-shrink-0 text-ibm-gray-50 hover:text-ibm-gray-100 transition-colors"
                aria-label="Dismiss notification">
                
                <XIcon className="w-4 h-4" />
              </button>
            </motion.div>);

        })}
      </AnimatePresence>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto chat-scroll px-6 py-6 space-y-4">
        {messages.length === 0 && !isProcessing ?
        <div className="flex flex-col items-center justify-center h-full text-ibm-gray-50">
            <div className="w-16 h-16 rounded-full bg-ibm-gray-10 flex items-center justify-center mb-4">
              <MessageSquareIcon className="w-7 h-7" />
            </div>
            <p className="text-base font-medium text-ibm-gray-70">
              Start a conversation
            </p>
            <p className="text-sm mt-1">
              Ask about HR policies, compliance guidelines, or company
              procedures.
            </p>
          </div> :

        <>
            {messages.map((msg) =>
          <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          )}

            {/* Status indicator while processing */}
            {isProcessing && status &&
          <motion.div
            className="max-w-3xl mr-auto"
            initial={{
              opacity: 0,
              y: 12
            }}
            animate={{
              opacity: 1,
              y: 0
            }}>
            
                <div className="bg-white border border-ibm-gray-20 rounded-lg shadow-sm overflow-hidden">
                  <StatusIndicator currentStatus={status} />
                </div>
              </motion.div>
          }
          </>
        }
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 bg-white border-t border-ibm-gray-20 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            rows={1}
            className="flex-1 resize-none rounded border border-ibm-gray-20 px-4 py-2.5 text-sm text-ibm-gray-100 placeholder:text-ibm-gray-50 focus:outline-none focus:border-ibm-blue-60 focus:ring-1 focus:ring-ibm-blue-60 transition-colors"
            aria-label="Message input"
            disabled={isProcessing}
            style={{
              minHeight: '42px',
              maxHeight: '120px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = Math.min(target.scrollHeight, 120) + 'px';
            }} />
          
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isSubmitting || isProcessing}
            className="flex items-center justify-center w-10 h-[42px] rounded bg-ibm-blue-60 text-white hover:bg-ibm-blue-70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="Send message">
            
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[11px] text-ibm-gray-50 text-center mt-2">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>);

}