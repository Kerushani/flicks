import Form from "../components/Form"
import { Link } from "react-router-dom"
import "../style/Auth.css"

function Register(){
    return (
        <div className="auth-container">
            <Form route="/api/user/register/" method="register" />
            <p className="auth-switch">
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    )
}

export default Register