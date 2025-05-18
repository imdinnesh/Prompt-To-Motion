import express from 'express';
import { Config } from './config/env';
import router from './routes';
const port=Config.PORT;

const app=express();

app.use(express.json());

app.get("/test",(req,res)=>{
    res.json({
        message:"Hello World"
    }).status(200);
})

app.use("/api/v1",router)

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
