import dotenv from 'dotenv';
dotenv.config();

const allowedOrigins = [
  process.env.FRONTEND_URL_1,    // http://localhost:5173
  process.env.DASHBOARD_FRONTEND // http://localhost:5174
];

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie'],
}