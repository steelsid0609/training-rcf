// src/layouts/AppLayout.jsx
import React, { useState, useEffect } from "react"; 
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase.js"; 
import { doc, getDoc } from "firebase/firestore"; 
import { ROLES, UI_STYLES } from "../utils/constants";
import "../../src/App.css"; 
import bgImage from "../assets/left-bg.jpg"; 

const NavItem = React.memo(({ to, label }) => (
    <NavLink
        to={to}
        style={({ isActive }) => ({
            display: "block",
            padding: "12px 15px",
            borderRadius: "8px",
            textDecoration: "none",
            fontSize: "15px",
            marginBottom: "6px",
            fontWeight: isActive ? "700" : "500",
            background: isActive ? "rgba(255, 255, 255, 0.2)" : "transparent", 
            color: "#fff",
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            boxShadow: isActive ? "0 4px 6px rgba(0,0,0,0.1)" : "none",
            backdropFilter: isActive ? "blur(5px)" : "none",
            borderLeft: isActive ? `4px solid ${UI_STYLES.PRIMARY_GREEN}` : "4px solid transparent",
            transition: "all 0.2s ease"
        })}
    >
        {label}
    </NavLink>
));

const NavigationLinks = ({ role }) => {
    switch (role) {
        case ROLES.STUDENT:
            return (
                <>
                    <NavItem to="/student/dashboard" label="Dashboard" />
                    <NavItem to="/student/applications" label="My Applications" />
                    <NavItem to="/student/college-details" label="College Details" />
                    <NavItem to="/student/posting-letter" label="Posting Letter" />
                    <NavItem to="/student/cover-letter" label="Documents" />
                    <div style={linkGroupDivider}>Profile</div>
                    <NavItem to="/student/basic-details" label="Edit Profile" />
                    <NavItem to="/student/change-password" label="Change Password" />
                </>
            );
        case ROLES.SUPERVISOR:
            return (
                <>
                    <NavItem to="/supervisor/dashboard" label="Dashboard" />
                    <div style={linkGroupDivider}>Under Process Applications</div>
                    <NavItem to="/supervisor/applications/pending" label="Pending Applications" />
                    <NavItem to="/supervisor/applications/all" label="Payment Verification" />
                    <NavItem to="/supervisor/1-gate-pass" label="1-Day Gate Pass" />
                    <NavItem to="/supervisor/onboarding" label="Physical Joining" />
                    <NavItem to="/supervisor/safety-training" label="Safety Training" />
                    <NavItem to="/supervisor/issue-postings" label="Posting Letters" />
                    <NavItem to="/supervisor/current-trainees" label="Active Trainees" />
                    <NavItem to="/supervisor/applications/rejected" label="Rejected Applications" />
                    <div style={linkGroupDivider}>All Applications View</div>
                    <NavItem to="/supervisor/users" label="Student Users" />
                    <NavItem to="/supervisor/applications/master" label="All Applications" />
                    <div style={linkGroupDivider}>Institute Data</div>
                    <NavItem to="/supervisor/colleges/temp" label="College Requests" />
                    <NavItem to="/supervisor/colleges/master" label="College Master List" />
                    <NavItem to="/supervisor/verify-colleges" label="College Details Verification" />
                </>
            );
        case ROLES.ADMIN:
            return (
                <>
                    <NavItem to="/admin/dashboard" label="Dashboard" />
                    <div style={linkGroupDivider}>Configuration</div>
                    <NavItem to="/admin/slots" label="Training Slots" />
                    <NavItem to="/admin/users" label="User Management" />
                    <div style={linkGroupDivider}>Workflow</div>
                    <NavItem to="/admin/applications/pending" label="Pending Applications" />
                    <NavItem to="/admin/applications/payments" label="Payment Verification" />
                    <NavItem to="/admin/applications/trainees" label="Active Trainees" />
                    <NavItem to="/admin/applications/completed" label="Completed Archive" />
                    <NavItem to="/admin/applications" label="All Applications" />
                </>
            );
        default:
            return null;
    }
};

export default function AppLayout() {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null); 

    useEffect(() => {
        if (user) {
            const fetchProfile = async () => {
                try {
                    const snap = await getDoc(doc(db, "users", user.uid));
                    if (snap.exists()) setProfile(snap.data());
                } catch (err) {
                    console.error("Error fetching sidebar profile:", err);
                }
            };
            fetchProfile();
        }
    }, [user]);

    const handleLogout = async () => {
        try { await signOut(auth); navigate("/"); } catch (err) { console.error(err); }
    };

    const handleImageClick = () => {
        if (profile?.photoURL) {
            window.open(profile.photoURL, "_blank");
        }
    };

    if (!role) return null; 

    return (
        <div style={layoutStyles.mainContainer}>
            <aside style={layoutStyles.sidebar}>
                <div style={layoutStyles.overlay}></div>

                <div style={layoutStyles.sidebarContent}>
                    <div style={layoutStyles.header}>
                        <div style={layoutStyles.roleTitle}>{role.toUpperCase()}</div>
                    </div>

                    <nav style={layoutStyles.nav}>
                        <NavigationLinks role={role} />
                    </nav>

                    <div style={layoutStyles.footer}>
                        <div style={{ textAlign: "center", marginBottom: 15 }}>
                            <img
                                src={profile?.photoURL || "https://via.placeholder.com/60"}
                                alt="User Profile"
                                onClick={handleImageClick}
                                style={{
                                    width: 65,
                                    height: 65,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                    cursor: profile?.photoURL ? "pointer" : "default",
                                    border: `2px solid ${UI_STYLES.PRIMARY_GREEN}`,
                                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)"
                                }}
                            />
                        </div>

                        <div style={layoutStyles.emailDisplay}>
                            {user?.email}
                        </div>
                        <button onClick={handleLogout} className="btn-sidebar">
                            <span>⏻</span> Sign Out
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={layoutStyles.mainContent}>
                <div style={layoutStyles.contentWrapper}>
                    <Outlet />
                </div>
            </main>
        </div>
    );
}

const layoutStyles = {
    mainContainer: { 
        display: "flex", 
        height: "100vh", // Fixed height to lock viewport
        width: "100vw", 
        overflow: "hidden" // Prevents body-level scrolling
    },
    sidebar: {
        width: 270,
        backgroundImage: `url(${bgImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#2c3e50", 
        color: "#fff",
        boxShadow: "4px 0 15px rgba(0,0,0,0.2)",
        height: "100%", 
        flexShrink: 0,
        position: "relative",
    },
    overlay: {
        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0, 0, 0, 0.4)", 
        zIndex: 0
    },
    sidebarContent: { 
        position: "relative", zIndex: 1, 
        display: "flex", 
        flexDirection: "column", 
        height: "100vh", 
        padding: "25px 15px",
    },
    header: { 
        marginBottom: 30, 
        textAlign: "center", 
        borderBottom: "1px solid rgba(255,255,255,0.3)", 
        paddingBottom: 20 
    },
    roleTitle: { 
        fontSize: 22, 
        fontWeight: "800", 
        color: "#fff",
        textShadow: "0 2px 4px rgba(0,0,0,0.6)"
    },
    nav: { 
        flex: 1, 
        overflowY: "auto", // Allows nav links to scroll internally if they overflow
        paddingRight: "5px",
        msOverflowStyle: "none", // IE and Edge
        scrollbarWidth: "none" // Firefox
    },
    footer: { 
        marginTop: "auto",
        paddingTop: 15,
        borderTop: "1px solid rgba(255,255,255,0.2)"
    },
    emailDisplay: { 
        fontSize: 13, 
        textAlign: "center", 
        marginBottom: 10, 
        color: "#fff", 
        textShadow: "0 1px 2px rgba(0,0,0,0.8)" 
    },
    mainContent: { 
        flex: 1, 
        padding: "30px", 
        overflowY: "auto", // Enables scrolling only for the right side content
        height: "100vh", 
        background: "#ffffff" 
    },
    contentWrapper: { 
        maxWidth: "1200px", 
        margin: "0 auto" 
    }
};

const linkGroupDivider = { 
    margin: "15px 0 5px 15px", 
    fontSize: "11px", 
    color: "#ddd", 
    textTransform: "uppercase" 
};