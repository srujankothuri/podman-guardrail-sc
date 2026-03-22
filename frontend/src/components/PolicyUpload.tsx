import React, { useEffect, useState, useRef } from 'react';
import {
  UploadIcon,
  FileTextIcon,
  LoaderIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon } from
'lucide-react';
import { uploadPolicy, getCurrentPolicy, PolicyInfo } from '../lib/api';
export function PolicyUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [policy, setPolicy] = useState<PolicyInfo | null>(null);
  const [policyLoading, setPolicyLoading] = useState(true);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fetchPolicy = async () => {
    setPolicyLoading(true);
    setPolicyError(null);
    try {
      const data = await getCurrentPolicy();
      setPolicy(data);
    } catch (err) {
      setPolicyError(
        err instanceof Error ? err.message : 'Failed to load policy'
      );
    } finally {
      setPolicyLoading(false);
    }
  };
  useEffect(() => {
    fetchPolicy();
  }, []);
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadMessage(null);
  };
  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadMessage(null);
    try {
      await uploadPolicy(selectedFile);
      setUploadMessage({
        type: 'success',
        text: 'Policy uploaded successfully.'
      });
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchPolicy();
    } catch (err) {
      setUploadMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Upload failed.'
      });
    } finally {
      setUploading(false);
    }
  };
  return (
    <section
      className="bg-white rounded border border-ibm-gray-20 shadow-sm"
      aria-labelledby="policy-heading">
      
      <div className="px-6 py-5 border-b border-ibm-gray-20">
        <h2
          id="policy-heading"
          className="text-lg font-semibold text-ibm-gray-100">
          
          HR Policy Management
        </h2>
        <p className="text-sm text-ibm-gray-70 mt-1">
          Upload and manage company compliance policies
        </p>
      </div>

      <div className="p-6 space-y-6">
        {/* Current policy info */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ibm-gray-50 mb-3">
            Active Policy
          </h3>
          {policyLoading ?
          <div className="flex items-center gap-2 text-sm text-ibm-gray-50">
              <LoaderIcon className="w-4 h-4 animate-spin" />
              Loading policy info...
            </div> :
          policyError ?
          <div className="flex items-center gap-2 text-sm text-ibm-red-60">
              <AlertCircleIcon className="w-4 h-4" />
              {policyError}
            </div> :
          policy ?
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-ibm-gray-10 rounded px-4 py-3">
                <p className="text-xs text-ibm-gray-50 mb-1">Version</p>
                <p className="text-sm font-semibold font-mono text-ibm-gray-100">
                  {policy.version}
                </p>
              </div>
              <div className="bg-ibm-gray-10 rounded px-4 py-3">
                <p className="text-xs text-ibm-gray-50 mb-1">Rules Count</p>
                <p className="text-sm font-semibold font-mono text-ibm-gray-100">
                  {policy.rules_count}
                </p>
              </div>
              <div className="bg-ibm-gray-10 rounded px-4 py-3">
                <p className="text-xs text-ibm-gray-50 mb-1">Last Updated</p>
                <p className="text-sm font-semibold font-mono text-ibm-gray-100">
                  {new Date(policy.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
                </p>
              </div>
            </div> :

          <div className="flex items-center gap-2 text-sm text-ibm-gray-50">
              <InfoIcon className="w-4 h-4" />
              No active policy found.
            </div>
          }
        </div>

        {/* Upload section */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ibm-gray-50 mb-3">
            Upload New Policy
          </h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
            <div className="flex-1 w-full">
              <label
                htmlFor="policy-file"
                className="block text-sm text-ibm-gray-70 mb-1.5">
                
                Select a .txt policy file
              </label>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  id="policy-file"
                  type="file"
                  accept=".txt"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-ibm-gray-70 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-ibm-gray-10 file:text-ibm-gray-100 file:cursor-pointer hover:file:bg-ibm-gray-20 file:transition-colors cursor-pointer border border-ibm-gray-20 rounded py-1.5 px-3" />
                
              </div>
              {selectedFile &&
              <p className="flex items-center gap-1.5 mt-2 text-xs text-ibm-gray-70">
                  <FileTextIcon className="w-3.5 h-3.5" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)}{' '}
                  KB)
                </p>
              }
            </div>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-ibm-blue-60 text-white text-sm font-medium rounded hover:bg-ibm-blue-70 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              aria-label="Upload policy file">
              
              {uploading ?
              <LoaderIcon className="w-4 h-4 animate-spin" /> :

              <UploadIcon className="w-4 h-4" />
              }
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>

          {/* Upload feedback */}
          {uploadMessage &&
          <div
            className={`flex items-center gap-2 mt-3 px-3 py-2 rounded text-sm ${uploadMessage.type === 'success' ? 'bg-ibm-green-bg text-ibm-green-60' : 'bg-ibm-red-bg text-ibm-red-60'}`}
            role="alert">
            
              {uploadMessage.type === 'success' ?
            <CheckCircleIcon className="w-4 h-4 flex-shrink-0" /> :

            <AlertCircleIcon className="w-4 h-4 flex-shrink-0" />
            }
              {uploadMessage.text}
            </div>
          }
        </div>
      </div>
    </section>);

}