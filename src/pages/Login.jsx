import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  getCurrentSession,
  signInAdmin,
} from "../services/authService";
import "../styles/global.css";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [alreadySignedIn, setAlreadySignedIn] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    async function checkExistingSession() {
      try {
        const session = await getCurrentSession();
        setAlreadySignedIn(Boolean(session));
      } catch (error) {
        console.error(error);
      } finally {
        setCheckingSession(false);
      }
    }

    checkExistingSession();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    setLoginError("");

    if (!email.trim() || !password) {
      setLoginError("Enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      await signInAdmin(email, password);
      navigate("/admin/dashboard", { replace: true });
    } catch (error) {
      console.error(error);
      setLoginError(
        error.message === "Invalid login credentials"
          ? "The email or password is incorrect."
          : error.message
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checkingSession) {
    return (
      <p className="page-message">
        Checking admin access...
      </p>
    );
  }

  if (alreadySignedIn) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-card">
        <div className="admin-login-heading">
          <p className="eyebrow">Gators Cheer</p>
          <h1>Admin Login</h1>

          <p>
            Sign in to review donations and manage the fundraiser.
          </p>
        </div>

        <form
          className="admin-login-form"
          onSubmit={handleSubmit}
        >
          <label htmlFor="adminEmail">
            Email
            <input
              id="adminEmail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
              required
            />
          </label>

          <label htmlFor="adminPassword">
            Password
            <input
              id="adminPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Enter your password"
              required
            />
          </label>

          {loginError && (
            <p className="form-error">{loginError}</p>
          )}

          <button
            type="submit"
            className="admin-login-button"
            disabled={submitting}
          >
            {submitting
              ? "Signing In..."
              : "Sign In"}
          </button>
        </form>

        <Link className="admin-back-link" to="/">
          Return to Fundraiser
        </Link>
      </section>
    </main>
  );
}

export default Login;