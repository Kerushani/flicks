import { useState, useEffect } from "react"
import api from "../api"
import Note from "../components/Note"
import "../style/Home.css"

const ActiveOrders = () => {
    const [orders, setOrders] = useState([]);
    const [orderDetails, setOrderDetails] = useState("");
    const [customerName, setCustomerName] = useState("")

    useEffect(() => {
        getOrders();
    }, [])

    const getOrders = () => {
        api.get("/api/notes/")
        .then((res) => res.data)
        .then((data) => {
            setOrders(data)
            console.log(data)
        })
        .catch((err) => alert("Failed to post."))
    }

    const deleteOrder = (id) => {
        api.delete(`/api/notes/delete/${id}`).then((res) => {
            if (res.status !== 204) alert("Failed to remove post.")
            getOrders();
        }).catch((error) => alert("Error deleting post."))
    };

    const createOrder = (e) => {
        e.preventDefault()
        api.post("/api/notes/", {
            title: customerName,
            content: orderDetails
        }).then((res) => {
            if (res.status === 201) alert("Post created!")
            else alert("Failed to submit post.")
            getOrders();
        }).catch((error) => alert("Error submitting post."))
    }

    return (
        <div className="home-page">
            <header className="cafe-header">
                <h1> Skill Swap Network</h1>
                <p className="subtitle">Skill Swap Network – Build Skills. Build Connections.</p>
            </header>

            <section className="orders-section">
                <h2>📋 Recent Posts</h2>
                {orders.length > 0 ? (
                    orders.map((order) => (
                        <Note note={order} onDelete={deleteOrder} key={order.id} />
                    ))
                ) : (
                    <p className="empty-text">No orders yet. Time for a coffee break!</p>
                )}
            </section>

            <section className="new-order-section">
                <h2>➕ Add Post</h2>
                <form onSubmit={createOrder}>
                    <label htmlFor="customerName">Subject</label>
                    <input
                        type="text"
                        id="customerName"
                        required
                        onChange={(e) => setCustomerName(e.target.value)}
                        value={customerName}
                    />

                    <label htmlFor="orderDetails">Description</label>
                    <textarea
                        id="orderDetails"
                        name="orderDetails"
                        required
                        value={orderDetails}
                        onChange={(e) => setOrderDetails(e.target.value)}
                    ></textarea>

                    <input type="submit" value="Add to Queue" />
                </form>
            </section>
        </div>
    )
}

export default ActiveOrders