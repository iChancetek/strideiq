import { supabase } from "./supabase";

/**
 * Uploads a file to a specific path in a Supabase bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
    bucket: string,
    path: string,
    file: File
): Promise<{ url: string; error?: any }> {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (error) return { url: "", error };

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        return { url: publicUrl };
    } catch (error) {
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
        const filePath = `users/${userId}/activities/${fileName}`;

        const { url, error } = await uploadFile('activities', filePath, file);
        
        if (!error && url) {
            mediaItems.push({
                type: mediaType,
                url,
                path: filePath,
                createdAt: new Date().toISOString()
            });
        } else {
            console.error("Upload error for file:", file.name, error);
        }
    }
    
    return mediaItems;
}
