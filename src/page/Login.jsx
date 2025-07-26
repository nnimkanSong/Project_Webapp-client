import React from "react";
import "../css/Login.css";
const Login = () => {
  return (
    <div className="login-bg">
      <div className="box">
        <div className="rgb">
          <div className="logo">
            <img src="/Login.png" alt="" />
          </div>
          <button className="btn-google">
            <img src="/google_logo.png" alt="" />
            <p>Login with Google</p>
          </button>
          <div className="line">
            <hr />
            <p>or</p>
            <hr />
          </div>
          <br />

          <div className="input">
            <div className="name">
              <p>Email :</p>
              <hr />
              <p>Password :</p>
            </div>
            <div className="box-input">
              <input type="email" name="" id="" />
              <hr />
              <input type="password" name="" id="" />
            </div>
            <br />
            <a href="/chang_password">Forgot password?</a>
          </div>
          <div className="btn-end">
            <a className="create">Create account</a>
            <div className="btn-done">
              <button className="done">Done</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
