import express from 'express';
import { config } from './config/env';

const app=express();

const port=config.PORT;

app.get("/test",(req,res)=>{
    res.json({
        message:"Hello World"
    }).status(200);
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
