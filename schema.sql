DROP TABLE IF EXISTS books;
CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    bookid VARCHAR(255),
    authors VARCHAR(255),
    title VARCHAR(255),
    isbn VARCHAR(255),
    imageurl TEXT,
    description TEXT,
    bookshelf VARCHAR(255)
)
