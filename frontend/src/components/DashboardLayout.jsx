import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import InstallApp from './InstallApp';

const DashboardLayout = () => {
    const [isOpen, setIsOpen] = useState(window.innerWidth >= 1024);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // On desktop, the sidebar is permanently open (static)
            if (mobile) {
                setIsOpen(false);
            } else {
                setIsOpen(true);
            }
        };
        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="flex min-h-screen bg-[var(--bg-base)] transition-colors duration-500">
            <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} isMobile={isMobile} />
            <main
                className={`flex-1 transition-all duration-300 ease-in-out ${isMobile ? 'pl-0' : 'pl-[280px]'}`}
            >
                <div className="p-8 max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
            <InstallApp />
        </div>
    );
};

export default DashboardLayout;
