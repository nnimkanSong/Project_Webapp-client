import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';


function ProtectedRoute({ children }) {
    const token = localStorage.getItem('token');

    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            const currentTime = Date.now() / 1000; // ✅ แก้พิมพ์ผิด

            if (decodedToken.exp > currentTime) {
                return children;
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) { // ✅ ใส่ error ใน catch
            console.error('Invalid token:', error);
            localStorage.removeItem('token');
        }
    }

    return <Navigate to="/login" />;
}

export default ProtectedRoute;
