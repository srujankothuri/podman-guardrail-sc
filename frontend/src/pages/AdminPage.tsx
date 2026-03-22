import React from 'react';
import { PolicyUpload } from '../components/PolicyUpload';
import { AuditTable } from '../components/AuditTable';
export function AdminPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex-shrink-0 bg-white border-b border-ibm-gray-20 px-6 py-4">
        <h1 className="text-xl font-semibold text-ibm-gray-100">
          Admin Dashboard
        </h1>
        <p className="text-sm text-ibm-gray-70 mt-0.5">
          Manage policies and monitor compliance events
        </p>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <PolicyUpload />
        <AuditTable />
      </div>
    </div>);

}