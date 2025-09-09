import React, { useState } from "react";
import axios from "axios";
import "../css/create.css";
import { useNavigate } from "react-router-dom";

function Create_acount() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/register`,
        formData
      );
      alert("User registered successfully");
      navigate("/login");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Server error");
    }
  };

  return (
    <div className="create-bg">
      <div className="cr-box">
        <div className="cr-rgb">
          <div className="cr-logo">
            <img src="/Create_acount.png" alt="" />
          </div>
          <br />

          <div className="cr-input">
            <div className="cr-name">
              <p>User :</p>
              <hr />
              <p>Email :</p>
              <hr />
              <p>Password :</p>
            </div>

            <div className="cr-box-input" onSubmit={handleSubmit}>
              <input
                name="username"
                type="text"
                placeholder="User"
                value={formData.username}
                onChange={handleChange}
              />
              <hr />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
              <hr />
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}
          </div>
          <div className="cr-btn-end">
            <div className="cr-btn-done">
              <button className="cr-done" type="submit" onClick={handleSubmit}>
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Create_acount;
