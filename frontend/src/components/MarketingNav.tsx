import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import linkiLogo from "../../media/images/logos/Linki Logo - No Spacing - Transparent.png";

export default function MarketingNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  const pillLink: React.CSSProperties = {
    border: "1.5px solid rgba(0,0,0,0.15)",
    borderRadius: "980px",
    padding: "8px 20px",
    color: "#1D1D1F",
    background: "transparent",
    fontSize: "0.875rem",
    fontWeight: 500,
    textDecoration: "none",
  };

  const pillButton: React.CSSProperties = {
    border: "1.5px solid rgba(0,0,0,0.15)",
    borderRadius: "980px",
    padding: "8px 20px",
    color: "#1D1D1F",
    background: "transparent",
    fontSize: "0.875rem",
    fontWeight: 500,
    cursor: "pointer",
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: "60px",
        display: "flex",
        alignItems: "center",
        padding: "0 40px",
        fontFamily: "var(--font-sans)",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(20px)",
        boxShadow: scrolled ? "0 1px 0 rgba(0,0,0,0.08)" : "none",
        transition:
          "background 0.2s ease, box-shadow 0.2s ease, backdrop-filter 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        {/* Left: logo */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", paddingLeft: "16px" }}>
          <Link
            to="/"
            style={{
              display: "flex",
              alignItems: "center",
              textDecoration: "none",
            }}
          >
            <img
              src={linkiLogo}
              alt="Linki logo"
              style={{ width: 60, height: 60, objectFit: "contain" }}
            />
          </Link>
        </div>

        {/* Centre: nav links */}
        <nav
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "32px",
          }}
        >
          <Link
            to="/features"
            style={{
              color: "#1D1D1F",
              fontSize: "0.9375rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Features
          </Link>
          <Link
            to="/blog"
            style={{
              color: "#1D1D1F",
              fontSize: "0.9375rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Blog
          </Link>
          <Link
            to="/pricing"
            style={{
              color: "#1D1D1F",
              fontSize: "0.9375rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Pricing
          </Link>
        </nav>

        {/* Right: auth buttons */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
          }}
        >
          {user ? (
            <>
              <Link
                to="/app"
                style={pillLink}
              >
                Go to App
              </Link>
              <Link
                to="/account"
                style={pillLink}
              >
                Account
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  navigate("/login");
                }}
                style={pillButton}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={pillLink}
              >
                Sign in
              </Link>
              <Link
                to="/register"
                style={{
                  background: "#0071E3",
                  color: "white",
                  borderRadius: "980px",
                  padding: "8px 20px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                Get started free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
