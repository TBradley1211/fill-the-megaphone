import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { getCurrentSession } from "../services/authService";

function ProtectedRoute({ children }) {
  const [session, setSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const currentSession = await getCurrentSession();

        if (isMounted) {
          setSession(currentSession);
        }
      } catch (error) {
        console.error("Unable to check admin session:", error);
      } finally {
        if (isMounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, updatedSession) => {
      setSession(updatedSession);
      setCheckingSession(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (checkingSession) {
    return (
      <p className="page-message">
        Checking admin access...
      </p>
    );
  }

  if (!session) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default ProtectedRoute;