// SyncHarmony.jsx
import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, X, FileSpreadsheet, Wifi } from 'lucide-react';
import { Card, CardHeader, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Progress } from './components/ui/progress';
import { Alert, AlertDescription } from './components/ui/alert';
import { useNavigate } from 'react-router-dom';
import * as pd from 'pandas-js';

const FileCard = ({ file, progress, onRemove }) => (
  <div className="w-full p-4 bg-slate-900/50 rounded-lg border border-white/5 hover:bg-slate-900/80 transition-colors">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-400/10 rounded-lg">
          <FileSpreadsheet className="h-5 w-5 text-green-400" />
        </div>
        <div className="flex-1">
          <span className="text-white/90 text-sm font-medium truncate block">
            {file.name}
          </span>
          <span className="text-blue-200/40 text-xs">
            {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(file)}
          className="text-white/40 hover:text-red-400 hover:bg-red-400/10"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
      {progress !== undefined && (
        <Progress 
          value={progress}
          className="mt-2 bg-slate-950/50"
        />
      )}
    </div>
  </div>
);

const UploadZone = ({ onFileSelect, isDragging }) => (
  <div
    className={`
      relative border-2 border-dashed rounded-xl p-8
      transition-colors
      ${isDragging ? 'border-yellow-400 bg-yellow-400/10' : 'border-white/10 hover:border-white/20'}
    `}
  >
    <input
      type="file"
      multiple
      accept=".xlsx,.xls,.csv"
      onChange={onFileSelect}
      className="hidden"
      id="file-upload"
    />
    <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center gap-4">
      <div className="p-4 bg-blue-400/10 rounded-full">
        <Upload className="h-12 w-12 text-blue-400" />
      </div>
      <div className="space-y-2 text-center">
        <p className="text-white/90 text-lg font-medium">
          Drop your Excel files here
        </p>
        <p className="text-blue-200/70 text-sm">
          or click to browse
        </p>
        <p className="text-blue-200/40 text-xs">
          Supports: .xlsx, .xls, .csv
        </p>
      </div>
    </label>
  </div>
);

const ExtractData = () => {

  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [fileProgress, setFileProgress] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const simulateFileUpload = (file) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setFileProgress(prev => ({
        ...prev,
        [file.name]: progress
      }));
      
      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const handleFileUpload = (event) => {
    const newFiles = Array.from(event.target.files);
    const invalidFiles = newFiles.filter(file => !file.name.match(/\.(xlsx|xls|csv)$/));
    
    if (invalidFiles.length > 0) {
      setError('Please upload only Excel or CSV files.');
      return;
    }
    
    newFiles.forEach(file => {
      simulateFileUpload(file);
    });
    
    setFiles(prev => [...prev, ...newFiles]);
    setError('');
  };

  const removeFile = (fileToRemove) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
    setFileProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileToRemove.name];
      return newProgress;
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => file.name.match(/\.(xlsx|xls|csv)$/));
    
    if (validFiles.length !== droppedFiles.length) {
      setError('Some files were not accepted. Please upload only Excel or CSV files.');
    }
    
    validFiles.forEach(file => {
      simulateFileUpload(file);
    });
    
    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleConsolidation = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file to consolidate.');
      return;
    }
  
    setIsProcessing(true);
    try {
      const columnNamesByFile = {}; // Objeto para almacenar los nombres de columnas por archivo
      const datasets = {};
  
      // Utilizamos un loop para procesar los archivos de manera asíncrona
      const filePromises = files.map((file) => processFile(file, columnNamesByFile, datasets));
      
      // Esperamos a que todos los archivos sean procesados
      await Promise.all(filePromises);
  
      // Hacer la petición después de procesar todos los archivos
      const response = await fetch("https://demo-integracion-backend-131847764756.us-east1.run.app/extract-fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(columnNamesByFile),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch fields from the server');
      }
  
      const result = await response.json();
  
      // Navegar a la siguiente página con los datos procesados
      navigate('/page2', { state: { fields_by_files: columnNamesByFile, files_required: result, data_frames: datasets } });
  
      setError(''); // Limpiar errores
    } catch (err) {
      console.error(err);
      setError('An error occurred during file processing.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Función separada para procesar cada archivo
  const processFile = (file, columnNamesByFile, datasets) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
  
      fileReader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0]; // Usamos solo la primera hoja
          const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  
          if (sheetData.length > 0) {
            columnNamesByFile[file.name] = sheetData[0]; // La primera fila son los nombres de las columnas
            const df = new pd.DataFrame(sheetData.slice(1), { columns: sheetData[0] });
            datasets[file.name] = df.to_json({ orient: 'records' });
          } else {
            columnNamesByFile[file.name] = []; // Archivo vacío
            datasets[file.name] = new pd.DataFrame([]); // DataFrame vacío
          }
  
          resolve();
        } catch (error) {
          reject(error); // En caso de error, rechazamos la promesa
        }
      };
  
      fileReader.onerror = () => reject(fileReader.error); // En caso de error en el FileReader, rechazamos la promesa
      fileReader.readAsArrayBuffer(file); // Leemos el archivo como ArrayBuffer
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 rounded-full filter blur-[128px] opacity-5" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-400 rounded-full filter blur-[128px] opacity-5" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-green-400 rounded-full filter blur-[128px] opacity-5" />
      </div>

      {/* Main Card */}
      <Card className="max-w-2xl mx-auto bg-slate-950/50 backdrop-blur-xl border-t border-l border-white/5">
        <CardHeader className="flex items-center gap-3">
          <div className="p-2 bg-yellow-400/10 rounded-full">
            <Wifi className="h-6 w-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 via-blue-400 to-green-400">
              Sync Harmony
            </h1>
            <p className="text-blue-200/70 text-sm">
              Intelligent Excel Data Consolidation
            </p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
              <AlertDescription className="text-red-200">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <UploadZone 
              onFileSelect={handleFileUpload}
              isDragging={isDragging}
            />
          </div>

          {/* File List */}
          <div className="space-y-3">
            {files.map((file, index) => (
              <FileCard
                key={index}
                file={file}
                progress={fileProgress[file.name]}
                onRemove={removeFile}
              />
            ))}
          </div>

          {/* Action Button */}
          {files.length > 0 && (
            <Button
              size="lg"
              disabled={isProcessing}
              onClick={handleConsolidation}
              className="w-full h-12 bg-gradient-to-r from-yellow-400 via-blue-400 to-green-400 text-black font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : `Harmonize ${files.length} ${files.length === 1 ? 'File' : 'Files'}`}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExtractData;
