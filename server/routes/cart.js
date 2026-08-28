// routes/cart.js
const express = require("express");
const router = express.Router();
const Cart = require("../models/cart");
const SellItem = require("../models/sellItem");
const auth = require("../middleware/auth");

// ===============================
// GET MY CART
// ===============================
router.get("/cart", auth, async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate({
      path: "items.product",
      populate: {
        path: "author",
        select: "full_name profileImage",
      },
    });

    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Remove items that no longer exist or are sold out
    const validItems = cart.items.filter(
      (item) => item.product && item.product.quantity > 0
    );

    if (validItems.length !== cart.items.length) {
      cart.items = validItems;
      await cart.save();
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Get cart error:", error);
    res.status(500).json({ message: "Failed to fetch cart" });
  }
});

// ===============================
// ADD TO CART
// ===============================
router.post("/add", auth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const qty = Number(quantity);

    if (!productId || qty < 1) {
      return res.status(400).json({ message: "Invalid product or quantity" });
    }

    const product = await SellItem.findById(productId);

    if (!product || product.quantity <= 0) {
      return res.status(404).json({ message: "Item not found or sold out" });
    }

    // Optional: prevent adding your own item
    if (product.author.toString() === req.user.id.toString()) {
      return res.status(400).json({ message: "You cannot add your own item" });
    }

    let cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      cart = new Cart({ user: req.user.id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      const newQty = existingItem.quantity + qty;

      if (newQty > product.quantity) {
        return res.status(400).json({
          message: `Only ${product.quantity} left in stock`,
        });
      }

      existingItem.quantity = newQty;
    } else {
      if (qty > product.quantity) {
        return res.status(400).json({
          message: `Only ${product.quantity} left in stock`,
        });
      }

      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();

    await cart.populate({
      path: "items.product",
      populate: {
        path: "author",
        select: "full_name profileImage",
      },
    });

    res.status(200).json({
      message: "Added to cart",
      cart,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    res.status(500).json({ message: "Failed to add to cart" });
  }
});

// ===============================
// UPDATE ITEM QUANTITY
// ===============================
router.patch("/update/:productId", auth, async (req, res) => {
  try {
    const { quantity } = req.body;
    const qty = Number(quantity);
    const { productId } = req.params;

    if (!qty || qty < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (i) => i.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    const product = await SellItem.findById(productId);

    if (!product || product.quantity <= 0) {
      // remove sold out item
      cart.items = cart.items.filter(
        (i) => i.product.toString() !== productId
      );
      await cart.save();
      return res.status(400).json({ message: "Item is sold out" });
    }

    if (qty > product.quantity) {
      return res.status(400).json({
        message: `Only ${product.quantity} left in stock`,
      });
    }

    item.quantity = qty;
    await cart.save();

    await cart.populate({
      path: "items.product",
      populate: {
        path: "author",
        select: "full_name profileImage",
      },
    });

    res.status(200).json({
      message: "Cart updated",
      cart,
    });
  } catch (error) {
    console.error("Update cart error:", error);
    res.status(500).json({ message: "Failed to update cart" });
  }
});

// ===============================
// REMOVE ITEM FROM CART
// ===============================
router.delete("/remove/:productId", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== req.params.productId
    );

    await cart.save();

    await cart.populate({
      path: "items.product",
      populate: {
        path: "author",
        select: "full_name profileImage",
      },
    });

    res.status(200).json({
      message: "Item removed",
      cart,
    });
  } catch (error) {
    console.error("Remove cart item error:", error);
    res.status(500).json({ message: "Failed to remove item" });
  }
});

// ===============================
// CLEAR CART
// ===============================
router.delete("/clear", auth, async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.status(200).json({
      message: "Cart cleared",
      cart,
    });
  } catch (error) {
    console.error("Clear cart error:", error);
    res.status(500).json({ message: "Failed to clear cart" });
  }
});

module.exports = router;