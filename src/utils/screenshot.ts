export async function captureCanvas(): Promise<string | null> {
  try {
    const { toPng } = await import('html-to-image');
    const el = document.querySelector('.react-flow') as HTMLElement;
    if (!el) return null;
    return await toPng(el, { quality: 0.95 });
  } catch {
    return null;
  }
}
