import { toPng } from 'html-to-image';

/**
 * Capture the React Flow canvas as a PNG data URL.
 */
export async function captureWallScreenshot(): Promise<string | null> {
  const element = document.querySelector('.react-flow') as HTMLElement;
  if (!element) return null;

  try {
    const dataUrl = await toPng(element, {
      backgroundColor: '#0a0a0a',
      quality: 0.9,
      pixelRatio: 2,
    });
    return dataUrl;
  } catch (err) {
    console.error('Screenshot failed:', err);
    return null;
  }
}