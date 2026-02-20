"use client";

import JournalEditor from "@/components/dashboard/journal/JournalEditor";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc } from "firebase/firestore";

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
                const docRef = doc(db, "users", user!.uid, "journal_entries", id);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setInitialData({
                        id: docSnap.id,
                        ...data,
                        createdAt: data.createdAt?.toDate?.()?.toISOString(),
                        updatedAt: data.updatedAt?.toDate?.()?.toISOString()
                    });
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
