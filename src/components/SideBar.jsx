import React from 'react';
import { Menubar } from 'primereact/menubar';
import 'primereact/resources/themes/saga-blue/theme.css';  // Choose a theme
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const SideBar = () => {
    const items = [
        {
            label: 'Home',
            icon: 'pi pi-fw pi-home',
            command: () => { window.location.hash = "/home"; }
        },
        {
            label: 'Travel Desk',
            icon: 'pi pi-fw pi-briefcase',
            command: () => { window.location.hash = "/travel-desk"; }
        },
        {
            label: 'Claims',
            icon: 'pi pi-fw pi-file',
            command: () => { window.location.hash = "/claims"; }
        }
    ];

    return (
        <div className="h-screen w-64 bg-gray-100 fixed flex flex-col justify-start">
            <Menubar model={items} className="w-full border-none rounded-none" />
        </div>
    );
}

export default SideBar;