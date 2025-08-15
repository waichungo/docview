import "../css/docDetails.scss"
import React from 'react'
import { CaretDownIcon, CaretUpIcon, CornersOutIcon, MagnifyingGlassPlusIcon, MagnifyingGlassMinusIcon } from "@phosphor-icons/react"

type DocDetailsProp = {
    pages: number
    page: number
}
const DocDetails = ({ pages, page }: DocDetailsProp) => {

    return (
        <div className="docDetails">
            <button title="Go down">
                <CaretDownIcon size={16}></CaretDownIcon>
            </button>
            <button title="Go up">
                <CaretUpIcon size={16}></CaretUpIcon>
            </button>
            <div className="pageNum">
                <input value={`${page}`} type="text" /> of <span>{pages}</span>
            </div>
            <button title="Zoom in">
                <MagnifyingGlassPlusIcon size={16}></MagnifyingGlassPlusIcon>
            </button>
            <button title="Zoom out">
                <MagnifyingGlassMinusIcon size={16} ></MagnifyingGlassMinusIcon>
            </button>
            <button title="FullScreen">
                <CornersOutIcon size={16}></CornersOutIcon>
            </button>
        </div>
    )
}

export default DocDetails
