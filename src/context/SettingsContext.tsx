"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

interface Settings {
    theme: "light" | "dark";
    units: "imperial" | "metric";
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
    toggleTheme: () => void;
}

const defaultSettings: Settings = {
    theme: "dark",
    units: "imperial",
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [loaded, setLoaded] = useState(false);

    // 1. Load from LocalStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("strideiq_settings");
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setSettings(prev => ({ ...prev, ...parsed }));
            } catch (e) {
                console.error("Failed to parse settings", e);
            }
        }
        setLoaded(true);
    }, []);

    // 2. Sync from Firestore when user logs in
    useEffect(() => {
        if (!user) return;

        const loadRemoteSettings = async () => {
            try {
                const docRef = doc(db, "users", user.uid, "settings", "preferences");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const remoteSettings = docSnap.data() as Partial<Settings>;
                    setSettings(prev => {
                        const merged = { ...prev, ...remoteSettings };
                        localStorage.setItem("strideiq_settings", JSON.stringify(merged));
                        return merged;
                    });
                }
            } catch (error) {
                console.error("Error loading remote settings:", error);
            }
        };

        loadRemoteSettings();
    }, [user]);

    // 3. Apply Theme to HTML tag
    useEffect(() => {
        if (settings.theme === "light") {
            document.documentElement.setAttribute("data-theme", "light");
        } else {
            document.documentElement.removeAttribute("data-theme");
        }
    }, [settings.theme]);

    const updateSettings = async (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);
        localStorage.setItem("strideiq_settings", JSON.stringify(updated));

        if (user) {
            try {
                const docRef = doc(db, "users", user.uid, "settings", "preferences");
                await setDoc(docRef, updated, { merge: true });
            } catch (error) {
                console.error("Error syncing settings to Firestore:", error);
            }
        }
    };

    const toggleTheme = () => {
        updateSettings({ theme: settings.theme === "light" ? "dark" : "light" });
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, toggleTheme }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error("useSettings must be used within a SettingsProvider");
    }
    return context;
}
