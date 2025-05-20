// import pdfjsLib from 'pdfjs-dist/es5/build/pdf.js';
import pdfjs, { PDFDocumentProxy } from 'pdfjs-dist'

export async function loadPdf(file: string): Promise<PDFDocumentProxy> {
    var docObject = pdfjs.getDocument(file);
    var doc = await docObject.promise;
    return doc;
}
// async function loadPdf(url:string) {
//   try {
//     const loadingTask = pdfjsLib.getDocument(url);
//     const pdf = await loadingTask.promise;
//     return pdf;
//   } catch (error) {
//     console.error("Error loading PDF:", error);
//     throw error;
//   }
// }

// async function renderPdf(pdf, pageNumber, canvas) {
//   const page = await pdf.getPage(pageNumber);
//   const viewport = page.getViewport({ scale: 1 });
//   canvas.height = viewport.height;
//   canvas.width = viewport.width;

//   const renderContext = {
//     canvasContext: canvas.getContext('2d'),
//     viewport: viewport
//   };
//   await page.render(renderContext).promise;
// }

// async function displayPdf(url, canvasId) {
//   try {
//     const pdf = await loadPdf(url);
//     const canvas = document.getElementById(canvasId);
//     await renderPdf(pdf, 1, canvas);
//   } catch (error) {
//     console.error("Error displaying PDF:", error);
//   }
// }
export { }