import React, { useState } from 'react'
import HomeNav from './HomeNav'
import DocDetails from './DocDetails'
import BookmarkList from './BookmarkList'
import { BookmarkSimpleIcon, ImageIcon } from '@phosphor-icons/react'
import "../css/docTab.scss"
import PDFViewer from './PDFView'
const DocTab = () => {
    //https://ontheline.trincoll.edu/images/bookdown/sample-local-pdf.pdf
    var [file, setFile] = useState<string>(String.raw`file:///C:/Users/James/Downloads/Documents/%20Windell%20Oskay,%20Eric%20Schlaepfer%20-%20Open%20Circuits_%20The%20Inner%20Beauty%20of%20Electronic%20Components%20(2022,%20No%20Starch%20Press)%20-%20libgen.li.pdf`)
    var [pages, setPages] = useState<number>(0)
    var [percentage, setPercentage] = useState<number>(0)
    var [currentPage, setCurrentPage] = useState<number>(1)
    return (
        <div className='doctab'>
            <div className="sideNav">
                <div className="homePageNavigator">
                    <BookmarkSimpleIcon className='icon' size={24} />
                </div>
                <div className="homePageNavigator selected">
                    <ImageIcon className='icon' size={24} />
                </div>
            </div>
            <div className="doctabDetails">
                <BookmarkList></BookmarkList>
                <div className="progressWrapper">
                    <div className="progress">
                    </div>
                </div>
                <PDFViewer onPages={(num: number) => setPages(num)} onPageChange={(num: number) => setCurrentPage(num)} file={file}></PDFViewer>
                <div className="floatingDetails">
                    <DocDetails page={currentPage} pages={pages}></DocDetails>
                </div>
            </div>
        </div>
    )
}




export default DocTab
