import { storage } from "./firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a file to a specific path in Firebase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
    bucket: string, // Kept for compatibility, serves as root dir
    path: string,
    file: File
): Promise<{ url: string; error?: any }> {
    try {
        const storageRef = ref(storage, `${bucket}/${path}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        return { url };
    } catch (error) {
        console.error("[Storage] Upload failed:", error);
        return { url: "", error };
    }
}

/**
 * Handle multiple file uploads and return an array of media objects
 */
export async function uploadMediaFiles(files: File[], userId: string) {
    const mediaItems: { type: "image" | "video"; url: string; path: string; createdAt: string }[] = [];
    
    for (const file of files) {
        const mediaType = (file.type.startsWith("video") ? "video" : "image") as "image" | "video";
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `users/${userId}/media/${fileName}`; // Clean path

        const { url, error } = await uploadFile('uploads', filePath, file);
        
        if (!error && url) {
            mediaItems.push({
                type: mediaType,
                url,
                path: `uploads/${filePath}`,
                createdAt: new Date().toISOString()
            });
        }
    }
    
    return mediaItems;
}
