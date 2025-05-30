const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];
const JWT_SECRET = "your-256-bit-secret"; // Use the same secret everywhere

// Helper function to get username from JWT
const getUsernameFromToken = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET).username;
    } catch {
        return null;
    }
};

const isValid = (username)=>{ return users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{ return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  //Write your code here
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({message: "Both username and password required"});
  }
  
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) {
    return res.status(401).json({message: "Invalid credentials"});
  }
  
  const token = jwt.sign({ username }, 'your-256-bit-secret', { expiresIn: '1h' });
  
  return res.json({ 
    message: "Login successful",
    token,
    username
  });
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  //Write your code here
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({message: "Token required"});

  try {
    const decoded = jwt.verify(token, 'your-256-bit-secret');
    const username = decoded.username;
    const isbn = req.params.isbn;
    const review = req.query.review;

    if (!books[isbn]) return res.status(404).json({message: "Book not found"});
    if (!review) return res.status(400).json({message: "Review text required"});

    books[isbn].reviews[username] = review;
    
    return res.json({
      message: "Review submitted",
      isbn,
      your_review: review
    });
    
  } catch (err) {
    return res.status(401).json({message: "Invalid token"});
  }
});

//Delete Book Review
regd_users.delete("/auth/review/:isbn", (req, res) => {
    // Get username from JWT token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Authorization token required" });
    }

    try {
        // Verify token and get username
        const decoded = jwt.verify(token, 'your-256-bit-secret');
        const username = decoded.username;
        const isbn = req.params.isbn;

        // Check if book exists
        if (!books[isbn]) {
            return res.status(404).json({ 
                message: "Book not found",
                available_isbns: Object.keys(books)
            });
        }

        // Check if user has a review for this book
        if (!books[isbn].reviews[username]) {
            return res.status(404).json({ 
                message: "No review found for your account",
                your_reviews: Object.keys(books[isbn].reviews).filter(u => u === username).length
            });
        }

        // Delete the review
        delete books[isbn].reviews[username];

        return res.status(200).json({
            message: "Review deleted successfully",
            book: {
                isbn: isbn,
                title: books[isbn].title,
                remaining_reviews: Object.keys(books[isbn].reviews).length
            }
        });

    } catch (err) {
        return res.status(401).json({ 
            message: "Invalid or expired token",
            error: err.message 
        });
    }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
