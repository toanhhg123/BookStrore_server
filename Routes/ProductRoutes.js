import express from "express";
import asyncHandler from "express-async-handler";
import Product from "./../Models/ProductModel.js";
import { admin, protect } from "./../Middleware/AuthMiddleware.js";

const productRoute = express.Router();

// GET ALL PRODUCT
productRoute.get(
  "/",
  asyncHandler(async (req, res) => {
    const pageSize = 6;
    const page = Number(req.query.pageNumber) || 1;
    const filter = req.query.filter || "PRICE_HIGH_TO_LOW";
    const category = req.query.category || "";
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};
    const count = await Product.countDocuments({ ...keyword });
    let products = Product.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    if (filter === "PRICE_HIGH_TO_LOW") {
      products = await products.sort({ price: -1 });
    }

    if (filter === "PRICE_LOW_TO_HIGH") {
      products = await products.sort({ price: 1 });
    }

    if (category !== "") {
      products = await products.filter(
        (product) => String(product.category) === category
      );
    }

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
    });
  })
);

// ADMIN GET ALL PRODUCT WITHOUT SEARCH AND PEGINATION
productRoute.get(
  "/all",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ _id: -1 });
    res.json(products);
  })
);

// GET SINGLE PRODUCT
productRoute.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404);
      throw new Error("Sản phẩm không có");
    }
  })
);

// PRODUCT REVIEW
productRoute.post(
  "/:id/review",
  protect,
  asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );
      if (alreadyReviewed) {
        res.status(400);
        throw new Error("Sản phẩm đã được đánh giá");
      }
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: "Đã đánh giá đã thêm" });
    } else {
      res.status(404);
      throw new Error("Sản phẩm không có");
    }
  })
);

// DELETE PRODUCT
productRoute.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.remove();
      res.json({ message: "Sản phẩm đã được xóa" });
    } else {
      res.status(404);
      throw new Error("Sản phẩm không có");
    }
  })
);

// CREATE PRODUCT
productRoute.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, category, price, description, image, countInStock, size, color } =
      req.body;
    const productExist = await Product.findOne({ name });
    if (productExist) {
      res.status(400);
      throw new Error("Tên sản phẩm đã tồn tại");
    } else {
      const product = new Product({
        name,
        category,
        price,
        description,
        image,
        countInStock,
        size, 
        color,
        user: req.user._id,
      });
      if (product) {
        const createdproduct = await product.save();
        res.status(201).json(createdproduct);
      } else {
        res.status(400);
        throw new Error("Dữ liệu sản phẩm không hợp lệ");
      }
    }
  })
);

// UPDATE PRODUCT
productRoute.put(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, category, price, description, image, countInStock,size,color } =
      req.body;
    console.log(name, category, price, description, image, countInStock,size,color);
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = name || product.name;
      product.category = category || product.category;
      product.price = price || product.price;
      product.description = description || product.description;
      product.image = image || product.image;
      product.size = (size.length === 0 ? product.size : size);
      product.color = (color.length === 0 ? product.color : color);
      product.countInStock = countInStock || product.countInStock;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404);
      throw new Error("Sản phẩm không có");
    }
  })
);
export default productRoute;
