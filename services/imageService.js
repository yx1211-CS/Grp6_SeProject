import { decode } from 'base64-arraybuffer';
// CHANGE THIS LINE BELOW: Add '/legacy' to the end
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../constants';

export const getUserImageSource = (userImage) => {
    if (userImage) {
        // 这里假设你的图片存在 'uploads' 这个 bucket 里
        // 如果你的 bucket 叫 'profiles'，请把 'uploads' 改成 'profiles'
        return getSupabaseFileUrl('uploads', userImage);
    } else {
        // ⚠️ 确保你的 assets/images 文件夹里真的有 defaultUser.png 这张图
        return require('../assets/images/userImage.png');
    }
}


export const getSupabaseFileUrl = (bucketName, filePath) => {
    if (filePath) {
        return { 
            uri: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}` 
        };
    }
    return null;
}

export const uploadFile = async (bucketName, fileUri, isImage = true) => {
    try {
        let fileName = getFilePath(isImage); 

        // Now this will work because we are using the legacy import
        const fileBase64 = await FileSystem.readAsStringAsync(fileUri, {
            encoding: FileSystem.EncodingType.Base64
        });

        let imageData = decode(fileBase64);

        const { data, error } = await supabase
            .storage
            .from('uploads')
            .upload(fileName, imageData, {
                contentType: isImage ? 'image/*' : 'video/*',
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.log('file upload error: ', error);
            return { success: false, msg: 'Could not upload media' };
        }

        console.log('data: ', data);

        return { success: true, data: data.path };

    } catch (error) {
        console.log('file upload error: ', error);
        return { success: false, msg: 'Could not upload media' };
    }
}

const getFilePath = (isImage) => {
    return `${new Date().getTime()}${isImage ? '.png' : '.mp4'}`;
}