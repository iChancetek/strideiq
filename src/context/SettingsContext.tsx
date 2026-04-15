"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { Language } from "@/lib/translations";
import { authenticatedFetch } from "@/lib/api-client";

interface Settings {
    theme: "light" | "dark";
    units: "imperial" | "metric";
    activityMode: "run" | "walk" | "bike" | "hike" | "meditation" | "fasting";
    environment: "outdoor" | "indoor";
    voiceCoaching: boolean;
    weatherAnnouncements: boolean;
    autoPause: boolean;
    autoPauseSensitivity: "low" | "medium" | "high";
    showMap: boolean;
    language: Language;
    privateProfile: boolean;
    showFloatingControls: boolean;
}

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
    toggleTheme: () => void;
}

const defaultSettings: Settings = {
    theme: "dark",
    units: "imperial",
    activityMode: "run",
    environment: "outdoor",
    voiceCoaching: true,
    weatherAnnouncements: true,
    autoPause: true,
    autoPauseSensitivity: "medium",
    showMap: true,
    language: "en",
    privateProfile: false,
    showFloatingControls: true,
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

    // 2. Sync from Postgres when user logs in
    useEffect(() => {
        if (!user) return;

        const loadRemoteSettings = async () => {
            try {
                const res = await authenticatedFetch("/api/user/settings");
                if (res.ok) {
                    const remoteSettings = await res.json();
                    if (Object.keys(remoteSettings).length > 0) {
                        setSettings(prev => {
                            const merged = { ...prev, ...remoteSettings };
                            localStorage.setItem("strideiq_settings", JSON.stringify(merged));
                            return merged;
                        });
                    }
                }
            } catch (error) {
                console.error("Error loading remote settings from Postgres:", error);
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
                await authenticatedFetch("/api/user/settings", {
                    method: "POST",
                    body: JSON.stringify(newSettings),
                });
            } catch (error) {
                console.error("Error syncing settings to Postgres:", error);
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
