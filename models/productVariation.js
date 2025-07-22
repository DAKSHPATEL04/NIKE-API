const mongoose = require("mongoose");

// Product Variation Schema for different colors and images
const productVariationSchema = mongoose.Schema(
  {
    color_name: {
      type: String,
      required: true,
    },
    color_code: {
      type: String, // hex code like #f7997cff
      required: true,
    },
    variation_images: [
      {
        type: String,
        required: true,
      },
    ],
    main_image: {
      type: String,
      required: true,
    },
    stock_quantity: {
      type: Number,
      default: 0,
    },
    is_available: {
      type: Boolean,
      default: true,
    },
    size_availability: [
      {
        size: String,
        stock: Number,
        price_adjustment: {
          type: Number,
          default: 0, // additional price for specific sizes
        },
      },
    ],
    // Optional: Link back to parent product
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Products",
    },
  },
  {
    collection: "product_variations",
    timestamps: true,
  }
);

// Add indexes for better performance
productVariationSchema.index({ product_id: 1, color_name: 1 });
productVariationSchema.index({ is_available: 1 });

module.exports = mongoose.model("ProductVariation", productVariationSchema);
