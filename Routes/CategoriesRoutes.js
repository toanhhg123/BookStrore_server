import express from "express";
import asyncHandler from "express-async-handler";
import Category from "../Models/Categories.js";
import { admin, protect } from "./../Middleware/AuthMiddleware.js";

const categorytRoute = express.Router();

// GET ALL CATEGORY
categorytRoute.get(
  "/",
  asyncHandler(async (req, res) => {
    const pageSize = 12;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword
      ? {
          name: {
            $regex: req.query.keyword,
            $options: "i",
          },
        }
      : {};
    const count = await Category.countDocuments({ ...keyword });
    const categories = await Category.find({ ...keyword })
      .limit(pageSize)
      .skip(pageSize * (page - 1))
      .sort({ _id: -1 });
    res.json({ categories, page, pages: Math.ceil(count / pageSize) });
  })
);

// ADMIN GET ALL CATEGORY WITHOUT SEARCH AND PEGINATION
categorytRoute.get(
  "/all",
  protect,
  asyncHandler(async (req, res) => {
    const categories = await Category.find({}).sort({ _id: -1 });
    res.json(categories);
  })
);

// GET SINGLE CATEGORY
categorytRoute.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (category) {
      res.json(category);
    } else {
      res.status(404);
      throw new Error("Category not Found");
    }
  })
);

// DELETE CATEGORY
categorytRoute.delete(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const category = await Category.findById(req.params.id);
    if (category) {
      await category.remove();
      res.json({ message: "Category deleted" });
    } else {
      res.status(404);
      throw new Error("Category not Found");
    }
  })
);

// CREATE CATEGORY
categorytRoute.post(
  "/",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, description, image } = req.body;
    const categoryExist = await Category.findOne({ name });
    if (categoryExist) {
      res.status(400);
      throw new Error("Category name already exist");
    } else {
      const category = new Category({
        name,
        description,
        image,
        user: req.user._id,
      });
      if (category) {
        const createdcategory = await category.save();
        res.status(201).json(createdcategory);
      } else {
        res.status(400);
        throw new Error("Invalid category data");
      }
    }
  })
);

// UPDATE CATEGORY
categorytRoute.put(
  "/:id",
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { name, description, image } = req.body;
    const category = await Category.findById(req.params.id);
    if (category) {
      category.name = name || category.name;
      category.description = description || category.description;
      category.image = image || category.image;

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404);
      throw new Error("Category not found");
    }
  })
);
export default categorytRoute;
