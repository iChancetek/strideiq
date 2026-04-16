"use client";

import { useState, useRef } from "react";
import { useActivities } from "@/hooks/useActivities";
import { uploadMediaFiles } from "@/lib/storage";
import { auth } from "@/lib/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import SpeechControls from "./SpeechControls";
import { useVoice } from "@/hooks/useVoice";
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function ManualActivityModal({ isOpen, onClose }: Props) {
    const { addActivity } = useActivities();
    const [loading, setLoading] = useState(false);

    const [title, setTitle] = useState("");
    const [type, setType] = useState<"Run" | "Walk" | "Bike" | "Hike" | "Meditation">("Run");
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [time, setTime] = useState("12:00");
    const [distance, setDistance] = useState("0");
    const [hours, setHours] = useState("0");
    const [minutes, setMinutes] = useState("0");
    const [seconds, setSeconds] = useState("0");
    const [notes, setNotes] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user] = useAuthState(auth);
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
    const [drafts, setDrafts] = useState<any[]>([]);
    const scanInputRef = useRef<HTMLInputElement>(null);

    // Voice
    const { isRecording, isTranscribing, startRecording, stopRecording } = useVoice();

    const [calories, setCalories] = useState("0");
    const [steps, setSteps] = useState("0");
    const [elevation, setElevation] = useState("0");

    // Real-time Pace Calculation
    const getPaceStr = () => {
        const d = parseFloat(distance) || 0;
        const h = parseInt(hours) || 0;
        const m = parseInt(minutes) || 0;
        const s = parseInt(seconds) || 0;
        const totalSec = h * 3600 + m * 60 + s;
        
        if (d <= 0 || totalSec <= 0) return "--:--";
        const paceSecPerMile = totalSec / d;
        const paceM = Math.floor(paceSecPerMile / 60);
        const paceS = Math.floor(paceSecPerMile % 60);
        return `${paceM}'${paceS < 10 ? "0" : ""}${paceS}"/mi`;
    };

    const handleTranscription = async () => {
        const text = await stopRecording();
        if (text) setNotes((prev: string) => prev + (prev ? " " : "") + text);
    };

    if (!isOpen) return null;

    const rasterizePdf = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1); // Scan first page
        
        const viewport = page.getViewport({ scale: 2.0 }); // High res
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
            return canvas.toDataURL('image/jpeg', 0.8);
        }
        throw new Error("Canvas context failed");
    };

    const handleBatchScan = async (files: FileList) => {
        const fileArray = Array.from(files).slice(0, 20); // Cap at 20
        setIsScanning(true);
        setScanProgress({ current: 0, total: fileArray.length });

        const newDrafts = fileArray.map(f => ({
            id: Math.random().toString(36).substr(2, 9),
            file: f,
            status: 'pending',
            data: null,
            error: null
        }));

        setDrafts(prev => [...newDrafts, ...prev]);

        // Process in small batches of 5 for performance
        const batchSize = 5;
        for (let i = 0; i < fileArray.length; i += batchSize) {
            const currentBatch = newDrafts.slice(i, i + batchSize);
            await Promise.all(currentBatch.map(async (draft) => {
                try {
                    setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'scanning' } : d));
                    
                    const result = await performScan(draft.file);
                    
                    setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'complete', data: result } : d));
                    setScanProgress(prev => ({ ...prev, current: prev.current + 1 }));
                } catch (err: any) {
                    setDrafts(prev => prev.map(d => d.id === draft.id ? { ...d, status: 'error', error: err.message } : d));
                }
            }));
        }

        setIsScanning(false);
    };

    const performScan = async (file: File): Promise<any> => {
        const isJson = file.type === 'application/json' || file.name.endsWith('.json');
        const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
        
        let payload: any = {};
        
        if (isJson) {
            const text = await file.text();
            payload.jsonData = text;
        } else if (isPdf) {
            payload.image = await rasterizePdf(file);
        } else {
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(file);
            });
            payload.image = await base64Promise;
        }

        const res = await fetch("/api/ai/scan-activity", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);
        return data;
    };

    const applyDraft = (draft: any) => {
        const { data } = draft;
        if (!data) return;
        
        if (data.distance) setDistance(data.distance.toFixed(2));
        if (data.durationSeconds) {
            const h = Math.floor(data.durationSeconds / 3600);
            const m = Math.floor((data.durationSeconds % 3600) / 60);
            const s = Math.round(data.durationSeconds % 60);
            setHours(h.toString());
            setMinutes(m.toString());
            setSeconds(s.toString());
        }
        if (data.steps) setSteps(data.steps.toString());
        if (data.calories) setCalories(data.calories.toString());
        if (data.type) setType(data.type as any);
        if (data.title) setTitle(data.title);
        if (data.date) setDate(new Date(data.date).toISOString().split('T')[0]);
        
        // Remove from drafts once applied (or keep and mark applied)
        setDrafts(prev => prev.filter(d => d.id !== draft.id));
    };

    const handleSaveAll = async () => {
        setLoading(true);
        const readyDrafts = drafts.filter(d => d.status === 'complete');
        
        try {
            for (const draft of readyDrafts) {
                const data = draft.data;
                const activityDate = new Date(data.date || `${date}T${time}:00`);
                
                await addActivity({
                    title: data.title || `Imported ${data.type || 'Activity'}`,
                    type: data.type || type,
                    mode: (data.type || type).toLowerCase() as any,
                    distance: data.distance || 0,
                    duration: data.durationSeconds || 0,
                    date: activityDate,
                    calories: data.calories || 0,
                    steps: data.steps || 0,
                    notes: "Imported via IQ Scan.",
                    isPublic: true,
                    environment: "outdoor"
                });
            }
            setDrafts([]);
            onClose();
        } catch (e: any) {
            alert(`Batch save failed: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const h = parseInt(hours) || 0;
            const m = parseInt(minutes) || 0;
            const s = parseInt(seconds) || 0;
            const durationSeconds = h * 3600 + m * 60 + s;
            const distanceMiles = parseFloat(distance) || 0;
            const cal = parseInt(calories) || 0;
            const stepCount = parseInt(steps) || 0;
            const elev = parseInt(elevation) || 0;

            if (durationSeconds <= 0) {
                throw new Error("Duration must be greater than 0");
            }
            if (type !== "Meditation" && distanceMiles <= 0) {
                throw new Error("Distance must be greater than 0");
            }

            // Construct Date object
            const activityDate = new Date(`${date}T${time}:00`);

            // 1. Handle Media Uploads if any
            let mediaItems: any[] = [];
            if (selectedFiles.length > 0 && user) {
                mediaItems = await uploadMediaFiles(selectedFiles, user.uid);
            }

            await addActivity({
                title: title || `Manual ${type}`,
                type,
                mode: type.toLowerCase() as any,
                distance: distanceMiles,
                duration: durationSeconds,
                date: activityDate,
                calories: cal || Math.round(distanceMiles * 100), // Fallback to estimate
                steps: stepCount,
                elevation: elev,
                notes: notes,
                media: mediaItems,
                isPublic: true,
                environment: "outdoor"
            });

            onClose();
        } catch (e: any) {
            console.error("Save error:", e);
            alert(`Failed to save manual activity: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px"
        }}>
            <ScanStyles />
            <div className="glass-panel" style={{
                width: "100%",
                maxWidth: "500px",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "30px",
                borderRadius: "var(--radius-lg)",
                position: "relative"
            }}>
                <button
                    onClick={onClose}
                    disabled={loading}
                    style={{
                        position: "absolute",
                        top: "20px",
                        right: "20px",
                        background: "none",
                        border: "none",
                        color: "var(--foreground-muted)",
                        fontSize: "24px",
                        cursor: "pointer"
                    }}
                >
                    &times;
                </button>

                <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Log Manual Activity</h2>
                <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginBottom: "20px" }}>Use IQ Vision to scan a screenshot or enter data manually.</p>

                {/* IQ Vision Scan Action */}
                <div style={{ marginBottom: "25px" }}>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*,application/json,.json,application/pdf" 
                        ref={scanInputRef} 
                        onChange={(e) => {
                            if (e.target.files?.length) handleBatchScan(e.target.files);
                        }}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        onClick={() => scanInputRef.current?.click()}
                        disabled={isScanning || loading}
                        className="glass-panel"
                        style={{
                            width: "100%",
                            padding: "20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "12px",
                            border: "1px solid var(--primary)",
                            background: "rgba(204,255,0,0.05)",
                            borderRadius: "var(--radius-md)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            position: "relative",
                            overflow: "hidden"
                        }}
                    >
                        {isScanning ? (
                            <>
                                <div className="scanning-line" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)', animation: 'scan 1.5s infinite linear' }} />
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ color: "var(--primary)", fontWeight: 700, fontSize: '15px' }}>IQ Fleet Scanning...</div>
                                    <div style={{ fontSize: '11px', color: 'var(--foreground-muted)', marginTop: '4px' }}>Processed {scanProgress.current} / {scanProgress.total}</div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ color: "var(--primary)", fontWeight: 800, fontSize: '16px', letterSpacing: '0.5px' }}>IQ BATCH SCAN</div>
                                    <div style={{ fontSize: '10px', color: 'var(--foreground-muted)', textTransform: 'uppercase' }}>Scan up to 20 images, JSON, or PDFs</div>
                                </div>
                            </>
                        )}
                    </button>
                </div>

                {/* Draft List View */}
                {drafts.length > 0 && (
                    <div style={{ marginBottom: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--foreground-muted)' }}>Scanned Drafts ({drafts.length})</div>
                            <button onClick={handleSaveAll} disabled={loading || isScanning} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>Save All</button>
                        </div>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px' }}>
                            {drafts.map(draft => (
                                <div 
                                    key={draft.id} 
                                    onClick={() => draft.status === 'complete' && applyDraft(draft)}
                                    className="glass-panel" 
                                    style={{ 
                                        padding: '10px 15px', 
                                        borderRadius: 'var(--radius-sm)', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        cursor: draft.status === 'complete' ? 'pointer' : 'default',
                                        border: draft.status === 'error' ? '1px solid rgba(255,0,0,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                        opacity: draft.status === 'pending' ? 0.5 : 1
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: draft.status === 'complete' ? 'var(--primary)' : draft.status === 'error' ? '#ff4444' : '#666' }}></div>
                                        <div>
                                            <div style={{ fontSize: '13px', fontWeight: 600 }}>{draft.data?.title || draft.file.name.substring(0, 20)}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--foreground-muted)' }}>
                                                {draft.status === 'complete' ? `${draft.data.distance?.toFixed(2)} mi · ${draft.data.type}` : draft.status}
                                            </div>
                                        </div>
                                    </div>
                                    {draft.status === 'complete' && <div style={{ color: 'var(--primary)', fontSize: '12px' }}>Edit →</div>}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setDrafts([])} style={{ background: 'none', border: 'none', color: 'var(--foreground-muted)', fontSize: '11px', cursor: 'pointer', textAlign: 'center' }}>Clear All</button>
                    </div>
                )}

                <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>

                    {/* Activity Type & Date */}
                    <div style={{ display: "flex", gap: "15px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Type</label>
                            <select value={type} onChange={e => setType(e.target.value as any)} style={inputStyle} disabled={loading}>
                                <option value="Run">Run</option>
                                <option value="Walk">Walk</option>
                                <option value="Bike">Bike</option>
                                <option value="Hike">Hike</option>
                                <option value="Meditation">Meditation</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={inputStyle} disabled={loading} />
                        </div>
                    </div>

                    {/* Distance & Pace */}
                    {type !== "Meditation" && (
                    <div style={{ display: "flex", gap: "15px", alignItems: "flex-end" }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Distance (Miles)</label>
                            <input type="number" step="0.01" min="0.01" value={distance} onChange={e => setDistance(e.target.value)} required style={inputStyle} disabled={loading} placeholder="e.g. 6.0" />
                        </div>
                        <div style={{ flex: 1, padding: "10px", background: "rgba(204,255,0,0.05)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(204,255,0,0.1)", textAlign: "center" }}>
                            <div style={{ fontSize: "10px", color: "var(--primary)", fontWeight: 700, textTransform: "uppercase" }}>Avg Pace</div>
                            <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary)" }}>{getPaceStr()}</div>
                        </div>
                    </div>
                    )}

                    {/* Duration */}
                    <div>
                        <label style={labelStyle}>Duration</label>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div style={{ flex: 1 }}>
                                <input type="number" value={hours} onChange={e => setHours(e.target.value)} min="0" style={inputStyle} disabled={loading} placeholder="Hrs" />
                                <div style={subLabelStyle}>Hours</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <input type="number" value={minutes} onChange={e => setMinutes(e.target.value)} min="0" max="59" style={inputStyle} disabled={loading} placeholder="Min" />
                                <div style={subLabelStyle}>Minutes</div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <input type="number" value={seconds} onChange={e => setSeconds(e.target.value)} min="0" max="59" style={inputStyle} disabled={loading} placeholder="Sec" />
                                <div style={subLabelStyle}>Seconds</div>
                            </div>
                        </div>
                    </div>

                    {/* Extra Stats */}
                    <div style={{ display: "flex", gap: "10px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Calories</label>
                            <input type="number" value={calories} onChange={e => setCalories(e.target.value)} style={inputStyle} disabled={loading} placeholder="Kcal" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Steps</label>
                            <input type="number" value={steps} onChange={e => setSteps(e.target.value)} style={inputStyle} disabled={loading} placeholder="Steps" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Elevation (ft)</label>
                            <input type="number" value={elevation} onChange={e => setElevation(e.target.value)} style={inputStyle} disabled={loading} placeholder="Gain" />
                        </div>
                    </div>

                    {/* Title & Notes */}
                    <div>
                        <label style={labelStyle}>Activity Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} disabled={loading} placeholder="e.g. Morning Jog" />
                    </div>
                    <div style={{ position: "relative" }}>
                        <label style={labelStyle}>Notes</label>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: "100px", resize: "vertical", paddingRight: "50px" }} disabled={loading} placeholder="How did it feel?" />
                        <div style={{ position: "absolute", bottom: "10px", right: "10px" }}>
                            <SpeechControls 
                                onStartRecording={startRecording}
                                onStopRecording={handleTranscription}
                                isRecording={isRecording}
                                isTranscribing={isTranscribing}
                                showSpeaker={false}
                                size={14}
                            />
                        </div>
                    </div>

                    {/* Media Upload */}
                    <div>
                        <label style={labelStyle}>Photos / Videos</label>
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*,video/*"
                            onChange={(e) => {
                                if (e.target.files) setSelectedFiles(Array.from(e.target.files));
                            }}
                            ref={fileInputRef}
                            style={{ display: "none" }}
                        />
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                            <button 
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "var(--radius-sm)",
                                    border: "1px dashed rgba(255,255,255,0.2)",
                                    background: "rgba(255,255,255,0.02)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "var(--foreground-muted)",
                                    cursor: "pointer"
                                }}
                            >
                                +
                            </button>
                            {selectedFiles.map((f, i) => (
                                <div key={i} style={{
                                    width: "60px",
                                    height: "60px",
                                    borderRadius: "var(--radius-sm)",
                                    background: "rgba(255,255,255,0.1)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "10px",
                                    position: "relative",
                                    overflow: "hidden"
                                }}>
                                    <span style={{ zIndex: 1, padding: "2px", textAlign: "center" }}>{f.name.substring(0, 10)}...</span>
                                    <button 
                                        type="button"
                                        onClick={() => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i))}
                                        style={{
                                            position: "absolute",
                                            top: "2px",
                                            right: "2px",
                                            background: "rgba(0,0,0,0.5)",
                                            border: "none",
                                            color: "#fff",
                                            borderRadius: "50%",
                                            width: "16px",
                                            height: "16px",
                                            fontSize: "10px",
                                            cursor: "pointer",
                                            zIndex: 2
                                        }}
                                    >
                                        &times;
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: "10px", padding: "12px", justifyContent: "center", opacity: loading ? 0.7 : 1 }}>
                        {loading ? "Saving Progress..." : "Save Activity"}
                    </button>

                </form>
            </div>
        </div>
    );
}

const labelStyle = {
    display: "block",
    marginBottom: "5px",
    fontSize: "13px",
    color: "var(--foreground-muted)",
    fontWeight: 500
};

const subLabelStyle = {
    fontSize: "11px",
    color: "var(--foreground-muted)",
    marginTop: "4px",
    textAlign: "center" as const
};

const inputStyle = {
    width: "100%",
    padding: "10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "var(--radius-sm)",
    color: "#fff",
    outline: "none",
    fontSize: "14px"
};

// Keyframes for scanning animation
const ScanStyles = () => (
    <style>{`
        @keyframes scan {
            0% { top: 0; }
            50% { top: 100%; }
            100% { top: 0; }
        }
        .scanning-line {
            pointer-events: none;
        }
    `}</style>
);
