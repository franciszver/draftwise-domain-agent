import type { Handler } from 'aws-lambda';
import * as zlib from 'zlib';

interface UploadRequest {
  domainId: string;
  fileName: string;
  fileType: string; // 'pdf', 'txt', 'docx'
  fileContent: string; // base64 encoded content
}

interface UploadResponse {
  success: boolean;
  source?: {
    id: string;
    url: string;
    title: string;
    content: string;
    category: string;
  };
  error?: string;
}

// Extract text from different file formats
async function extractText(fileContent: string, fileType: string): Promise<string> {
  const buffer = Buffer.from(fileContent, 'base64');

  switch (fileType.toLowerCase()) {
    case 'txt':
    case 'text/plain':
      return buffer.toString('utf-8');

    case 'pdf':
    case 'application/pdf':
      return extractPdfText(buffer);

    case 'docx':
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return extractDocxText(buffer);

    case 'doc':
    case 'application/msword':
      // Basic .doc support - extract readable text
      return extractDocText(buffer);

    default:
      // Try to extract as plain text
      const text = buffer.toString('utf-8');
      // Check if it looks like readable text
      if (isReadableText(text)) {
        return text;
      }
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

// Check if content is readable text (not binary garbage)
function isReadableText(text: string): boolean {
  // Count printable ASCII characters vs non-printable
  let printable = 0;
  let nonPrintable = 0;
  for (let i = 0; i < Math.min(text.length, 1000); i++) {
    const code = text.charCodeAt(i);
    if ((code >= 32 && code <= 126) || code === 9 || code === 10 || code === 13) {
      printable++;
    } else if (code < 32 && code !== 9 && code !== 10 && code !== 13) {
      nonPrintable++;
    }
  }
  return printable > nonPrintable * 10;
}

// Extract text from PDF (handles both compressed and uncompressed streams)
function extractPdfText(buffer: Buffer): string {
  const content = buffer.toString('binary');
  const textParts: string[] = [];

  // Find and decompress FlateDecode streams
  const streamRegex = /stream\r?\n([\s\S]*?)endstream/g;
  let match;

  while ((match = streamRegex.exec(content)) !== null) {
    const streamData = match[1];
    let decodedContent = '';

    // Check if this stream is compressed (look for FlateDecode in preceding object)
    const objStart = content.lastIndexOf('obj', match.index);
    const objDef = content.slice(Math.max(0, objStart - 200), match.index);
    const isFlateCompressed = objDef.includes('FlateDecode');

    if (isFlateCompressed) {
      // Try to decompress with zlib
      try {
        const streamBuffer = Buffer.from(streamData, 'binary');
        const decompressed = zlib.inflateSync(streamBuffer);
        decodedContent = decompressed.toString('binary');
      } catch {
        // Try raw inflate
        try {
          const streamBuffer = Buffer.from(streamData, 'binary');
          const decompressed = zlib.inflateRawSync(streamBuffer);
          decodedContent = decompressed.toString('binary');
        } catch {
          // Skip this stream if decompression fails
          continue;
        }
      }
    } else {
      decodedContent = streamData;
    }

    // Extract text from BT/ET blocks in the decoded content
    const btEtRegex = /BT([\s\S]*?)ET/g;
    let btMatch;
    while ((btMatch = btEtRegex.exec(decodedContent)) !== null) {
      const block = btMatch[1];
      // Extract text from Tj and TJ operators
      const tjRegex = /\(([^)]*)\)\s*Tj/g;
      const tjArrayRegex = /\[((?:[^[\]]*|\[[^\]]*\])*)\]\s*TJ/gi;

      let textMatch;
      while ((textMatch = tjRegex.exec(block)) !== null) {
        textParts.push(decodeEscapedText(textMatch[1]));
      }

      while ((textMatch = tjArrayRegex.exec(block)) !== null) {
        const arrayContent = textMatch[1];
        const stringRegex = /\(([^)]*)\)/g;
        let stringMatch;
        while ((stringMatch = stringRegex.exec(arrayContent)) !== null) {
          textParts.push(decodeEscapedText(stringMatch[1]));
        }
      }
    }

    // Also check for readable text in decoded content
    if (isReadableText(decodedContent)) {
      const cleaned = decodedContent.replace(/[^\x20-\x7E\n\r\t]/g, ' ').trim();
      if (cleaned.length > 50 && !cleaned.includes('BT') && !cleaned.includes('ET')) {
        textParts.push(cleaned);
      }
    }
  }

  // Also try uncompressed text blocks directly in the PDF
  const btEtRegex = /BT([\s\S]*?)ET/g;
  while ((match = btEtRegex.exec(content)) !== null) {
    const block = match[1];
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let textMatch;
    while ((textMatch = tjRegex.exec(block)) !== null) {
      const decoded = decodeEscapedText(textMatch[1]);
      if (decoded && !textParts.includes(decoded)) {
        textParts.push(decoded);
      }
    }
  }

  const text = textParts.join(' ').replace(/\s+/g, ' ').trim();

  if (text.length < 50) {
    throw new Error('Could not extract meaningful text from PDF. The file may be image-based, encrypted, or use unsupported encoding.');
  }

  return text;
}

// Decode escaped characters in PDF text
function decodeEscapedText(text: string): string {
  return text
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\(/g, '(')
    .replace(/\\\)/g, ')')
    .replace(/\\\\/g, '\\');
}

// Parse ZIP file and extract a specific file's content
function extractFromZip(buffer: Buffer, targetFile: string): Buffer | null {
  // ZIP file structure: local file headers followed by central directory
  let offset = 0;

  while (offset < buffer.length - 30) {
    // Check for local file header signature (0x04034b50)
    if (buffer[offset] !== 0x50 || buffer[offset + 1] !== 0x4b ||
      buffer[offset + 2] !== 0x03 || buffer[offset + 3] !== 0x04) {
      break;
    }

    const compressionMethod = buffer.readUInt16LE(offset + 8);
    const compressedSize = buffer.readUInt32LE(offset + 18);
    // uncompressedSize at offset + 22 (not needed for extraction)
    const fileNameLength = buffer.readUInt16LE(offset + 26);
    const extraFieldLength = buffer.readUInt16LE(offset + 28);

    const fileName = buffer.toString('utf-8', offset + 30, offset + 30 + fileNameLength);
    const dataStart = offset + 30 + fileNameLength + extraFieldLength;
    const dataEnd = dataStart + compressedSize;

    if (fileName === targetFile || fileName.endsWith('/' + targetFile)) {
      const compressedData = buffer.subarray(dataStart, dataEnd);

      if (compressionMethod === 0) {
        // No compression
        return compressedData;
      } else if (compressionMethod === 8) {
        // Deflate compression
        try {
          return zlib.inflateRawSync(compressedData);
        } catch {
          // Try with different options
          try {
            return zlib.inflateSync(compressedData);
          } catch {
            return null;
          }
        }
      }
    }

    // Move to next file
    offset = dataEnd;
  }

  return null;
}

// Extract text from DOCX (ZIP containing XML)
function extractDocxText(buffer: Buffer): string {
  // DOCX is a ZIP file - look for the PK signature
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new Error('Invalid DOCX file format');
  }

  const textParts: string[] = [];

  // Try to extract word/document.xml from the ZIP
  const documentXml = extractFromZip(buffer, 'word/document.xml');

  if (documentXml) {
    const xmlContent = documentXml.toString('utf-8');
    // Extract text from <w:t> tags
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match;
    while ((match = textRegex.exec(xmlContent)) !== null) {
      if (match[1]) {
        textParts.push(match[1]);
      }
    }
  }

  // If ZIP extraction failed, try raw search (for uncompressed DOCX)
  if (textParts.length === 0) {
    const content = buffer.toString('binary');
    const textRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g;
    let match;
    while ((match = textRegex.exec(content)) !== null) {
      if (match[1].trim()) {
        textParts.push(match[1]);
      }
    }
  }

  const text = textParts.join(' ').replace(/\s+/g, ' ').trim();

  if (text.length < 20) {
    throw new Error('Could not extract meaningful text from DOCX file. The file may be corrupted or password-protected.');
  }

  return text;
}

// Extract text from DOC (older Word format)
function extractDocText(buffer: Buffer): string {
  const content = buffer.toString('binary');
  const textParts: string[] = [];

  // DOC files have text scattered throughout - find readable sequences
  const readableRegex = /[\x20-\x7E\n\r\t]{30,}/g;
  let match;

  while ((match = readableRegex.exec(content)) !== null) {
    const text = match[0].trim();
    if (text && !text.includes('\x00')) {
      textParts.push(text);
    }
  }

  const text = textParts.join(' ').replace(/\s+/g, ' ').trim();

  if (text.length < 50) {
    throw new Error('Could not extract meaningful text from DOC file.');
  }

  return text;
}

// Generate a title from filename
function generateTitle(fileName: string): string {
  // Remove extension
  const nameWithoutExt = fileName.replace(/\.[^.]+$/, '');
  // Convert underscores and hyphens to spaces
  const spacedName = nameWithoutExt.replace(/[_-]/g, ' ');
  // Title case
  return spacedName
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Main handler
export const handler: Handler = async (event): Promise<UploadResponse> => {
  const request = (event.arguments || event) as UploadRequest;

  // Validate request
  if (!request.domainId || !request.fileName || !request.fileContent) {
    return {
      success: false,
      error: 'Missing required fields: domainId, fileName, fileContent',
    };
  }

  // Check file size (10MB limit - base64 is ~33% larger)
  const maxBase64Size = 10 * 1024 * 1024 * 1.34; // ~13.4MB base64 for 10MB file
  if (request.fileContent.length > maxBase64Size) {
    return {
      success: false,
      error: 'File too large. Maximum size is 10MB.',
    };
  }

  try {
    // Determine file type from filename if not provided
    const fileType = request.fileType || request.fileName.split('.').pop()?.toLowerCase() || 'txt';

    // Extract text content
    const textContent = await extractText(request.fileContent, fileType);

    // Truncate if too long (max 100KB of text)
    const maxTextLength = 100 * 1024;
    const content = textContent.length > maxTextLength
      ? textContent.slice(0, maxTextLength) + '\n\n[Content truncated...]'
      : textContent;

    // Generate source object
    const source = {
      id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      url: `file://${request.fileName}`,
      title: generateTitle(request.fileName),
      content,
      category: 'user_uploaded',
    };

    return {
      success: true,
      source,
    };
  } catch (error) {
    console.error('Document processing error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process document',
    };
  }
};
