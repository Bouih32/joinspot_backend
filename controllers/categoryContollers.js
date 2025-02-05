const prisma = require("../utils/client");

    const getAllCategories = async (req, res) => {
        try{
            const categories = await prisma.category.findMany({
                where:{
                    deletedAt: null
                }
            });
            res.status(200).json({message: "Categories retrieved successfully", data: categories});
        }catch(err){
            res.status(500).json({message: "Error", error: err.message});
        }
    }

    const getCategoryById = async (req, res) => {
        try {
            const { id } = req.params;
            const category = await prisma.category.findUnique({where: { categoryId: String(id) }});
            if(!category){
                res.status(404).json({message: "Category not found"});
            }else{
                res.status(200).json({message: "Category retrieved successfully", data: category});
            }
        } catch (error) {
            res.status(500).json({message: "Error", error: error.message});
        }
    }

    const getDeletedCategories = async (req, res) => {
        try {
            const categories = await prisma.category.findMany({
                where: {
                    deletedAt: { not: null } 
                }
            });
    
            if (categories.length === 0) {
                return res.status(404).json({ message: "No deleted categories found" });
            }
    
            res.status(200).json({
                message: "Deleted categories retrieved successfully",
                data: categories
            });
        } catch (err) {
            console.error("Error retrieving deleted categories:", err);
            res.status(500).json({ message: "Internal server error"});
        }
    };
    
    


    const createCategory = async (req, res) => {
        try {
            const {name, icon} = req.body;
            const category = await prisma.category.create({data: {name, icon}});
            res.status(201).json({message: "Category created", category});
        } catch (error) {
            console.error(error);
            res.status(500).json({message: "Error", error: error.message});
        }
    }

    const updateCategory = async (req, res) => {
        try {
            const { id } = req.params;
            const category = await prisma.category.findUnique({ where: { categoryId: String(id) } });
            if (!category) {
                res.status(404).json({ message: "Category not found" });
            }
            const updates = req.body;
            const updatedCategory = await prisma.category.update({ where: { categoryId: String(id) }, data: updates });
            res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
        } catch (error) {
            res.status(500).json({ message: 'Error', error: error.message });
        }
    }
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await prisma.category.findUnique({where: {categoryId: String(id)}});
        if(!category){
            res.status(404).json({message: "Category not found"});
        }
        await prisma.category.update({
            where: {
                categoryId: String(id),
              },
              data: {
                deletedAt: new Date(),
              }
              });
        res.status(200).json({message: "Category deleted"});
    } catch (error) {
        res.status(500).json({message: "Error", error: error.message});
    }
}

    const addTag = async (req, res) => {
        try {
            const { id } = req.params;
            const tag = req.body;
            const category = await prisma.category.findUnique({where: {categoryId: String(id)}});
            if(!category){
                res.status(404).json({message: "Category not found"});
            }
            const existingTag = await prisma.tag.findUnique({where: {name: tag.name}});
            if(existingTag) {
                res.status(400).json({message: "Tag already exists"});
            } else {
                const newTag = await prisma.tag.create({data});
                await prisma.category.update({where: {categoryId: String(id)}, data: {tags: {connect: {id: newTag.id}}}});
                res.status(201).json({message: "Tag added successfully"});
            }
        } catch (error) {
            res.status(500).json({message: "Error", error: error.message});
        }
    }
    


module.exports = {
    getAllCategories,
    getCategoryById,
    getDeletedCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    addTag
}  
