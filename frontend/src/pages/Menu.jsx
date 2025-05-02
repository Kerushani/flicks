import { useState } from "react"
import api from "../api"
import "../style/Menu.css"

const sampleMenu = [
    "Latte",
    "Cappuccino",
    "Espresso",
    "Mocha",
    "Iced Americano",
    "Chai Latte",
    "Flat White",
    "Cold Brew",
    "Macchiato",
    "Matcha Latte",
    "Hot Chocolate",
    "Vanilla Latte",
    "Caramel Macchiato",
    "Pumpkin Spice Latte",
    "Iced Coffee",
    "Affogato",
    "Tea – Earl Grey",
    "Tea – Green",
    "Tea – Peppermint",
    "Croissant",
    "Blueberry Muffin",
    "Chocolate Chip Cookie",
    "Banana Bread",
    "Bagel with Cream Cheese",
    "Avocado Toast"
  ];
  
const Menu = () => {

    const [selectedItems, setSelectedItems] = useState([])
    const [customerName, setCustomerName] = useState("")

    const toggleItem = (item) => {
        setSelectedItems((prev) =>
            prev.includes(item)
            ? prev.filter((i) => i !== item)
            : [...prev, item]
        )
    }

    const submitOrder = (e) => {
        e.preventDefault()
        if (!selectedItems.length) return alert("Select at least one item")

        const orderDetails = selectedItems.join(", ")

        api.post("/api/notes/", {
            title: customerName,
            content: orderDetails,
        }).then((res) => {
            if (res.status === 201) {
                alert("Order submitted!")
                setSelectedItems([])
                setCustomerName("")
            } else {
                alert("Failed to submit order.")
            }
        })
    }

    return(
        <>

        </>
    )
}

export default Menu