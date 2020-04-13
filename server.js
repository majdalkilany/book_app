'use strict'

require('dotenv').config();

const express = require('express');

const superagent = require('superagent');

const PORT = process.env.PORT || 4000;

const app = express();

app.use(express.static('./public'));

app.use(express.urlencoded({ extended: true }));


app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('./pages/index')
});

app.get('/searches/new', (req, res) => {
    res.render('./pages/searches/new');
});

app.post('/searches', (req, res) => {
    // console.log(req.body);
    const title = req.body.keyword;
    const searchBy = req.body.searchBy;
    // console.log(title)
    const url = `https://www.googleapis.com/books/v1/volumes?q=${title}+in${searchBy}:${title}`;
    superagent.get(url).then(apiData => {
        const books = [];
        apiData.body.items.forEach((bookItem, index) => {
            if (index < 10) {
                const book = new Book(bookItem);
                // console.log(book);
                books.push(book);
                // console.log(books);
            }
        });
        // console.log(apiData.body.items[0].volumeInfo);
        res.render('./pages/searches/show', {books: books});
    }).catch((err) => {
        errorHandler(err, req, res);
    });
});


app.use('*', notFoundHandler);
app.use(errorHandler);

function Book(bookData) {
    this.title = bookData.volumeInfo.title;
    this.authors = bookData.volumeInfo.authors.join(', ');
    bookData.volumeInfo.description != undefined ? this.description = bookData.volumeInfo.description : this.description = 'Discription goes here...'
    bookData.volumeInfo.imageLinks != undefined ? this.imageUrl = bookData.volumeInfo.imageLinks.thumbnail.replace('http', 'https') : this.imageUrl = 'filler'
}



function errorHandler(error, req, res) {
    res.status(500).render('./pages/error', {error: error});
}
function notFoundHandler(req, res) {
    res.status(404).send('NOT FOUND!!');
}



app.listen(PORT, () => console.log(`We're live on port ${PORT} BB ^ o ^`));
