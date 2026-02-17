import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router";

export default function Cart() {
  const userId = localStorage.getItem("userId");
  const [cart, setCart] = useState(null);
  const navigate = useNavigate();

  //Load cart data
  const loadCart = async () => {
    if (!userId) return;
    const res = await api.get(`/cart/${userId}`);
    setCart(res.data);
  };

  useEffect(() => {
    loadCart();
  }, []);

  const removeItem = async (productId) => {
    await api.post(`/cart/remove`, { userId, productId });
    loadCart();
    window.dispatchEvent(new Event("cartUpdated"));
  };

  //Update item quantity
  const updateQty = async (productId, quantity) => {
    if (quantity === 0) {
      await removeItem(productId);
      return;
    }

    await api.post(`/cart/update`, { userId, productId, quantity });
    loadCart();
    window.dispatchEvent(new Event("cartUpdated"));
  };

  if (!cart) {
    return <div className="p-6 text-center">
      <h1 className="font-bold text-3xl">loading...</h1>
    </div>;
  }

  const total = cart.items.reduce(
    (sum, item) => sum + item.productId.price * item.quantity,
    0
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Cart</h1>

      {cart.items.length === 0 ? (
        <div className="text-2xl">Your cart is empty.</div>
      ) : (
        <div className="space-y-4">
          {cart.items.map((item) => (
            <div key={item.productId._id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <img src={item.productId.image} alt={item.productId.title} className="w-20 h-20 object-cover rounded" />
                <div>
                  <h2 className="text-lg font-semibold">{item.productId.title}</h2>
                  <p className="text-gray-600">${item.productId.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
                  <button onClick={() => updateQty(item.productId._id, item.quantity - 1)} className="px-2">-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQty(item.productId._id, item.quantity + 1)} className="px-2">+</button>
                </div>

                <div className="font-semibold">${(item.productId.price * item.quantity).toFixed(2)}</div>

                <button onClick={() => removeItem(item.productId._id)} className="text-red-500">Remove</button>
              </div>
            </div>
          ))}

          <div className="text-right mt-4">
            <h2 className="text-xl font-bold">Total: ${total.toFixed(2)}</h2>
          </div>
          <button onClick={()=> navigate("/checkout-address")} className="w-full bg-sky-500 text-white p-2 rounded">
            Proceed to Checkout
          </button>
        </div>
      )}
    </div>
  );
}
