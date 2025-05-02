import { NavLink } from "react-router-dom";
import "../style/Sidebar.css";

const Sidebar = () => {
  const getLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div className="sidebar">
      <h2 className="logo">SS 🌍</h2>
      <nav>
        <NavLink to="/" end className={getLinkClass}>Home</NavLink>
        <NavLink to="/active-orders" className={getLinkClass}>Posts</NavLink>
        <NavLink to="/menu" className={getLinkClass}>Chat</NavLink>
        <NavLink to="/order-history" className={getLinkClass}>Profile</NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
