// pages/Home.jsx
import { Outlet } from "react-router-dom"
import Sidebar from "../components/Sidebar"
import "../style/Home.css"
import "../style/Sidebar.css"

function Home() {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  )
}

export default Home
