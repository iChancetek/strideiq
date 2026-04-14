import { storage } from "./firebase/config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

/**
 * Uploads a file to a specific path in Firebase Storage.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
    bucket: string, 
    path: string,
    file: File
): Promise<{ url: string; error?: any; errorCode?: string }> {
    try {
        const fullPath = `${bucket}/${path}`.replace(/\/+/g, '/'); // Normalize path
        const storageRef = ref(storage, fullPath);
        
        // Log attempt (helpful for debugging rules)
        console.log(`[Storage] Uploading to: ${fullPath} (${file.type}, ${file.size} bytes)`);
        
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        
        console.log(`[Storage] Upload success: ${url}`);
        return { url };
    } catch (error: any) {
        console.error("[Storage] Upload failed:", error);
        
        // Extract Firebase error code if available
        const errorCode = error?.code || "storage/unknown";
        
        return { 
            url: "", 
            error: error?.message || "Upload failed", 
            errorCode 
        };
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

        const { url, error, errorCode } = await uploadFile('uploads', filePath, file);
        
        if (error || !url) {
            throw new Error(`Failed to upload ${mediaType}: ${errorCode || error}`);
        }

        mediaItems.push({
            type: mediaType,
            url,
            path: `uploads/${filePath}`,
            createdAt: new Date().toISOString()
        });
    }
    
    return mediaItems;
}
