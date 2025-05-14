"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const app = (0, express_1.default)();
const port = env_1.config.PORT;
app.get("/test", (req, res) => {
    res.json({
        message: "Hello World"
    }).status(200);
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
