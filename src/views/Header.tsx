import React from 'react'
import '../css/header.scss'
import { UserIcon } from "@phosphor-icons/react"
const Header = () => {
    return (
        <div className='header'>
            <div className="logo-section">
                <div className="img-wrapper">
                    <img src="/assets/logo.png"/>
                </div>
                <h3>DOCVIEW</h3>
            </div>
            <nav>
                <ul>
                    <li>Home</li>
                    <li>History</li>
                    <li>Settings</li>
                </ul>
            </nav>
            <div className="profile-button">
                <button>
                    <div className="name">
                        Caleb Kingori
                    </div>
                    <div className="profile-pic">
                        <UserIcon size={16} />
                    </div>
                </button>
            </div>
        </div>

    )
}

export default Header
