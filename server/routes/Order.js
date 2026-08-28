// routes/order.js
const express = require("express");
const router = express.Router();

const Order = require("../models/order");
const Cart = require("../models/cart");
const SellItem = require("../models/sellItem");
const auth = require("../middleware/auth");

// ===============================
// CREATE ORDERS FROM CART (CHECKOUT)
// ===============================
router.post("/checkout", auth, async (req, res) => {
  try {
    const { meetupNote = "" } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Your cart is empty" });
    }

    const createdOrders = [];

    for (const item of cart.items) {
      const product = item.product;

      // Skip invalid / deleted products
      if (!product) continue;

      // Can't buy your own item
      if (product.author.toString() === req.user.id.toString()) {
        return res.status(400).json({
          message: `You cannot buy your own item: ${product.title}`,
        });
      }

      // Check stock
      if (product.quantity < item.quantity) {
        return res.status(400).json({
          message: `Not enough stock for ${product.title}. Only ${product.quantity} left`,
        });
      }

      const order = await Order.create({
        buyer: req.user.id,
        seller: product.author,
        product: product._id,
        quantity: item.quantity,
        totalPrice: Number(product.price) * item.quantity,
        status: "pending",
        meetupNote,
        chatUnlocked: true,
      });

      createdOrders.push(order);
    }

    if (createdOrders.length === 0) {
      return res.status(400).json({ message: "No valid items to checkout" });
    }

    // Clear cart after successful checkout
    cart.items = [];
    await cart.save();

    // Populate for response
    const populatedOrders = await Order.find({
      _id: { $in: createdOrders.map((o) => o._id) },
    })
      .populate("product")
      .populate("buyer", "full_name profileImage")
      .populate("seller", "full_name profileImage");

    res.status(201).json({
      message: "Orders placed successfully",
      orders: populatedOrders,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
});

// ===============================
// CREATE ORDER FOR SINGLE ITEM (BUY NOW)
// ===============================
router.post("/buy-now", auth, async (req, res) => {
  try {
    const { productId, quantity = 1, meetupNote = "" } = req.body;
    const qty = Number(quantity);

    if (!productId || qty < 1) {
      return res.status(400).json({ message: "Invalid product or quantity" });
    }

    const product = await SellItem.findById(productId);

    if (!product || product.quantity <= 0) {
      return res.status(404).json({ message: "Item not found or sold out" });
    }

    if (product.author.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: "You cannot buy your own item" });
    }

    if (product.quantity < qty) {
      return res.status(400).json({
        message: `Only ${product.quantity} left in stock`,
      });
    }

    const order = await Order.create({
      buyer: req.user.id,
      seller: product.author,
      product: product._id,
      quantity: qty,
      totalPrice: Number(product.price) * qty,
      status: "pending",
      meetupNote,
      chatUnlocked: true,
    });

    await order.populate([
      { path: "product" },
      { path: "buyer", select: "full_name profileImage" },
      { path: "seller", select: "full_name profileImage" },
    ]);

    res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Buy now error:", error);
    res.status(500).json({
      message: "Failed to place order",
      error: error.message,
    });
  }
});

// ===============================
// GET MY ORDERS (buying | selling)
// ===============================
router.get("/", auth, async (req, res) => {
  try {
    const type = req.query.type || "buying"; // buying | selling

    let filter = {};

    if (type === "selling") {
      filter.seller = req.user.id;
    } else {
      filter.buyer = req.user.id;
    }

    const orders = await Order.find(filter)
      .populate("product")
      .populate("buyer", "full_name profileImage")
      .populate("seller", "full_name profileImage")
      .sort({ createdAt: -1 });

    res.status(200).json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
});

// ===============================
// GET SINGLE ORDER
// ===============================
router.get("/:id", auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("product")
      .populate("buyer", "full_name profileImage")
      .populate("seller", "full_name profileImage");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Only buyer or seller can view
    const isBuyer = order.buyer._id.toString() === req.user.id.toString();
    const isSeller = order.seller._id.toString() === req.user.id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: "Not allowed" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch order",
      error: error.message,
    });
  }
});

// ===============================
// UPDATE ORDER STATUS
// ===============================
router.patch("/:id", auth, async (req, res) => {
  try {
    const { status, meetupNote } = req.body;

    const order = await Order.findById(req.params.id).populate("product");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const isBuyer = order.buyer.toString() === req.user.id.toString();
    const isSeller = order.seller.toString() === req.user.id.toString();

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ message: "Not allowed" });
    }

    // Update meetup note if provided
    if (meetupNote !== undefined) {
      order.meetupNote = meetupNote;
    }

    if (status) {
      if (!["pending", "completed", "cancelled"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      // Already finished
      if (order.status === "completed" || order.status === "cancelled") {
        return res.status(400).json({
          message: `Order is already ${order.status}`,
        });
      }

      // Only seller can mark completed
      if (status === "completed" && !isSeller) {
        return res.status(403).json({
          message: "Only the seller can mark order as completed",
        });
      }

      // ===============================
      // COMPLETED → reduce stock
      // ===============================
      if (status === "completed") {
        const product = await SellItem.findById(order.product._id || order.product);

        if (!product) {
          return res.status(404).json({ message: "Product no longer exists" });
        }

        if (product.quantity < order.quantity) {
          return res.status(400).json({
            message: "Not enough stock to complete this order",
          });
        }

        product.quantity -= order.quantity;

        // Auto-delete if sold out
        if (product.quantity <= 0) {
          await product.deleteOne();
        } else {
          await product.save();
        }
      }

      order.status = status;
    }

    await order.save();

    await order.populate([
      { path: "product" },
      { path: "buyer", select: "full_name profileImage" },
      { path: "seller", select: "full_name profileImage" },
    ]);

    res.status(200).json({
      message: "Order updated",
      order,
    });
  } catch (error) {
    console.error("Update order error:", error);
    res.status(500).json({
      message: "Failed to update order",
      error: error.message,
    });
  }
});

module.exports = router;