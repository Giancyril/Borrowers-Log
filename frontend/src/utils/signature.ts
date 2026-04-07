/**
 * Signature utility functions for optimized storage and display
 */

/**
 * Extracts stroke point arrays from the signature canvas
 * @param sigRef Reference to the SignatureCanvas component
 * @returns JSON string of stroke data or null if empty
 */
export const getSignatureData = (sigRef: React.RefObject<any>): string => {
  if (!sigRef.current || sigRef.current.isEmpty()) return "";
  const data = sigRef.current.toData();
  return JSON.stringify(data);
};

/**
 * Converts stored signature data to a displayable data URL
 * Handles both legacy base64 format and new JSON stroke data
 * @param signatureData Stored signature data (base64 string or JSON string)
 * @returns Data URL string for displaying the signature image
 */
export const signatureToDisplay = (signatureData: string | null): string | null => {
  if (!signatureData) return null;

  // Check if it's legacy base64 format
  if (signatureData.startsWith('data:image/')) {
    return signatureData;
  }

  // Parse JSON stroke data
  let strokes;
  try {
    strokes = JSON.parse(signatureData);
  } catch (e) {
    console.error('Invalid signature data:', e);
    return null;
  }

  if (!Array.isArray(strokes) || strokes.length === 0) return null;

  // Create canvas for reconstruction (match typical signature canvas size)
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Clear with transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Set drawing style for dark UI (white signature)
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw each stroke
  strokes.forEach((stroke: any[]) => {
    if (stroke.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(stroke[0].x, stroke[0].y);
    stroke.slice(1).forEach((point: any) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
  });

  // Return as data URL
  return canvas.toDataURL('image/png');
};