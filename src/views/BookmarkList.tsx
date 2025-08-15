import React from 'react'
import "../css/bookmarkList.scss"
import { NativeObject } from '../shared'
import { BookmarkSimpleIcon } from "@phosphor-icons/react"
const BookmarkList = () => {
    var elements: NativeObject[] = [];
    for (let i = 0; i < 5; i++) {
        elements.push({
            title: `Bookmark item ${i + 1} with extended text context to test multilines`
        })
    }
    return (
        <div className='bookmarkList'>
            <ul>
                {elements.map(e =>
                    <li className='listTile'>
                        <div className="head">
                            <BookmarkSimpleIcon size={24} fill="" />
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
