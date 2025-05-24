import Form from "../components/Form"
import { Link } from "react-router-dom"
import "../style/Auth.css"

function Login(){
    return (
        <div className="auth-container">
            <Form route="/api/token/" method="login"/>
            <p className="auth-switch">
                Don't have an account? <Link to="/register">Register here</Link>
            </p>
        </div>
    )
}

export default Login