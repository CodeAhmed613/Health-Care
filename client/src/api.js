import axios from 'axios';

// Change 'localhost' to your actual computer IP
const API_BASE = process.env.REACT_APP_API_URL || 'http://192.168.8.189:5000';

const API = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

export default API;