import { decode } from 'base64-arraybuffer';
// CHANGE THIS LINE BELOW: Add '/legacy' to the end
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';

export const getSupabaseFileUrl = (bucketName, filePath) => {
    if (filePath) {
        return { 
            uri: `${supabase.supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}` 
        };
    }
    return null;
}

export const uploadFile = async (bucketName, fileUri, isImage = true) => {
    try {
        let fileName = getFilePath(isImage); 

        // Now this will work because we are using the legacy import
        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: 'base64'
        });

        let imageData = decode(fileBase64);

        const { data, error } = await supabase
            .storage
            .from(bucketName)
            .upload(fileName, imageData, {
                contentType: isImage ? 'image/*' : 'video/*',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.log('file upload error: ', error);
            return { success: false, msg: 'Could not upload media' };
        }

        return { success: true, data: data.path };

    } catch (error) {
        console.log('file upload error: ', error);
        return { success: false, msg: 'Could not upload media' };
    }
}

const getFilePath = (isImage) => {
    return `${new Date().getTime()}${isImage ? '.png' : '.mp4'}`;
}