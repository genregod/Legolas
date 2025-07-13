import { useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  uploadedFile: File | null;
  onRemoveFile: () => void;
  className?: string;
}

export default function FileUpload({ 
  onFileSelect, 
  uploadedFile, 
  onRemoveFile, 
  className = "" 
}: FileUploadProps) {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        onFileSelect(file);
      }
    }
  }, [onFileSelect]);

  const isValidFileType = (file: File) => {
    // Accept any file type - AI will process it
    return true;
  };

  const triggerFileInput = () => {
    const input = document.getElementById('file-input') as HTMLInputElement;
    input?.click();
  };

  if (uploadedFile) {
    return (
      <div className={`p-6 bg-gray-50 rounded-lg ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-red-500 mr-3" />
            <div>
              <div className="font-medium text-gray-900">{uploadedFile.name}</div>
              <div className="text-sm text-gray-500">
                {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemoveFile}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-primary transition-colors cursor-pointer"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={triggerFileInput}
      >
        <div className="mb-4">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Drag and drop any file here
          </h3>
          <p className="text-gray-600 mb-4">or click to browse files</p>
          <p className="text-sm text-gray-500">
            Accepts any file type - PDF, DOC, TXT, RTF, or even photos from your phone (up to 50MB)
          </p>
        </div>
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept="*/*"
          onChange={handleFileInputChange}
        />
      </div>
    </div>
  );
}
