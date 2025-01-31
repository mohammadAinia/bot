// // app.js
// // const express = require('express');
// // const dotenv = require('dotenv');
// // const session = require('express-session');

// import router from './routes/index.js';

// import express from 'express'
// import axios from 'axios'
// import session from 'express-session';
// import dotenv from 'dotenv';

// dotenv.config();

// const app = express();
// const port = 5000;

// app.use(session({
//     secret: 'Mohammed',
//     resave: true,
//     saveUninitialized: true,
//     cookie: { secure: true },
// }));

// app.use(express.json());
// app.use('/', router);

// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });