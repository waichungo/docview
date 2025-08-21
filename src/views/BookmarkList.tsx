import React, { useEffect, useState } from 'react'
import "../css/bookmarkList.scss"
import { NativeObject } from '../shared'
import { BookmarkSimpleIcon } from "@phosphor-icons/react"
import { PDFDocumentProxy } from 'pdfjs-dist'
type BookmarkListProp = {
    pdfDoc: PDFDocumentProxy,
    showBookmarks: boolean
}
export interface TOCItem {
    title: string;
    dest: number
}
interface Outline {
    title: string;
    bold: boolean;
    italic: boolean;
    /**
     * - The color in RGB format to use for
     * display purposes.
     */
    color: Uint8ClampedArray;
    dest: string | Array<any> | null;
    url: string | null;
    unsafeUrl: string | undefined;
    newWindow: boolean | undefined;
    count: number | undefined;
    items: Array</*elided*/ any>;
}
const BookmarkList = ({ pdfDoc, showBookmarks }: BookmarkListProp) => {
    var [toc, setTOC] = useState<TOCItem[]>([])
    async function getTOCItems(outline: Outline): Promise<TOCItem[]> {
        let res: TOCItem[] = []

        if (typeof outline.dest === 'string') {
            let dest = (await pdfDoc.getDestination(outline.dest))
            if (dest) {
                let pageIdx = (await pdfDoc.getPageIndex(dest[0]))
                res.push({
                    dest: pageIdx + 1,
                    title: outline.title
                })
            }

        } else if (Array.isArray(outline.dest)) {
            let pg = outline.dest[0] as number
            res.push({
                dest: pg,
                title: outline.title
            })
        }
        if (outline.items.length > 0) {
            for (let i = 0; i < outline.items.length; i++) {
                const element = outline.items[i] as Outline;
                let subChilden: TOCItem[] = await getTOCItems(element)
                subChilden.forEach((el) => {
                    res.push(el)
                })
            }
        }
        return res
    }
    async function loadTOC(pdfDoc: PDFDocumentProxy): Promise<TOCItem[]> {
        let res: TOCItem[] = []
        let outline = await pdfDoc.getOutline()
        if (outline) {
            for (let i = 0; i < outline.length; i++) {
                const entry = outline[i];
                res = [...res, ...await getTOCItems(entry)]
            }
        }
        return res;
    }
    useEffect(() => {
        loadTOC(pdfDoc!).then((items) => setTOC(items))
    }, [pdfDoc])
    function goToPage(pageNum: number) {
        let el = document.querySelector(`.pageWrapper.page.page-${pageNum}`)
        el?.scrollIntoView()
    }
    return (
        <div className={showBookmarks ? "bookmarkList openedbookmarkList" : 'bookmarkList'}>
            <ul>
                {toc.map((e, idx) =>
                    <li onClick={() => goToPage(e.dest)} key={`TOCItem_${idx}`} className='listTile'>
                        <div className="head">
                            <BookmarkSimpleIcon size={16} fill="" />
                        </div>
                        <div className="ct">
                            {e.title}
                        </div>
                    </li>
                )}
            </ul>
        </div>
    )
}

export default BookmarkList
