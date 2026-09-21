import * as fs from 'fs';
import * as path from 'path';

/**
 * Utility to save a base64 data URI string to disk under `uploads/<subfolder>/`
 * and return the relative static file path `/uploads/<subfolder>/<filename>`.
 */
export async function saveBase64ToFile(
  base64Str: string,
  subfolder: string = 'projects',
): Promise<string> {
  if (typeof base64Str !== 'string' || !base64Str.startsWith('data:')) {
    return base64Str;
  }

  const matches = base64Str.match(/^data:([a-zA-Z0-9\/+.-]+);base64,([\s\S]+)$/);
  if (!matches) {
    return base64Str;
  }

  const mimeType = matches[1].toLowerCase();
  const base64Data = matches[2].replace(/[\r\n\s]/g, '');

  let ext = 'bin';
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = 'jpg';
  else if (mimeType.includes('png')) ext = 'png';
  else if (mimeType.includes('webp')) ext = 'webp';
  else if (mimeType.includes('gif')) ext = 'gif';
  else if (mimeType.includes('svg')) ext = 'svg';
  else if (mimeType.includes('pdf')) ext = 'pdf';
  else if (mimeType.includes('word') || mimeType.includes('docx')) ext = 'docx';
  else if (mimeType.includes('doc')) ext = 'doc';
  else if (mimeType.includes('excel') || mimeType.includes('xlsx')) ext = 'xlsx';
  else if (mimeType.includes('xls')) ext = 'xls';

  const uploadDir = path.join(process.cwd(), 'uploads', subfolder);
  try {
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
  } catch {
    // Ignore folder creation error if already exists
  }

  const fileName = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    await fs.promises.writeFile(filePath, buffer);
    return `/uploads/${subfolder}/${fileName}`;
  } catch (err) {
    console.error(`Failed to save base64 file to ${filePath}:`, err);
    return base64Str;
  }
}

/**
 * Recursively inspects objects/arrays/strings and replaces any Base64 data URIs with disk file URLs.
 * Also extracts base64 <img> tags from HTML strings.
 */
export async function sanitizeBase64Payload<T = any>(
  item: T,
  subfolder: string = 'projects',
): Promise<T> {
  if (item === null || item === undefined) return item;

  if (typeof item === 'string') {
    if (item.startsWith('data:')) {
      return (await saveBase64ToFile(item, subfolder)) as any;
    }
    // Check for inline base64 images in HTML string (e.g., specification, description)
    if (item.includes('data:image/')) {
      const base64Regex = /data:image\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=\r\n\s]+/g;
      const matches = item.match(base64Regex);
      if (matches) {
        let updatedHtml: string = item;
        for (const base64Src of matches) {
          const fileUrl = await saveBase64ToFile(base64Src.trim(), subfolder);
          updatedHtml = updatedHtml.replace(base64Src, fileUrl);
        }
        return updatedHtml as any;
      }
    }
    return item;
  }

  if (Array.isArray(item)) {
    const sanitizedArray: any[] = [];
    for (const elem of item) {
      sanitizedArray.push(await sanitizeBase64Payload(elem, subfolder));
    }
    return sanitizedArray as any;
  }

  if (typeof item === 'object') {
    // Avoid mutating special object types like Date or ObjectId
    if (item.constructor && item.constructor.name !== 'Object') {
      return item;
    }
    const sanitizedObj: any = {};
    for (const key of Object.keys(item)) {
      sanitizedObj[key] = await sanitizeBase64Payload((item as any)[key], subfolder);
    }
    return sanitizedObj as any;
  }

  return item;
}
