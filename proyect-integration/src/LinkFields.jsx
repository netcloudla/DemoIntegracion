// SyncHarmony.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { Progress } from './components/ui/progress';
import { Badge } from './components/ui/badge';
import { ToastContainer, toast } from "react-toastify";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from './components/ui/tooltip';
import { 
  Undo2, HelpCircle, CheckCircle, ArrowLeftRight, 
  File, ArrowRight, Sparkles, Table, Cpu
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';

const SyncHarmony = () => {
  const [activeFile, setActiveFile] = useState('file1');
  const [matches, setMatches] = useState({});
  const [draggedField, setDraggedField] = useState(null);
  const navigate = useNavigate();
  const [mergedData, setMergedData] = useState(null);
  const location = useLocation();
  const { fields_by_files, files_required, data_frames } = location.state || {};

  // Generar estructura de archivos
  const files = Object.keys(fields_by_files).reduce((acc, fileName, index) => {
    const fileKey = `file${index + 1}`;
    const fields = fields_by_files[fileName].map((field, fieldIndex) => ({
      id: `f${index + 1}_${fieldIndex + 1}`,
      name: field,
      type: "string",
    }));
  
    acc[fileKey] = {
      name: fileName,
      fields,
      requiredFields: fields.map((_, i) => `r${i + 1}`),
    };
  
    return acc;
  }, {});

  // Generar campos requeridos
  const requiredFields = files_required.data.map((item, index) => ({
    id: `r${index + 1}`,
    name: item.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
    required: true
  }));

  // Función para obtener el nombre real del campo basado en su ID
  const getFieldNameById = useCallback((fieldId) => {
    const fileIndex = parseInt(fieldId.charAt(1)) - 1;
    const fieldIndex = parseInt(fieldId.split('_')[1]) - 1;
    const fileName = Object.keys(fields_by_files)[fileIndex];
    return fields_by_files[fileName][fieldIndex];
  }, [fields_by_files]);

  // Función para obtener el nombre requerido basado en su ID
  const getRequiredFieldNameById = useCallback((requiredId) => {
    const index = parseInt(requiredId.slice(1)) - 1;
    return files_required.data[index];
  }, [files_required]);

  // Estado de completitud de archivos
  const fileCompletionStatus = useMemo(() => {
    const status = {};
    Object.entries(files).forEach(([fileKey, file]) => {
      const fileMatches = Object.entries(matches)
        .filter(([fieldId]) => fieldId.startsWith(fileKey.slice(-1)))
        .map(([, requiredFieldId]) => requiredFieldId);
      
      const requiredFieldsForFile = new Set(file.requiredFields);
      const matchedRequiredFields = new Set(fileMatches.filter(id => requiredFieldsForFile.has(id)));
      
      status[fileKey] = {
        total: requiredFieldsForFile.size,
        matched: matchedRequiredFields.size,
        isComplete: matchedRequiredFields.size === requiredFieldsForFile.size
      };
    });
    return status;
  }, [matches, files]);

  // Calcular campos totales requeridos
  const totalRequiredFields = useMemo(() => {
    return Object.values(files).reduce((total, file) => total + file.requiredFields.length, 0);
  }, [files]);

  // Calcular campos totales emparejados
  const totalMatchedFields = useMemo(() => {
    const uniqueMatches = new Set();
    Object.entries(matches).forEach(([fieldId, requiredId]) => {
      const fileKey = `file${fieldId.charAt(1)}`;
      if (files[fileKey].requiredFields.includes(requiredId)) {
        uniqueMatches.add(`${fileKey}-${requiredId}`);
      }
    });
    return uniqueMatches.size;
  }, [matches, files]);


  const identifyBaseFile = (files, matches) => {
    // Crear un mapa de puntajes para cada archivo
    const fileScores = {};
    
    Object.entries(files).forEach(([fileKey, fileInfo]) => {
      const fileName = fileInfo.name;
      fileScores[fileName] = {
        matchCount: 0,        // Número de matches con otros archivos
        joinKeys: 0,          // Número de campos que sirven como llaves de join
        referencedBy: 0,      // Número de veces que otros archivos se refieren a este
        fieldCount: fileInfo.fields.length  // Número total de campos
      };
      
      // Contar matches y llaves de join
      fileInfo.fields.forEach(field => {
        if (matches[field.id]) {
          fileScores[fileName].matchCount++;
          
          // Verificar si este campo es referenciado por otros archivos
          Object.entries(files).forEach(([otherKey, otherFile]) => {
            if (otherKey !== fileKey) {
              otherFile.fields.forEach(otherField => {
                if (matches[otherField.id] === matches[field.id]) {
                  fileScores[fileName].joinKeys++;
                }
              });
            }
          });
        }
      });
    });
    
    // Calcular cuántas veces cada archivo es referenciado
    Object.values(files).forEach(fileInfo => {
      fileInfo.fields.forEach(field => {
        if (matches[field.id]) {
          const matchValue = matches[field.id];
          Object.entries(files).forEach(([otherKey, otherFile]) => {
            otherFile.fields.forEach(otherField => {
              if (matches[otherField.id] === matchValue && otherFile.name !== fileInfo.name) {
                fileScores[fileInfo.name].referencedBy++;
              }
            });
          });
        }
      });
    });
    
    // Calcular puntaje final para cada archivo
    const finalScores = Object.entries(fileScores).map(([fileName, scores]) => {
      const score = (
        scores.matchCount * 2 +      // Peso mayor para matches
        scores.joinKeys * 3 +        // Peso mayor para llaves de join
        scores.referencedBy * 2 +    // Peso mayor para referencias
        scores.fieldCount            // Peso menor para cantidad de campos
      );
      
      return {
        fileName,
        score,
        metrics: scores
      };
    });
    
    // Ordenar por puntaje y obtener el archivo con mayor puntaje
    finalScores.sort((a, b) => b.score - a.score);
    
    console.log('File Scores:', finalScores); // Para debugging
    
    return finalScores[0].fileName;
  };

  const handleCreateTable  = async () => {
    
    try {
      const response = await fetch("https://demo-integracion-backend-131847764756.us-east1.run.app/transform-fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(mergedData)
      });
  
      const data = await response.json();
      console.log("Respuesta del servidor:", data);
      const fields = JSON.stringify(files_required.data)
      navigate('/page3', { state: { campos: fields } });
      toast.success("¡Información subida correctamente!");
    } catch (error) {
      setTimeout(() => {
        toast.error("❌ Error al subir la información");
      }, 10);
      console.error("Error enviando los datos:", error);
    }
  }

  // Función para consolidar los datos
  const handleConsolidateData = useCallback(() => {
    const dfDict = {};
    Object.entries(data_frames).forEach(([fileName, data]) => {
      // Obtener la estructura de campos para este archivo
      const fileKey = Object.keys(files).find(k => files[k].name === fileName);
      const fieldIds = files[fileKey].fields.map(field => field.id);
      
      // Crear DataFrame con los IDs de campos como nombres de columnas
      dfDict[fileName] = data.map(row => {
        const newRow = {};
        Object.entries(row).forEach(([index, value]) => {
          newRow[fieldIds[parseInt(index)]] = value;
        });
        return newRow;
      });
    });

    // Crear mapeo inverso de matches
    const inverseMatches = {};
    Object.entries(files).forEach(([fileKey, fileInfo]) => {
      fileInfo.fields.forEach(field => {
        if (matches[field.id]) {
          inverseMatches[matches[field.id]] = {
            fileName: fileInfo.name,
            fieldId: field.id
          };
        }
      });
    });

    // Identificar el archivo base (Ventas)
    //const baseFile = files.file3.name;
    const baseFile = identifyBaseFile(files, matches);
    console.log('Selected base file:', baseFile);
    let resultDf = [...dfDict[baseFile]];

    // Realizar los joins necesarios
    Object.entries(dfDict).forEach(([fileName, df]) => {
      if (fileName !== baseFile) {
        const fileKey = Object.keys(files).find(k => files[k].name === fileName);
        const baseFileKey = Object.keys(files).find(k => files[k].name === baseFile);

        // Identificar columnas para join
        const joinKeys = [];
        files[fileKey].fields.forEach(field => {
          if (matches[field.id]) {
            const requiredId = matches[field.id];
            files[baseFileKey].fields.forEach(baseField => {
              if (matches[baseField.id] === requiredId) {
                joinKeys.push([baseField.id, field.id]);
              }
            });
          }
        });

        if (joinKeys.length > 0) {
          // Realizar merge
          resultDf = resultDf.map(baseRow => {
            const matchingRow = df.find(dataRow => 
              joinKeys.every(([leftKey, rightKey]) => 
                String(baseRow[leftKey]) === String(dataRow[rightKey])
              )
            );
            return { ...baseRow, ...(matchingRow || {}) };
          });
        }
      }
    });

    // Preparar las columnas finales
    const finalColumns = {};
    requiredFields.forEach(field => {
      if (inverseMatches[field.id]) {
        const sourceFieldId = Object.entries(matches).find(
          ([fieldId, reqId]) => reqId === field.id
        )?.[0];
        if (sourceFieldId) {
          finalColumns[sourceFieldId] = field.name;
        }
      }
    });

    // Seleccionar y renombrar las columnas
    const finalResult = resultDf.map(row => {
      const newRow = {};
      Object.entries(finalColumns).forEach(([oldKey, newKey]) => {
        newRow[newKey] = row[oldKey];
      });
      return newRow;
    });

    console.log("finalResult", finalResult)
    console.log("files_required", files_required)
    
    setMergedData(finalResult)

    return finalResult;
  }, [data_frames, matches, fields_by_files, getFieldNameById, getRequiredFieldNameById]);

  const progress = (totalMatchedFields / totalRequiredFields) * 100;

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
        {/* Glowing Background Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-yellow-300 via-blue-400 to-green-400 rounded-full filter blur-[120px] opacity-20" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-blue-500 via-green-400 to-yellow-300 rounded-full filter blur-[120px] opacity-20" />
        </div>

        {/* Header */}
        <div className="flex justify-between items-center mb-8 z-10 relative">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-yellow-400/20 to-blue-500/20 rounded-2xl border border-white/20 shadow-xl backdrop-blur-xl">
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 via-blue-400 to-green-400">
                Sync Harmony
                <span className="text-base ml-2 text-blue-400 font-normal">AI</span>
              </h1>
              <p className="text-blue-200/70">Intelligent Field Mapping</p>
            </div>
            
          </div>

          <Button
            variant="ghost"
            className="bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 border border-blue-500/20"
            onClick={handleCreateTable}
            disabled={Object.keys(matches).length === 0}
          >
            <Table className="w-4 h-4 mr-2" />
            Create Table
          </Button>
          
          <Card className="bg-slate-900/50 backdrop-blur-xl border-white/10">
          
            <CardContent className="flex items-center gap-4 p-3">
              <Progress 
                value={progress} 
                className="w-44 h-2 bg-slate-700"
                indicatorclassname="bg-gradient-to-r from-yellow-400 via-blue-400 to-green-400"
              />
              <Badge className="bg-blue-500/20 text-blue-300 font-medium">
                {Math.round(progress)}% Mapped
              </Badge>
            </CardContent>
          </Card>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />

        {/* Main Content */}
        <div className="flex gap-6 z-10 relative">
          {/* Source Panel */}
          <Card className="flex-1 bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl">
            <Tabs defaultValue="file1" className="w-full">
              <TabsList className="w-full bg-slate-800/50 p-1">
                {Object.entries(files).map(([key, file]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    onClick={() => setActiveFile(key)}
                    className="flex items-center gap-2 px-4 py-2 relative data-[state=active]:bg-blue-500/20"
                  >
                    <File className="w-4 h-4 text-blue-400" />
                    <span className="text-blue-100">{file.name}</span>
                    {fileCompletionStatus[key].isComplete && (
                      <Badge className="ml-2 bg-green-500/20 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                      </Badge>
                    )}
                    <Badge className="ml-1 bg-blue-500/20 text-blue-300">
                      {fileCompletionStatus[key].matched}/{fileCompletionStatus[key].total}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="p-4">
                {Object.entries(files).map(([key, file]) => (
                  <TabsContent key={key} value={key}>
                    <div className="space-y-3">
                      {file.fields.map(field => (
                        <div
                          key={field.id}
                          draggable
                          onDragStart={() => setDraggedField(field)}
                          className={`p-4 rounded-xl border transition-all cursor-move
                            ${matches[field.id]
                              ? 'bg-blue-500/10 border-blue-500/50'
                              : 'hover:bg-slate-800/50 border-white/10 bg-slate-900/50'
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-white">{field.name}</span>
                              <Badge className="bg-yellow-500/20 text-yellow-300">
                                {field.type}
                              </Badge>
                            </div>
                            {matches[field.id] && (
                              <div className="flex items-center gap-2 text-sm text-blue-300">
                                <ArrowRight className="w-4 h-4" />
                                <span>{requiredFields.find(rf => rf.id === matches[field.id])?.name}</span>
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </Card>

          {/* Center Connection */}
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-xl">
              <ArrowLeftRight className="w-6 h-6 text-blue-400" />
            </div>
            <div className="h-32 w-0.5 bg-gradient-to-b from-blue-400 to-transparent" />
          </div>

          {/* Target Panel */}
          <Card className="flex-1 bg-slate-900/50 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-blue-300">Required Fields</h2>
                <Badge className="bg-blue-500/20 text-blue-300">
                  {Object.values(fileCompletionStatus).filter(s => s.isComplete).length}/
                  {Object.keys(files).length} Files Complete
                </Badge>
              </div>
              <div className="space-y-3">
                {requiredFields.map(field => (
                  <div
                    key={field.id}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (draggedField) {
                        setMatches(prev => ({...prev, [draggedField.id]: field.id}));
                        setDraggedField(null);
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all
                      ${Object.values(matches).includes(field.id)
                        ? 'bg-blue-500/10 border-blue-500/50'
                        : 'border-white/10 bg-slate-900/50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-white">{field.name}</span>
                        <Badge className="bg-red-500/20 text-red-300">
                          Required
                        </Badge>
                      </div>
                      {Object.values(matches).includes(field.id) && (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between mt-6 z-10 relative">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/20"
              onClick={() => {
                setMatches({});
                setMergedData(null);
              }}
            >
              <Undo2 className="w-4 h-4 mr-2" />
              Reset Mapping
            </Button>
            
            <Button
              variant="ghost"
              className="bg-green-500/10 text-green-300 hover:bg-green-500/20 border border-green-500/20"
              onClick={handleConsolidateData}
              disabled={Object.keys(matches).length === 0}
            >
              <Table className="w-4 h-4 mr-2" />
              Consolidate Data
            </Button>

            
          </div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 border border-yellow-400/20"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-slate-900 border-white/10">
              <p className="text-blue-200">Drag fields to create matches</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Visualización de datos consolidados */}
        {mergedData && mergedData.length > 0 && (
          <Card className="mt-6 bg-slate-900/50 backdrop-blur-xl border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-blue-300 mb-4">Consolidated Data Preview</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-blue-200">
                  <thead className="text-xs uppercase bg-blue-500/10">
                    <tr>
                      {Object.keys(mergedData[0]).map((header) => (
                        <th key={header} className="px-6 py-3">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mergedData.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-b border-blue-500/10">
                        {Object.values(row).map((value, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4">{value}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-blue-300/70 mt-2">
                Showing {Math.min(5, mergedData.length)} of {mergedData.length} rows
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default SyncHarmony;