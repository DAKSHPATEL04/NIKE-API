const Product = require("../models/Products");
const ProductVariation = require("../models/productVariation");

// Existing functionality
exports.getProducts = async (req, res) => {
  try {
    const Allproducts = await Product.find()
      .populate("product_sub_images") // Populate variations
      .sort({ createdAt: -1 });
    res.status(200).json({ products: Allproducts });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { variations, ...productData } = req.body;

    // If variations are provided, create them first
    if (variations && variations.length > 0) {
      const variationIds = [];

      for (const variation of variations) {
        const newVariation = new ProductVariation(variation);
        const savedVariation = await newVariation.save();
        variationIds.push(savedVariation._id);
      }

      // Add variation IDs to product data
      productData.product_sub_images = variationIds;
    }

    const newProduct = new Product(productData);
    const saved = await newProduct.save();

    // Update variations with product_id
    if (
      productData.product_sub_images &&
      productData.product_sub_images.length > 0
    ) {
      await ProductVariation.updateMany(
        { _id: { $in: productData.product_sub_images } },
        { product_id: saved._id }
      );
    }

    // Return with populated variations
    const populatedProduct = await Product.findById(saved._id).populate(
      "product_sub_images"
    );

    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { _id, variations, ...incomingData } = req.body;

    const existing = await Product.findById(_id);
    if (!existing) return res.status(404).json({ error: "Product not found" });

    // Handle variations update if provided
    if (variations) {
      // Remove old variations
      if (
        existing.product_sub_images &&
        existing.product_sub_images.length > 0
      ) {
        await ProductVariation.deleteMany({
          _id: { $in: existing.product_sub_images },
        });
      }

      // Create new variations
      const variationIds = [];
      for (const variation of variations) {
        const newVariation = new ProductVariation({
          ...variation,
          product_id: _id,
        });
        const savedVariation = await newVariation.save();
        variationIds.push(savedVariation._id);
      }

      incomingData.product_sub_images = variationIds;
    }

    // Merge nested product_data if partial update
    const mergedData = {
      ...existing.toObject(), // existing document
      ...incomingData, // top-level updated fields
      product_data: {
        ...existing.product_data, // existing product_data
        ...incomingData.product_data, // new/updated product_data
      },
    };

    const updated = await Product.findByIdAndUpdate(_id, mergedData, {
      new: true,
    }).populate("product_sub_images");

    res.status(200).json(updated);
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "Failed to update product" });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Delete associated variations
    if (product.product_sub_images && product.product_sub_images.length > 0) {
      await ProductVariation.deleteMany({
        _id: { $in: product.product_sub_images },
      });
    }

    await Product.findByIdAndDelete(id);
    return res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete error:", error);
    return res.status(500).json({ error: "Failed to delete product" });
  }
};

// NEW FUNCTIONALITY - Product Variations Management

// Get single product with all variations
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate("product_sub_images")
      .exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add new variation to existing product
exports.addVariation = async (req, res) => {
  try {
    const { productId } = req.params;
    const variationData = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const newVariation = new ProductVariation({
      ...variationData,
      product_id: productId,
    });

    const savedVariation = await newVariation.save();

    // Add variation to product
    await Product.findByIdAndUpdate(productId, {
      $push: { product_sub_images: savedVariation._id },
    });

    res.status(201).json(savedVariation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update specific variation
exports.updateVariation = async (req, res) => {
  try {
    const { variationId } = req.params;
    const updateData = req.body;

    const updatedVariation = await ProductVariation.findByIdAndUpdate(
      variationId,
      updateData,
      { new: true }
    );

    if (!updatedVariation) {
      return res.status(404).json({ message: "Variation not found" });
    }

    res.status(200).json(updatedVariation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete specific variation
exports.deleteVariation = async (req, res) => {
  try {
    const { variationId } = req.params;

    const variation = await ProductVariation.findById(variationId);
    if (!variation) {
      return res.status(404).json({ message: "Variation not found" });
    }

    // Remove from product
    await Product.findByIdAndUpdate(variation.product_id, {
      $pull: { product_sub_images: variationId },
    });

    // Delete variation
    await ProductVariation.findByIdAndDelete(variationId);

    res.status(200).json({ message: "Variation deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all variations for a product
exports.getProductVariations = async (req, res) => {
  try {
    const { productId } = req.params;

    const variations = await ProductVariation.find({ product_id: productId });
    res.status(200).json({ variations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Search products by color
exports.getProductsByColor = async (req, res) => {
  try {
    const { color } = req.params;

    const variations = await ProductVariation.find({
      color_name: new RegExp(color, "i"),
      is_available: true,
    }).populate("product_id");

    res.status(200).json({ variations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update stock for specific variation and size
exports.updateStock = async (req, res) => {
  try {
    const { variationId, size, newStock } = req.body;

    const variation = await ProductVariation.findOneAndUpdate(
      {
        _id: variationId,
        "size_availability.size": size,
      },
      {
        $set: { "size_availability.$.stock": newStock },
      },
      { new: true }
    );

    if (!variation) {
      return res.status(404).json({ message: "Variation or size not found" });
    }

    res.status(200).json(variation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const products = await Product.find({
      "product_data.category": new RegExp(category, "i"),
      is_active: true,
    }).populate("product_sub_images");

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({
      is_featured: true,
      is_active: true,
    })
      .populate("product_sub_images")
      .sort({ createdAt: -1 });

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get products with filters and pagination
exports.getFilteredProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      brand,
      minPrice,
      maxPrice,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const filters = { is_active: true };

    if (category) filters["product_data.category"] = new RegExp(category, "i");
    if (brand) filters["product_data.brand"] = new RegExp(brand, "i");
    if (minPrice || maxPrice) {
      filters["product_data.price"] = {};
      if (minPrice) filters["product_data.price"].$gte = Number(minPrice);
      if (maxPrice) filters["product_data.price"].$lte = Number(maxPrice);
    }

    const skip = (page - 1) * limit;
    const sortOption = {};
    sortOption[sortBy] = sortOrder === "desc" ? -1 : 1;

    const products = await Product.find(filters)
      .populate("product_sub_images")
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    const total = await Product.countDocuments(filters);

    res.status(200).json({
      products,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        limit: Number(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
