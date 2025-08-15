import React from 'react'
import "../css/history.scss"
import { AlarmIcon, UserIcon, TrashIcon } from "@phosphor-icons/react"
import { NativeObject } from '../shared'
const History = () => {
    const items: NativeObject[] = []
    for (let i = 0; i < 20; i++) {
        items.push({})

    }
    const paginationItems: NativeObject[] = []
    for (let i = 0; i < 5; i++) {
        paginationItems.push({})

    }
    return (
        <div className='history'>
            <img className='historyTabBg' src="/assets/bg.jpg"></img>
            <h3>History</h3>
            <div className="historyContent">
                <div className="pagination">
                    <div className="items">
                        Showing 20 of 430 entries
                    </div>
                    <div className="paginator">
                        <div className="paginationItems">
                            {
                                paginationItems.map((e,i) =>
                                    <div className="paginationItem">
                                        <div className="ct">{i+1}</div>
                                    </div>
                                )
                            }

                        </div>
                    </div>
                </div>
                <div className="historyItems">
                    {
                        items.map(e =>
                            <div className="historyItem">
                                <div className="lead">
                                    <div className="historyPic">
                                        {/* <UserIcon size={48} /> */}
                                        <img src="https://m.media-amazon.com/images/I/51nU2BYvLHL._SY445_SX342_.jpg" alt="cover" />
                                    </div>
                                    <div className="docDetails">
                                        <h3 className="name">
                                            The Dictionary of Body Language: A Field Guide to Human Behavior
                                        </h3>

                                        <div className="accessDate">
                                            Accessed on: <i> <b>16th Aug 2025</b> </i>
                                        </div>
                                    </div>
                                </div>
                                <div className="action">
                                    {/* <input type="checkbox" /> */}
                                    <button>
                                        <TrashIcon className='icon' size={24} />
                                    </button>
                                </div>
                            </div>
                        )
                    }

                </div>
            </div>
        </div>
    )
}

export default History
