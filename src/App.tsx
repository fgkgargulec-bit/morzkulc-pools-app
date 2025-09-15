import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Terminy from "./pages/Terminy";
import Kup from "./pages/Kup";
import Moje from "./pages/Moje";
import AdminTerminy from "./pages/Admin/Terminy";
import AdminKajaki from "./pages/Admin/Kajaki";
import AdminUzytkownicy from "./pages/Admin/Uzytkownicy";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";

function Guard({ children, admin=false }: {children: JSX.Element; admin?: boolean}) {
  const [ready, setReady] = useState(false);
  const [ok, setOk] = useState(false);
  useEffect(() => onAuthStateChanged(auth, async (u) => {
    if (!u) { setReady(true); setOk(false); return; }
    if (!admin) { setReady(true); setOk(true); return; }
    try {
      const snap = await getDoc(doc(db, "users", u.uid));
      const role = (snap.data() as any)?.role;
      setOk(role === "admin");
    } catch { setOk(false); }
    setReady(true);
  }), []);
  if (!ready) return <div style={{padding:24}}>Ładowanie…</div>;
  return ok ? children : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{padding:"12px 16px", borderBottom:"1px solid #333", background:"#161616"}}>
        <Link to="/" style={{marginRight:12}}>Terminy</Link>
        <Link to="/kup" style={{marginRight:12}}>Kup</Link>
        <Link to="/moje" style={{marginRight:12}}>Moje</Link>
        <Link to="/admin/terminy">Admin</Link>
      </nav>
      <Routes>
        <Route path="/" element={<Terminy />} />
        <Route path="/kup" element={<Kup />} />
        <Route path="/moje" element={<Guard><Moje /></Guard>} />
        <Route path="/admin/terminy" element={<Guard admin><AdminTerminy /></Guard>} />
        <Route path="/admin/kajaki" element={<Guard admin><AdminKajaki /></Guard>} />
        <Route path="/admin/uzytkownicy" element={<Guard admin><AdminUzytkownicy /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
