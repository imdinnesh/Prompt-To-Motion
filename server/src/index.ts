import express from 'express';
import { Config } from './config/env';
import cors from 'cors';
import router from './routes';

const port = Config.PORT;

const app = express();

const corsOptions: cors.CorsOptions = {
    origin: 'http://localhost:3000', // must match frontend
    credentials: true,               // allow cookies & credentials
};

app.use(cors(corsOptions));
app.use(express.json());

// Sample test route
app.get("/test", (req, res) => {
    res.status(200).json({
        message: "Hello World"
    });
});

// API routes
app.use("/api/v1", router);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
