import React, { useEffect } from 'react';
import DocView from './views/DocView';
import { pdfjs } from 'react-pdf';


function App() {
  useEffect(() => {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
    console.log("Added pdfjs worker")
  }, [])

  return (
    <div className="App">
      <div className="doc_area">
        <DocView file='C:\\Users\\James\\Downloads\\node-jose.pdf'/>
      </div>
    </div>
  );
}

export default App;
