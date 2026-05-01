import axios from 'axios';

// A baseURL agora é o endereço do seu servidor Java (Spring Boot)
// DICA: Se estiver testando no celular físico com Expo, troque "localhost" pelo IP do seu Wi-Fi (ex: 192.168.1.15)
const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Mais para frente, vamos colocar um "Interceptor" aqui para adicionar 
// o JWT Token que o Java gerou automaticamente em todas as requisições!

export default api;