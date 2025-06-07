const User = require('../user/User');
const Product = require('./Product');
const NewBook = require('./NewBook');
const Order = require('../order/Order');
const OrderItem = require('../order/OrderItem');
const Cart = require('../order/Cart');
const CartItem = require('../order/CartItem');
const Rating = require('./Rating');
const Review = require('./Review');
const Inventory = require('./Inventory');
const InventoryTransaction = require('./InventoryTransaction');
const Address = require('../user/Address');
const Shipping = require('../order/Shipping');
const Payment = require('../order/Payment');
const RefreshToken = require('../user/RefreshToken');
const Genre = require('./Genre');
const BookGenre = require('./BookGenre');
const Audience = require('./Audience');
const BookAudience = require('./BookAudience');

module.exports = {
  User,
  Product,
  NewBook,
  Order,
  OrderItem,
  Cart,
  CartItem,
  Rating,
  Review,
  Inventory,
  InventoryTransaction,
  Address,
  Shipping,
  Payment,
  RefreshToken,
  Genre,
  BookGenre,
  Audience,
  BookAudience,
}; 