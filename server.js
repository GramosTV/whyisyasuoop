const express = require('express');
const hbs = require('express-handlebars');
const path = require('path')
const app = express();
const {urlencoded} = require("express");
const { homeRouter } = require('./routes/home');
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({
    extended: true
}));
app.engine('.hbs', hbs.engine({
    extname: '.hbs',
    helpers: 'handlebarsHelpers',
    defaultLayout: 'main'
}));
app.set('view engine', '.hbs');
app.use('/', homeRouter);


app.listen(3000)