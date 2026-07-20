import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { getFirebaseStorage } from './config';

/**
 * Upload a user avatar image.
 * Returns the download URL.
 */
export async function uploadAvatar(
  uid: string,
  file: File,
): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), `avatars/${uid}/avatar.webp`);
  await uploadBytes(storageRef, file, {
    contentType: 'image/webp',
    customMetadata: { uploadedBy: uid },
  });
  return getDownloadURL(storageRef);
}

/**
 * Get a download URL for a storage path.
 */
export async function getFileUrl(path: string): Promise<string> {
  const storageRef = ref(getFirebaseStorage(), path);
  return getDownloadURL(storageRef);
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(path: string): Promise<void> {
  const storageRef = ref(getFirebaseStorage(), path);
  await deleteObject(storageRef);
}
