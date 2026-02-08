import axios from 'axios'

const baseUrl = 'http://127.0.0.1:8000/'

const Axios = axios.create({
    baseURL: baseUrl,
    timeout: 60000,
    headers:{
        "Content-Type":"application/json",
        accept: "application/json"
    }
})

Axios.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('Token')
        if(token){
            config.headers.Authorization = `Token ${token}`
        }
        else{
            config.headers.Authorization = ``
        }
        return config;
    }
)

Axios.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if(error.response && error.response.status === 401){
            localStorage.removeItem('Token')
        }

        // CRITICAL FIX: Return a rejected promise with the error
        // This ensures errors are properly propagated to catch blocks
        return Promise.reject(error);
    }
)

export default Axios;