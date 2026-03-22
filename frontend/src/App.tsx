import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { ChatPage } from './pages/ChatPage';
import { AdminPage } from './pages/AdminPage';
export function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen w-full bg-ibm-gray-10">
        <Sidebar />
        {/* Main content area — offset for sidebar on desktop */}
        <main className="flex-1 md:ml-64 min-h-0 flex flex-col">
          <Routes>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>);

}