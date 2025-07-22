const express = require("express");
const router = express.Router();

const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  addVariation,
  updateVariation,
  deleteVariation,
  getProductVariations,
  getProductsByColor,
  updateStock,
  getProductsByCategory,
  getFeaturedProducts,
  getFilteredProducts,
} = require("../controllers/productController");

// Product CRUD
router.get("/get/products", getProducts);
router.post("/create/product", createProduct);
router.put("/update/product", updateProduct);
router.delete("/delete/product/:id", deleteProduct);

// Single Product + Variations
router.get("/get/product/:id", getProductById);
router.get("/get/variations/:productId", getProductVariations);

// Variation Management
router.post("/add/variation/:productId", addVariation);
router.put("/update/variation/:variationId", updateVariation);
router.delete("/delete/variation/:variationId", deleteVariation);

// Search/Filter
router.get("/get/productcolors", getProductsByColor);
router.get("/get/category/:category", getProductsByCategory);
router.get("/get/featured", getFeaturedProducts);
router.get("/get/filtered", getFilteredProducts);

// Inventory
router.put("/update/stock", updateStock);
module.exports = router;
