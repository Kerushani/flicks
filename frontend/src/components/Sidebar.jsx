import { NavLink } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../api";
import "../style/Sidebar.css";

const Sidebar = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const dropdownRef = useRef(null);

  const getLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get("/api/profile/");
        setCurrentUser(response.data);
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="sidebar">
      <h2 className="logo">Flicks</h2>
      <nav>
        <NavLink to="/" end className={getLinkClass}>Home</NavLink>
        <NavLink to="/spotlight" className={getLinkClass}>Spotlight</NavLink>
         {/* TO DO: Add chat functionality */}
        {/* <NavLink to="/menu" className={getLinkClass}>Chat</NavLink> */}
        <div className="profile-menu" ref={dropdownRef}>
          <button 
            className="profile-button" 
            onClick={() => setShowDropdown(!showDropdown)}
          >
            <img 
              src={currentUser?.profile?.avatar || `https://api.dicebear.com/7.x/personas/svg?seed=${currentUser?.username}`}
              alt="Profile" 
              className="profile-avatar"
            />
          </button>
          {showDropdown && (
            <div className="dropdown-menu">
              <NavLink to="/profile" className="dropdown-item">
                Profile
              </NavLink>
              <NavLink to="/logout" className="dropdown-item">
                Logout
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;
