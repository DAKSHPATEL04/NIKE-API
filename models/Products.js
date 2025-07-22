const mongoose = require("mongoose");

// Updated Product Schema
const productSchema = mongoose.Schema(
  {
    product_name: {
      type: String,
      required: true,
    },
    product_image: {
      type: String,
      required: true,
    },
    product_sub_images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ProductVariation",
      },
    ],
    product_data: {
      price: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0,
      },
      is_new: {
        type: Boolean,
        default: false,
      },
      brand: String,
      category: String,
      model_number: String,
    },
    base_price: {
      type: Number,
      required: true, // base price without variations
    },
    available_sizes: [String], // general sizes available
    tags: [String],
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "products",
    timestamps: true,
  }
);

// Add indexes for better performance
productSchema.index({ product_name: 1 });
productSchema.index({ "product_data.category": 1 });
productSchema.index({ "product_data.brand": 1 });
productSchema.index({ is_active: 1 });
productSchema.index({ is_featured: 1 });

module.exports = mongoose.model("Products", productSchema);
