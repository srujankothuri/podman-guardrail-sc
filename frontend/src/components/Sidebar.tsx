import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheckIcon,
  MessageSquareIcon,
  SettingsIcon,
  MenuIcon,
  XIcon } from
'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
  {
    to: '/chat',
    label: 'Chat',
    icon: MessageSquareIcon
  },
  {
    to: '/admin',
    label: 'Admin Dashboard',
    icon: SettingsIcon
  }];

  const linkClasses = ({ isActive }: {isActive: boolean;}) =>
  `flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150 ${isActive ? 'bg-ibm-gray-80 text-white border-l-[3px] border-ibm-blue-60 pl-[13px]' : 'text-ibm-gray-30 hover:bg-ibm-gray-80 hover:text-white border-l-[3px] border-transparent pl-[13px]'}`;
  const sidebarContent =
  <div className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-ibm-gray-80">
        <div className="flex items-center justify-center w-8 h-8 rounded bg-ibm-blue-60">
          <ShieldCheckIcon className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-semibold text-white leading-tight">
            Secure AI
          </h1>
          <p className="text-xs text-ibm-gray-50 leading-tight">Pipeline</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {navItems.map((item) =>
        <li key={item.to}>
              <NavLink
            to={item.to}
            className={linkClasses}
            onClick={() => setMobileOpen(false)}>
            
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            </li>
        )}
        </ul>
      </nav>

      {/* Version */}
      <div className="px-5 py-4 border-t border-ibm-gray-80">
        <span className="text-[11px] font-mono text-ibm-gray-50">v1.0.0</span>
      </div>
    </div>;

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden flex items-center justify-center w-10 h-10 rounded bg-ibm-gray-100 text-white shadow-lg"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu">
        
        <MenuIcon className="w-5 h-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-64 md:flex-shrink-0 bg-ibm-gray-100 h-full fixed left-0 top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen &&
        <>
            <motion.div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            onClick={() => setMobileOpen(false)}
            aria-hidden="true" />
          
            <motion.aside
            className="fixed left-0 top-0 bottom-0 w-64 bg-ibm-gray-100 z-50 md:hidden"
            initial={{
              x: -256
            }}
            animate={{
              x: 0
            }}
            exit={{
              x: -256
            }}
            transition={{
              type: 'spring',
              damping: 30,
              stiffness: 300
            }}>
            
              <button
              className="absolute top-4 right-4 text-ibm-gray-50 hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close navigation menu">
              
                <XIcon className="w-5 h-5" />
              </button>
              {sidebarContent}
            </motion.aside>
          </>
        }
      </AnimatePresence>
    </>);

}