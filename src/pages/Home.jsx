import { useEffect, useState } from "react";
import api from "../api/axios";
import { Link } from "react-router";
import { toast } from "react-hot-toast";
import { VoiceButton } from "../components/VoiceButton";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);

  const loadProducts = async () => {
    const res = await api.get(
      `/products?search=${search}&category=${category}`
    );
    let data = res.data;
    if (minPrice != null) data = data.filter((p) => p.price >= minPrice);
    if (maxPrice != null) data = data.filter((p) => p.price <= maxPrice);
    setProducts(data);
  };

  useEffect(() => {
    loadProducts();
  }, [search, category, minPrice, maxPrice]);

  const addToCart = async (productId, quantity = 1) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please log in to add items to your cart.");
      return;
    }

    // If quantity > 1, call add multiple times (backend increments quantity by 1)
    let res;
    for (let i = 0; i < quantity; i++) {
      res = await api.post(`/cart/add`, { userId, productId });
    }

    const total = res.data.cart.items.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0
    );

    localStorage.setItem("cartCount", total);
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const removeFromCart = async (productId) => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      alert("Please log in to remove items from your cart.");
      return;
    }

    await api.post(`/cart/remove`, { userId, productId });
    const res = await api.get(`/cart/${userId}`);
    const total = res.data.items.reduce((sum, item) => sum + item.quantity, 0);
    localStorage.setItem("cartCount", total);
    window.dispatchEvent(new Event("cartUpdated"));
    toast.success('Product removed from cart')
  };

  const numberWords = {
    zero:0, one:1, two:2, three:3, four:4, five:5, six:6, seven:7, eight:8, nine:9, ten:10,
    eleven:11, twelve:12
  };

  const extractProductName = (text, verb) => {
    if (!text) return "";
    let t = text.toLowerCase();
    const idx = t.indexOf(verb);
    if (idx === -1) return "";
    let name = t.slice(idx + verb.length).trim();
    // remove common trailing words
    name = name.replace(/^(the|a|an)\s+/i, "");
    name = name.replace(/\s+(to cart|from cart|cart)$/i, "");
    return name.trim();
  };

  const parseQuantityAndName = (text, verb) => {
    const t = (text || '').toLowerCase();
    // find numeric digits
    const digitMatch = t.match(/(\d+)/);
    let qty = 1;
    if (digitMatch) qty = parseInt(digitMatch[1], 10);
    else {
      // check for word numbers
      const words = t.split(/\s+/);
      for (let w of words) {
        if (numberWords[w] !== undefined) { qty = numberWords[w]; break; }
      }
    }

    let name = extractProductName(t, verb);
    // if name starts with a number word, strip it
    name = name.replace(/^(\d+|zero|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+/i, '');
    return { qty, name };
  };
  
  const parsePriceFilter = (text) => {
    if (!text) return { min: null, max: null, cleaned: text };
    let t = text.toLowerCase();
    let min = null;
    let max = null;

    // between X and Y
    const between = t.match(/between\s+(\d+)\s+(and|to|-)\s+(\d+)/);
    if (between) {
      min = parseInt(between[1], 10);
      max = parseInt(between[3], 10);
      t = t.replace(between[0], '');
      return { min, max, cleaned: t.trim() };
    }

    // range like 50 to 100
    const range = t.match(/(\d+)\s*(to|-)\s*(\d+)/);
    if (range) {
      min = parseInt(range[1], 10);
      max = parseInt(range[3], 10);
      t = t.replace(range[0], '');
      return { min, max, cleaned: t.trim() };
    }

    // under / below / less than
    const under = t.match(/(under|below|less than)\s+\$?(\d+)/);
    if (under) {
      max = parseInt(under[2], 10);
      t = t.replace(under[0], '');
      return { min, max, cleaned: t.trim() };
    }

    // over / above / more than / greater than
    const over = t.match(/(over|above|more than|greater than)\s+\$?(\d+)/);
    if (over) {
      min = parseInt(over[2], 10);
      t = t.replace(over[0], '');
      return { min, max, cleaned: t.trim() };
    }

    return { min: null, max: null, cleaned: t.trim() };
  };
  const handleGlobalVoice = async (text) => {
    const t = (text || "").toLowerCase();

    // search / filter commands
    const searchVerbs = ["search for", "search", "find", "show me", "show", "look for", "display"];
    const addVerbs = ["add", "i want to buy", "i want", "i buy", "buy", "purchase"];
    const removeVerbs = ["remove", "delete", "discard", "discarded", "remove from cart", "delete from cart", "discard from cart"];

    // detect price filters first
    const priceInfo = parsePriceFilter(t);
    const matchedSearch = searchVerbs.find((v) => t.includes(v));
    const matchedAdd = addVerbs.find((v) => t.includes(v));
    const matchedRemove = removeVerbs.find((v) => t.includes(v));

    // If the user asked to search / filter by title or price
    if (matchedSearch || priceInfo.min != null || priceInfo.max != null) {
      // determine product name (if any)
      let name = '';
      if (matchedSearch) name = extractProductName(t, matchedSearch) || priceInfo.cleaned;
      else name = priceInfo.cleaned;

      // update states
      setSearch(name || '');
      setMinPrice(priceInfo.min);
      setMaxPrice(priceInfo.max);
      if (priceInfo.min != null || priceInfo.max != null) {
        if (priceInfo.min != null && priceInfo.max != null) toast.success(`Filtering price between ${priceInfo.min} and ${priceInfo.max}`);
        else if (priceInfo.min != null) toast.success(`Filtering price >= ${priceInfo.min}`);
        else toast.success(`Filtering price <= ${priceInfo.max}`);
      } else if (name) {
        toast.success(`Searching for '${name}'`);
      }
      return;
    }

    if (matchedAdd) {
      const { qty, name } = parseQuantityAndName(t, matchedAdd);
      if (!name) {
        toast.error("Say 'add <quantity> <product name>' or 'add <product name>'");
        return;
      }
      const res = await api.get(`/products?search=${encodeURIComponent(name)}`);
      const found = res.data[0];
      if (found) {
        await addToCart(found._id, qty);
        toast.success(`Added ${qty} x ${found.title}`);
      } else {
        toast.error(`No product found for '${name}'`);
      }
    } else if (matchedRemove) {
      const { qty, name } = parseQuantityAndName(t, matchedRemove);
      if (!name) {
        toast.error("Say 'remove <quantity> <product name>' or 'remove <product name>'");
        return;
      }
      const res = await api.get(`/products?search=${encodeURIComponent(name)}`);
      const found = res.data[0];
      if (found) {
        // reduce quantity by qty or remove
        const userId = localStorage.getItem('userId');
        if (!userId) {
          toast.error('Please login first');
          return;
        }
        const cartRes = await api.get(`/cart/${userId}`);
        const item = cartRes.data.items.find((i) => i.productId._id === found._id || i.productId._id === found.id);
        if (!item) {
          toast.error('Product not in cart');
          return;
        }
        const newQty = item.quantity - qty;
        if (newQty > 0) {
          await api.post('/cart/update', { userId, productId: found._id, quantity: newQty });
          const updatedCart = await api.get(`/cart/${userId}`);
          localStorage.setItem('cartCount', updatedCart.data.items.reduce((s, i) => s + i.quantity, 0));
          window.dispatchEvent(new Event('cartUpdated'));
          toast.success(`Reduced ${found.title} by ${qty}`);
        } else {
          await api.post('/cart/remove', { userId, productId: found._id });
          const updatedCart = await api.get(`/cart/${userId}`);
          localStorage.setItem('cartCount', updatedCart.data.items.reduce((s, i) => s + i.quantity, 0));
          window.dispatchEvent(new Event('cartUpdated'));
          toast.success(`Removed ${found.title}`);
        }
      } else {
        toast.error(`No product found for '${name}'`);
      }
    }
  };
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Search */}
      <div className="mb-6 flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
        {/* Search Input */}
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 border border-gray-900 px-4 py-2 rounded-md 
               focus:outline-none focus:ring-2 focus:ring-blue-700"
        />

        {/* Category Filter */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full md:w-1/4 border border-gray-300 px-4 py-2 rounded-md 
               focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="grocery">grocery</option>
          <option value="electronics">electronics</option>
          <option value="chlothing">clothing</option>
        </select>

        <div className="flex items-center">
          <VoiceButton onResult={handleGlobalVoice} />
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="bg-white rounded-xl shadow hover:shadow-lg transform hover:-translate-y-2 transition p-4 flex flex-col">
            <Link to={`/product/${product._id}`} className="group">
              <div className="h-44 flex items-center justify-center bg-gray-50 rounded-md overflow-hidden">
                <img src={product.image} alt={product.title} className="max-h-40 object-contain group-hover:scale-105 transition-transform" />
              </div>

              <h2 className="mt-4 text-lg font-semibold truncate">{product.title}</h2>
            </Link>

            <p className="text-sm text-gray-500 mt-2 line-clamp-2">{product.description || ''}</p>

            <div className="mt-auto flex items-center justify-between pt-4">
              <div>
                <div className="text-gray-800 font-bold text-lg">${product.price}</div>
                {product.category && <div className="text-xs text-gray-400">{product.category}</div>}
              </div>

              <button onClick={() => addToCart(product._id)} className="inline-flex items-center px-3 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600">Add</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
