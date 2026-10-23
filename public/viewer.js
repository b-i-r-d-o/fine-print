// viewer.js — shows an agreement's original inside the app.
// PDFs are drawn page by page with PDF.js (bundled in /vendor/pdfjs), so they open the same
// way on every phone. Photographed pages are shown as images.

let pdfjsReady = null;
function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (!pdfjsReady) {
    pdfjsReady = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = '/vendor/pdfjs/pdf.min.js';
      s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '/vendor/pdfjs/pdf.worker.min.js';
        resolve(window.pdfjsLib);
      };
      s.onerror = () => reject(new Error('Could not load the PDF viewer.'));
      document.head.appendChild(s);
    });
  }
  return pdfjsReady;
}

/** Draw the original(s) into `box`. items: [{ blob, name, type }] */
export async function renderOriginal(box, items) {
  box.innerHTML = '';
  if (items.length === 1 && /pdf/.test(items[0].type)) {
    const pdfjsLib = await loadPdfJs();
    const data = new Uint8Array(await items[0].blob.arrayBuffer());
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    const width = Math.min(box.clientWidth || 360, 900);
    const ratio = Math.min(window.devicePixelRatio || 1, 2.5);
    for (let n = 1; n <= pdf.numPages; n++) {
      const pageObj = await pdf.getPage(n);
      const base = pageObj.getViewport({ scale: 1 });
      const viewport = pageObj.getViewport({ scale: (width / base.width) * ratio });
      const canvas = document.createElement('canvas');
      canvas.className = 'viewer-page';
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${width}px`;
      canvas.setAttribute('aria-label', `Page ${n} of ${pdf.numPages}`);
      box.append(canvas);
      await pageObj.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    }
    return pdf.numPages;
  }
  items.forEach((it, i) => {
    const img = document.createElement('img');
    img.className = 'viewer-page';
    img.alt = `Page ${i + 1}`;
    img.src = URL.createObjectURL(it.blob);
    box.append(img);
  });
  return items.length;
}
