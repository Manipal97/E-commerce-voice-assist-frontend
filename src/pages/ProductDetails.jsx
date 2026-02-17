import { useEffect, useState } from "react";
import api from "../api/axios";
import { useParams } from "react-router";
import { toast } from "react-hot-toast";
import { VoiceButton } from "../components/VoiceButton";

export default function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);

  const loadProduct = async () => {
    const res = await api.get("/products/");
    const p = res.data.find((item) => item._id === id);
    setProduct(p);
  };

  const removeFromCart = async (quantity = null) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login first");
      return;
    }

    // Fetch current cart to determine existing quantity
    const cartRes = await api.get(`/cart/${userId}`);
    const item = cartRes.data.items.find((i) => i.productId._id === product._id || i.productId._id === product.id);
    if (!item) {
      toast.error("Product not in cart");
      return;
    }

    if (!quantity) {
      await api.post("/cart/remove", { userId, productId: product._id });
      toast.success("Product removed from cart");
    } else {
      const newQty = item.quantity - quantity;
      if (newQty > 0) {
        await api.post('/cart/update', { userId, productId: product._id, quantity: newQty });
        toast.success(`Reduced quantity by ${quantity}`);
      } else {
        await api.post('/cart/remove', { userId, productId: product._id });
        toast.success('Product removed from cart');
      }
    }

    const res = await api.get(`/cart/${userId}`);
    const total = res.data.items.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem('cartCount', total);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  useEffect(() => {
    loadProduct();
  }, []);
  const numberWords = { zero:0, one:1, two:2,to:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10, eleven:11, twelve:12 };

  const parseQuantity = (text) => {
    if (!text) return 1;
    const t = text.toLowerCase();
    const digitMatch = t.match(/(\d+)/);
    if (digitMatch) return parseInt(digitMatch[1], 10);
    const words = t.split(/\s+/);
    for (let w of words) {
      if (numberWords[w] !== undefined) return numberWords[w];
    }
    return 1;
  };

  const addToCart = async (quantity = 1) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please login first");
      return;
    }
    let res;
    for (let i = 0; i < quantity; i++) {
      res = await api.post("/cart/add", { userId, productId: product._id });
    }

    const total = res.data.cart.items.reduce((sum, item) => sum + item.quantity, 0);

    localStorage.setItem("cartCount", total);
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  if (!product) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-center">
          <img src={product.image} alt={product.title} className="max-h-72 object-contain" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">{product.title}</h1>
          <p className="text-gray-700 mt-3">{product.description}</p>
          <p className="text-2xl font-semibold mt-4">${product.price}</p>

          <div className="mt-6 flex gap-3">
            <button onClick={addToCart} className="px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">Add to Cart</button>
            <button onClick={removeFromCart} className="px-4 py-2 border border-slate-200 rounded-md text-slate-700">Remove</button>
            <div>
              <VoiceButton onResult={(text) => {
                const t = (text || "").toLowerCase();
                const qty = parseQuantity(t);
                const addVerbs = ["add", "i want to buy", "i want", "i buy", "buy", "purchase"];
                const removeVerbs = ["remove","i want to remove","i want to delete","delete", "discard", "discarded", "remove from cart", "delete from cart", "discard from cart"];
                const matchedAdd = addVerbs.find(v => t.includes(v));
                const matchedRemove = removeVerbs.find(v => t.includes(v));
                if (matchedAdd) addToCart(qty);
                else if (matchedRemove) removeFromCart(qty);
              }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
