import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, Navigate } from "react-router-dom";
import { auth } from "./firebase";
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// strony
import Terminy from "./pages/Terminy";
import Kup from "./pages/Kup";
import Moje from "./pages/Moje";
import AdminTerminy from "./pages/Admin/Terminy";
import AdminUzytkownicy from "./pages/Admin/Uzytkownicy";
import AdminKajaki from "./pages/Admin/Kajaki";

type U = { uid: string; email: string | null };

function AdminLayout() {
  return (
    <div>
      <h2>Panel administratora</h2>
      <nav style={{display:"flex", gap:12, margin:"12px 0"}}>
        <NavLink to="/admin/terminy">Terminy</NavLink>
        <NavLink to="/admin/uzytkownicy">Użytkownicy</NavLink>
        <NavLink to="/admin/kajaki">Kajaki</NavLink>
      </nav>
      <Routes>
        <Route index element={<Navigate to="terminy" replace />} />
        <Route path="terminy" element={<AdminTerminy />} />
        <Route path="uzytkownicy" element={<AdminUzytkownicy />} />
        <Route path="kajaki" element={<AdminKajaki />} />
        <Route path="*" element={<Navigate to="terminy" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<U | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      const me = u ? { uid: u.uid, email: u.email } : null;
      setUser(me);
      setRole(null);
      if (!me) return;
      try {
        const ref = doc(db, "users", me.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { email: me.email, role: "member", createdAt: serverTimestamp() });
          setRole("member");
        } else {
          setRole((snap.data() as any)?.role ?? "member");
        }
      } catch (e) { console.error(e); }
    });
  }, []);

  async function handleLogin() {
    try { setBusy(true); await signInWithPopup(auth, new GoogleAuthProvider()); }
    catch (e) { console.error(e); } finally { setBusy(false); }
  }

  return (
    <BrowserRouter>
      <header style={{padding:16, display:"flex", gap:12, alignItems:"center", background:"#111", color:"#fff"}}>
        <strong>Morzkulc Pools</strong>
        <NavLink to="/" style={{color:"#9cf"}}>Terminy</NavLink>
        <NavLink to="/kup" style={{color:"#9cf"}}>Kup</NavLink>
        {user && <NavLink to="/moje" style={{color:"#9cf"}}>Moje</NavLink>}
        {role === "admin" && <NavLink to="/admin" style={{color:"#f9c"}}>Admin</NavLink>}
        <div style={{marginLeft:"auto"}}>
          {user ? (
            <span>{user.email} <button onClick={() => signOut(auth)} disabled={busy}>Wyloguj</button></span>
          ) : (
            <button onClick={handleLogin} disabled={busy}>Zaloguj</button>
          )}
        </div>
      </header>

      <main style={{padding:16}}>
        <Routes>
          <Route path="/" element={<Terminy />} />
          <Route path="/kup" element={<Kup />} />
          <Route path="/moje" element={user ? <Moje /> : <Navigate to="/" replace />} />
          <Route path="/admin/*" element={role === "admin" ? <AdminLayout /> : <Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
