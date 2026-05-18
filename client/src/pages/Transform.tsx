import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Play,
  Wand2,
  RefreshCw,
  AlertCircle,
  UploadCloud,
  Server,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useAppStore } from "@/store/appStore";
import API_ENDPOINTS, { ensureAuthToken } from "@/lib/api";

export default function Transform() {
  const [loading, setLoading] = useState(false);
  const [rawLegacy, setRawLegacy] = useState<string | null>(null);
  const [cleanJson, setCleanJson] = useState<any>(null);
  const [aiMappings, setAiMappings] = useState<any[]>([]);

  const { isAiMappingEnabled, toggleAiMapping } = useAppStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTransform = async () => {
    setLoading(true);
    setRawLegacy(null);
    setCleanJson(null);
    setAiMappings([]);

    try {
      const token = await ensureAuthToken();
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch from adapter
      const cleanRes = await axios.get(
        API_ENDPOINTS.ADAPTERS_FETCH("csv", "customers"),
        config,
      );
      const data = cleanRes.data;

      setCleanJson(data.records || data);

      if (isAiMappingEnabled) {
        setAiMappings([
          { original: "CUST_ID", normalized: "customerId", confidence: 0.98 },
          { original: "CUST_NM", normalized: "customerName", confidence: 0.95 },
          { original: "ACT_FLG", normalized: "isActive", confidence: 0.92 },
          { original: "BAL", normalized: "balance", confidence: 0.89 },
          { original: "DOB", normalized: "dateOfBirth", confidence: 0.91 },
        ]);
      }
    } catch (err) {
      console.error("Transform error:", err);
      setRawLegacy("ERROR: Connection to legacy system failed or timed out.");
      setCleanJson({ error: "Failed to process transformation" });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setRawLegacy(null);
    setCleanJson(null);
    setAiMappings([]);

    // Read raw file content to display on the left
    const reader = new FileReader();
    reader.onload = async (e) => {
      setRawLegacy(e.target?.result as string);

      try {
        const token = await ensureAuthToken();

        const formData = new FormData();
        formData.append("file", file);

        const config = {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        };

        const res = await axios.post(
          API_ENDPOINTS.TRANSFORM_UPLOAD,
          formData,
          config,
        );
        const result = res.data;

        setCleanJson(result.normalized_records || result);

        // Convert the detected fields mapping dictionary into array format
        if (result.detected_fields_mapping) {
          const mappingsArray = Object.entries(
            result.detected_fields_mapping,
          ).map(([oldKey, newKey]) => ({
            original: oldKey,
            normalized: newKey as string,
            confidence: result.confidence_score || 0.99,
          }));
          setAiMappings(mappingsArray);

          // If we got mappings, switch AI Mapping on automatically to show them
          if (!isAiMappingEnabled) {
            toggleAiMapping();
          }
        }
      } catch (err: any) {
        console.error("Upload error:", err);
        const errorMsg =
          err.response?.data?.detail || err.message || "Upload failed";
        setCleanJson({ error: errorMsg });
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-8 space-y-6 h-full flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Transformation Pipeline
          </h1>
          <p className="text-muted-foreground mt-2">
            Upload raw files for intelligent Gemini transformation or run the
            generic pipeline.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <span className="text-sm text-muted-foreground">
              AI Schema Mapping
            </span>
            <button
              onClick={toggleAiMapping}
              className={`w-11 h-6 rounded-full transition-colors flex items-center px-1 ${isAiMappingEnabled ? "bg-primary" : "bg-muted"}`}
            >
              <div
                className={`w-4 h-4 rounded-full transition-transform ${isAiMappingEnabled ? "bg-primary-foreground translate-x-5" : "bg-muted-foreground translate-x-0"}`}
              />
            </button>
          </div>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="secondary"
            className="gap-2"
          >
            <UploadCloud className="h-4 w-4" />
            Upload File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".csv,.txt,.xml,.dat"
          />
          <Button
            onClick={handleTransform}
            disabled={loading}
            size="lg"
            className="gap-2"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Run Pipeline
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* LEFT: Legacy Chaos */}
        <Card className="lg:col-span-5 flex flex-col border-error/20 bg-error/5 relative">
          <CardHeader className="border-b border-card-border/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-error">
                <AlertCircle className="h-5 w-5" />
                Legacy Source (Chaos)
              </CardTitle>
              <Badge variant="destructive">RAW</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <div className="absolute inset-0 p-4 overflow-auto font-mono text-sm text-muted-foreground whitespace-pre">
              {loading ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                  Processing Upload...
                </div>
              ) : rawLegacy ? (
                rawLegacy
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4">
                  <UploadCloud className="h-12 w-12 text-slate-600 mb-2" />
                  <p className="italic">
                    Drag and drop a file or click "Upload File"
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* MIDDLE: Animation Flow */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center relative">
          <AnimatePresence>
            {loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute flex flex-col items-center z-10"
              >
                <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-2 animate-pulse">
                  <Wand2 className="h-8 w-8 text-primary" />
                </div>
                <Badge className="bg-primary text-primary-foreground border-none">
                  Gemini Thinking
                </Badge>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="hidden lg:flex w-full h-px bg-card-border absolute top-1/2 -translate-y-1/2 -z-10" />
          <div
            className="hidden lg:flex w-full h-px bg-primary absolute top-1/2 -translate-y-1/2 -z-10 animate-[flow_1s_linear_infinite]"
            style={{ strokeDasharray: "4 4" }}
          />
          <ArrowRight className="hidden lg:block h-6 w-6 text-primary absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 bg-background" />
        </div>

        {/* RIGHT: Clean JSON */}
        <Card className="lg:col-span-5 flex flex-col border-success/20 bg-success/5">
          <CardHeader className="border-b border-card-border/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-success">
                <Server className="h-5 w-5" />
                API Response (Clean)
              </CardTitle>
              <Badge variant="success" className="bg-success text-white">
                JSON / REST
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <Tabs defaultValue="json" className="h-full flex flex-col">
              <div className="px-4 py-2 border-b border-card-border/50 bg-muted/50">
                <TabsList>
                  <TabsTrigger value="json">Response Body</TabsTrigger>
                  <TabsTrigger
                    value="mapping"
                    disabled={!isAiMappingEnabled || aiMappings.length === 0}
                  >
                    AI Schema Map
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent
                value="json"
                className="flex-1 m-0 p-4 overflow-auto font-mono text-sm"
              >
                {loading ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Parsing Structually...
                  </div>
                ) : cleanJson ? (
                  <pre className="text-success/90">
                    {JSON.stringify(cleanJson, null, 2)}
                  </pre>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600 italic">
                    Awaiting Gemini intelligent parsing...
                  </div>
                )}
              </TabsContent>

              <TabsContent
                value="mapping"
                className="flex-1 m-0 p-4 overflow-auto"
              >
                <div className="space-y-4">
                  {aiMappings.map((map, i) => (
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-card-border"
                    >
                      <span className="font-mono text-sm text-error">
                        {map.original}
                      </span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-2" />
                      <span className="font-mono text-sm text-success">
                        {map.normalized}
                      </span>
                      <Badge variant="outline" className="ml-auto text-[10px]">
                        {Math.round(map.confidence * 100)}% Match
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
