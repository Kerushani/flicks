import { NavLink } from "react-router-dom";
import "../style/Sidebar.css";

const Sidebar = () => {
  const getLinkClass = ({ isActive }) =>
    isActive ? "nav-link active" : "nav-link";

  return (
    <div className="sidebar">
      <h2 className="logo">☕ Cozy Café</h2>
      <nav>
        <NavLink to="/" end className={getLinkClass}>Home</NavLink>
        <NavLink to="/active-orders" className={getLinkClass}>Active Orders</NavLink>
        <NavLink to="/menu" className={getLinkClass}>Menu</NavLink>
        <NavLink to="/order-history" className={getLinkClass}>Order History</NavLink>
      </nav>
    </div>
  );
};

export default Sidebar;
