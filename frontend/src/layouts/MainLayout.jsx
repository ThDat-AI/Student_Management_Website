// layouts/Mainlayout.jsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import SharedNavbar from '../components/SharedNavbar';
import ProfileModal from '../components/ProfileModal';
import { useLayout } from '../contexts/LayoutContext';
import { useAuth } from '../contexts/AuthContext';
import { Spinner, Container } from 'react-bootstrap';

const MainLayout = () => {
    const [showProfileModal, setShowProfileModal] = useState(false);
    const { pageTitle } = useLayout();
    const { user, logout, loading } = useAuth();

    const getDashboardPath = (role) => {
        switch (role) {
            case 'BGH': return '/bgh';
            case 'GiaoVien': return '/giaovien';
            case 'GiaoVu': return '/giaovu';
            default: return '/';
        }
    };

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center vh-100">
                <Spinner animation="border" variant="primary" />
            </Container>
        );
    }

    return (
        <div className="d-flex flex-column min-vh-100">
            <SharedNavbar
                pageTitle={pageTitle}
                user={user}
                dashboardPath={getDashboardPath(user?.role)}
                onLogout={logout}
                onProfileClick={() => setShowProfileModal(true)}
            />
            <main className="flex-grow-1">
                <Outlet />
            </main>
            {showProfileModal && (
                <ProfileModal
                    show={showProfileModal}
                    onHide={() => setShowProfileModal(false)}
                />
            )}
        </div>
    );
};

export default MainLayout;