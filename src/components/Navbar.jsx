import {Link, useNavigate} from "react-router";
import { useState, useEffect } from "react";
import api from "../api/axios";
// import  {VoiceButton}  from "./VoiceButton";

export default function Navbar({onVoiceResult}) {
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);
    const userId = localStorage.getItem("userId");

    useEffect(() => {
        const loadCart = async () => {
            if (!userId) return setCartCount(0);

            const res = await api.get(`/cart/${userId}`);
            const total = res.data.items.reduce(
                (sum,item) => sum + item.quantity, 0
            );
            setCartCount(total);
        }
        loadCart();
        window.addEventListener("cartUpdated", loadCart);
        
        return () => {
            window.removeEventListener("cartUpdated", loadCart);
        }
    }, [userId]);

    const logout = () => {
        localStorage.clear();
        setCartCount(0);
        navigate("/login");
    }

    return (
        <nav className="bg-white/70 backdrop-blur sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <Link to="/" className="flex items-center gap-3">
                        <div className="bg-indigo-500 text-white rounded-md px-3 py-1 font-bold">E-Cart</div>
                        <span className="hidden sm:block text-sm text-slate-600">Quality Products</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-slate-700 hover:text-slate-900 hidden sm:inline">Home</Link>
                        <Link to="/cart" className="relative inline-flex items-center p-2 rounded-md hover:bg-slate-100">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4"/></svg>
                            {cartCount > 0 && <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-600 text-white">{cartCount}</span>}
                        </Link>

                        {!userId ? (
                            <>
                                <Link to="/login" className="text-sm text-slate-700 hover:text-slate-900">Login</Link>
                                <Link to="/signup" className="ml-2 inline-flex items-center px-3 py-1 rounded-md bg-sky-500 text-white text-sm hover:bg-sky-600">Signup</Link>
                            </>
                        ) : (
                            <button onClick={logout} className="text-sm text-slate-700 hover:text-slate-900">Logout</button>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}