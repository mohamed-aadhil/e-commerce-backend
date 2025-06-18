-- 1. Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Addresses Table (for user address book)
CREATE TABLE addresses (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    recipient_name TEXT NOT NULL,
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    country TEXT NOT NULL,
    mobile_number TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Products Table (Base Table) title, author, product_type are unique key constraints
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    selling_price NUMERIC(10,2) NOT NULL CHECK (selling_price >= 0),
    cost_price NUMERIC(10,2) NOT NULL CHECK (cost_price >= 0),
    description TEXT,
    product_type TEXT NOT NULL DEFAULT 'new_book' CHECK (product_type IN ('new_book', 'used_book', 'ebook')),
    metadata JSONB,             -- e.g., { "isbn": "9780132350884" }
    images JSONB,               -- array of image URLs
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT selling_price_gte_cost_price CHECK (selling_price >= cost_price)
);

-- 4. New Books Table
CREATE TABLE new_books (
    product_id INT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE
);

-- 5. Used Books Table (for future use)
CREATE TABLE used_books (
    product_id INT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    condition TEXT NOT NULL -- e.g., 'Good', 'Fair', 'Like New'
);

-- 6. E-Books Table (for future use)
CREATE TABLE ebooks (
    product_id INT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    file_format TEXT NOT NULL,   -- e.g., 'PDF', 'EPUB'
    download_url TEXT NOT NULL
);

-- 7. Orders Table
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    total NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Order Items Table
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL,
    price NUMERIC(10,2) NOT NULL -- Price at time of order
);

-- 9. Carts Table (Optional, for persistent carts)
CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INT REFERENCES carts(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id),
    quantity INT NOT NULL
);

-- 10. Ratings Table
CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (user_id, product_id)
);

-- 11. Reviews Table
CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    review_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
    -- Optionally, add UNIQUE (user_id, product_id) if you want only one review per user per product
);

-- 12. Shipping Table (references addresses)
CREATE TABLE shipping (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    address_id INT REFERENCES addresses(id) ON DELETE SET NULL,
    shipping_method TEXT,                 -- e.g., 'standard', 'express'
    shipping_status TEXT NOT NULL,        -- e.g., 'pending', 'shipped', 'delivered'
    tracking_number TEXT,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP
);

-- 13. Payments Table (for future use)
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    order_id INT REFERENCES orders(id) ON DELETE CASCADE,
    payment_method TEXT NOT NULL,         -- e.g., 'credit_card', 'paypal'
    payment_status TEXT NOT NULL,         -- e.g., 'pending', 'completed', 'failed'
    transaction_id TEXT,                  -- from payment gateway
    amount NUMERIC(10,2) NOT NULL,
    paid_at TIMESTAMP
);

-- Genres
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE book_genres (
    book_id INT REFERENCES products(id) ON DELETE CASCADE,
    genre_id INT REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, genre_id)
);

-- Audiences (People of Interest / Target Audience)
CREATE TABLE audiences (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE book_audiences (
    book_id INT REFERENCES products(id) ON DELETE CASCADE,
    audience_id INT REFERENCES audiences(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, audience_id)
);

-- 14. Refresh Tokens Table (for JWT authentication with rotating refresh tokens)
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL, -- Store the refresh token or its hash
    issued_at TIMESTAMP NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    revoked BOOLEAN NOT NULL DEFAULT FALSE,
    replaced_by_token TEXT, -- For rotation tracking (optional)
    CONSTRAINT unique_token UNIQUE(token)
);

-- 15. Inventory Table
CREATE TABLE inventory (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity >= 0),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_product_inventory UNIQUE (product_id)
);

-- 16. Inventory Transactions Table (for audit/history)
CREATE TABLE inventory_transactions (
    id SERIAL PRIMARY KEY,
    product_id INT REFERENCES products(id) ON DELETE CASCADE,
    change INT NOT NULL, -- +10 for restock, -1 for sale, etc.
    reason TEXT,         -- e.g., 'order', 'restock', 'return'
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);


