"use client";

import JournalEditor from "@/components/dashboard/journal/JournalEditor";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function EntryPage() {
    const params = useParams();
    const id = params.id as string;
    const isNew = id === "new";
    const { user } = useAuth();

    const [initialData, setInitialData] = useState<any>(null);
    const [loading, setLoading] = useState(!isNew);

    useEffect(() => {
        if (!user) return;
        if (isNew) {
            setLoading(false);
            return;
        }

        async function fetchEntry() {
            try {
                const token = await user?.getIdToken();
                if (!token) return;

                const response = await fetch(`/api/journal/${id}`, {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.entry) {
                        setInitialData(data.entry);
                    }
                } else {
                    console.error("Failed to load entry via REST");
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchEntry();
    }, [id, isNew, user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return <JournalEditor isNew={isNew} initialData={initialData} />;
}
