'use strict'

require('dotenv').config();

const pg = require('pg');

const express = require('express');

const superagent = require('superagent');

const PORT = process.env.PORT || 4000;

const app = express();

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => {
    throw new Error(err);
});

app.use(express.static('./public'));

app.use(express.urlencoded({ extended: true }));


app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    const SQL = 'SELECT * FROM books'
    client.query(SQL).then(result => {
        console.log(result.rows);
        res.render('./pages/index', { book: result.rows })
    })
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
        res.render('./pages/searches/show', { books: books });
    }).catch((err) => {
        errorHandler(err, req, res);
    });
});

app.get('/books/:bookID', (req, res) => {
    // res.status(200).send(req.params.bookID)
    const bookID = req.params.bookID;
    console.log('bookid', bookID);
    const SQL = 'SELECT * FROM books WHERE bookID=$1'
    client.query(SQL, [bookID]).then(result => {
        if (result.rows.length !== 0) {
            console.log('stored')
            res.render('./pages/books/show', { book: result.rows[0] })
            // res.status(200).json(result.rows[0])
        }
        else {
            const url = `https://www.googleapis.com/books/v1/volumes/${bookID}`;
            superagent.get(url).then(result => {
                console.log(result.body)
                res.render('./pages/books/show', { book: result.body })
                // res.status(200).json(result.body)
            })
        }
    })

})


app.post('/books', (req, res) => {
    const bookID = req.body.bookID;
    console.log(bookID);
    const SQL = 'SELECT * FROM books WHERE bookID=$1'
    client.query(SQL, [bookID]).then(result => {
        if (result.rows.length !== 0) {
            console.log('stored 2')
            res.redirect(`/books/${result.rows[0].bookid}`)
        }
        else {
            console.log('not stored 2')
            const url = `https://www.googleapis.com/books/v1/volumes/${bookID}`;
            superagent.get(url).then(apiData => {
                // res.status(200).json(apiData.body)
                const bookData = apiData.body;
                const book = new Book(bookData);
                const SQL = 'INSERT INTO books (bookid, authors, title, isbn, imageurl, description, bookshelf) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *'
                const values = [book.bookID, book.authors, book.title, book.isbn, book.imageUrl, book.description, ' ']
                client.query(SQL, values).then(result => {
                    res.redirect(`/books/${result.rows[0].bookid}`)
                    // res.status(200).json(result.rows[0]);
                })
            }).catch((err) => {
                errorHandler(err, req, res);
            });
        }
    })
})


app.use('*', notFoundHandler);
app.use(errorHandler);

function Book(bookData) {
    this.title = bookData.volumeInfo.title;
    this.authors = bookData.volumeInfo.authors.join(', ');
    bookData.volumeInfo.description != undefined ? this.description = bookData.volumeInfo.description : this.description = 'Discription goes here...'
    bookData.volumeInfo.imageLinks != undefined ? this.imageUrl = bookData.volumeInfo.imageLinks.thumbnail.replace('http', 'https') : this.imageUrl = 'filler'
    this.bookID = bookData.id;
    this.isbn = bookData.volumeInfo.industryIdentifiers[0].identifier;
}



function errorHandler(error, req, res) {
    res.status(500).render('./pages/error', { error: error });
}
function notFoundHandler(req, res) {
    res.status(404).send('NOT FOUND!!');
}


client.connect().then(() => {
    app.listen(PORT, () => console.log(`We're live on port ${PORT} BB ^ o ^`));
    // }).catch((err, req, res) => {
    //     res.status(200).send(err);
})
