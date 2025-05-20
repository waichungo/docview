import React, { useEffect } from 'react'
import { useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

const DocView = ({ file }: { file: string }) => {
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [data, setData] = useState(`file:\\${file}`)

    function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
        setNumPages(numPages);
    }
    useEffect(() => {
        let cb = async () => {
           
        
        }
        cb()
    }, [])
    return (
        <>
            {data !== null &&
                <div>
                    <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                        <Page pageNumber={pageNumber} />
                    </Document>
                    <p>
                        Page {pageNumber} of {numPages}
                    </p>
                </div>
            }
            {data === null && <>
                Loading
            </>}
        </>
    );
}

export default DocView
