import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onUpload: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onUpload, isProcessing }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    inputRef.current?.click();
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <div
        className={`relative group flex flex-col items-center justify-center w-full h-64 rounded-3xl border-2 border-dashed transition-all duration-300 ease-in-out
          ${dragActive 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-slate-50'
          }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleChange}
          disabled={isProcessing}
        />
        
        <div className="flex flex-col items-center text-center p-6 space-y-4">
          <div className={`p-4 rounded-full ${dragActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400 group-hover:text-blue-500 group-hover:bg-blue-50'} transition-colors`}>
            {isProcessing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            ) : (
              <FileSpreadsheet size={32} />
            )}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-700">
              {isProcessing ? 'Processing CSV...' : 'Upload your leads CSV'}
            </h3>
            <p className="text-sm text-slate-500 max-w-xs">
              Drag and drop your file here, or click to browse. 
              <br/>Supported format: .csv
            </p>
          </div>

          <button
            onClick={onButtonClick}
            disabled={isProcessing}
            className="px-6 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all disabled:opacity-50"
          >
            Select File
          </button>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Tips for best results:</p>
          <ul className="list-disc pl-4 space-y-1 text-blue-700/80">
            <li>Ensure file has headers (Name, Email, utm_source, etc).</li>
            <li>Supports standard CSV comma or semicolon delimiters.</li>
            <li>Automatic detection of Paid, Organic, and Direct traffic.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};