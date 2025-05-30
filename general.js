const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


public_users.post("/register", (req,res) => {
  //Write your code here
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({message: "Username and password required"});
  }
  if (users.some(user => user.username === username)) {
    return res.status(409).json({message: "Username exists"});
  }
  users.push({username, password});
  return res.status(201).json({message: "User registered"});
});

// Get the book list available in the shop
public_users.get('/', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(books, null, 2));
  });

// Get book details based on ISBN
public_users.get('/isbn/:isbn',function (req, res) {
  //Write your code here
  const isbn = req.params.isbn;
  if (books[isbn]) {
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(books[isbn], null, 2));
  }
  return res.status(404).json({message: "Book not found"});
});
  
// Get book details based on author
public_users.get('/author/:author',function (req, res) {
  //Write your code here
  const author = req.params.author.toLowerCase();
  const result = {};
  for (const [isbn, book] of Object.entries(books)) {
    if (book.author.toLowerCase().includes(author)) {
      result[isbn] = book;
    }
  }
  if (Object.keys(result).length === 0) {
    return res.status(404).json({message: "No books found"});
  }
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify(result, null, 2));
});

// Get all books based on title
public_users.get('/title/:title',function (req, res) {
  //Write your code here
  const title = req.params.title.toLowerCase();
  const result = {};
  for (const [isbn, book] of Object.entries(books)) {
    if (book.title.toLowerCase().includes(title)) {
      result[isbn] = book;
    }
  }
  if (Object.keys(result).length === 0) {
    return res.status(404).json({message: "No books found"});
  }
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify(result, null, 2));
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  //Write your code here
  const isbn = req.params.isbn;
  if (!books[isbn]) {
    return res.status(404).json({message: "Book not found"});
  }
  const reviews = books[isbn].reviews;
  if (Object.keys(reviews).length === 0) {
    return res.status(200).json({message: "No reviews yet"});
  }
  res.setHeader('Content-Type', 'application/json');
  return res.status(200).send(JSON.stringify(reviews, null, 2));
});

// Task 11: Get book by ISBN using async/await
public_users.get('/async/isbn/:isbn', async (req, res) => {
    try {
        const isbn = req.params.isbn;
        
        // Create a promise to simulate async database lookup
        const getBookAsync = () => new Promise((resolve, reject) => {
            setTimeout(() => {  // Simulate network/database delay
                const book = books[isbn];
                if (book) {
                    resolve(book);
                } else {
                    reject(new Error(`Book with ISBN ${isbn} not found`));
                }
            }, 100);
        });

        const book = await getBookAsync();
        
        return res.status(200).json({
            status: "success",
            isbn: isbn,
            data: book
        });

    } catch (error) {
        return res.status(404).json({
            status: "error",
            message: error.message,
            available_isbns: Object.keys(books)
        });
    }
});

// Task 12: Get books by author using async/await
public_users.get('/async/author/:author', async (req, res) => {
    try {
        const authorQuery = req.params.author.toLowerCase();
        
        // Create promise-based author search
        const searchBooksByAuthor = () => new Promise((resolve) => {
            setTimeout(() => { // Simulate async database query
                const results = {};
                for (const [isbn, book] of Object.entries(books)) {
                    if (book.author.toLowerCase().includes(authorQuery)) {
                        results[isbn] = {
                            author: book.author,
                            title: book.title,
                            reviews: book.reviews
                        };
                    }
                }
                resolve(results);
            }, 100); // Simulate network delay
        });

        const matchingBooks = await searchBooksByAuthor();
        
        if (Object.keys(matchingBooks).length === 0) {
            return res.status(404).json({
                status: "not_found",
                message: `No books found by author: ${req.params.author}`,
                suggestion: "Try searching by partial name (e.g. 'Achebe')"
            });
        }
        
        return res.status(200).json({
            status: "success",
            search_query: req.params.author,
            matches: Object.keys(matchingBooks).length,
            data: matchingBooks
        });

    } catch (error) {
        return res.status(500).json({
            status: "error",
            message: "Error processing author search",
            error: error.message
        });
    }
});

// Task 13: Get books by title using async/await
public_users.get('/async/title/:title', async (req, res) => {
    try {
        const titleQuery = req.params.title.toLowerCase();
        
        // Async title search with simulated delay
        const searchBooksByTitle = () => new Promise((resolve) => {
            setTimeout(() => {
                const results = {};
                for (const [isbn, book] of Object.entries(books)) {
                    if (book.title.toLowerCase().includes(titleQuery)) {
                        results[isbn] = {
                            author: book.author,
                            title: book.title,
                            reviews: book.reviews
                        };
                    }
                }
                resolve(results);
            }, 50); // Minimal simulated delay
        });

        const matchingBooks = await searchBooksByTitle();
        
        if (Object.keys(matchingBooks).length === 0) {
            return res.status(200).json({
                message: `No books found containing: "${req.params.title}"`,
                suggestion: "Try a different search term"
            });
        }
        
        // Maintains your exact current response format
        return res.status(200).json(matchingBooks);

    } catch (error) {
        return res.status(500).json({
            error: "Title search failed",
            details: error.message
        });
    }
});

module.exports.general = public_users;
