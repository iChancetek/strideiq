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
                const res = await fetch(`/api/journal/${id}`, {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setInitialData(data);
                } else {
                    console.error("Failed to load entry");
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
