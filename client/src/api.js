import axios from 'axios';

// Use environment variable if available (for production on Vercel)
//const API_BASE = process.env.REACT_APP_API_URL || 'http://192.168.8.189:5000';

const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL, // dynamically uses either local or production
    headers: {
        'Content-Type': 'application/json'
    }
});

export default API;