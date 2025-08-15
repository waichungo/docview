import React, { useEffect } from 'react';
import PDFViewer from './views/PDFView';
import { pdfjs } from 'react-pdf';

import "./css/App.scss"
import Header from './views/Header';
import HomePage from './views/HomePage';
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
      <Header></Header>
      <div className="body">
        <HomePage></HomePage>
      </div>
      {/* <div className="doc_area">
        <DocView file='C:\\Users\\James\\Downloads\\node-jose.pdf'/>
      </div> */}
    </div>
  );
}

export default App;
