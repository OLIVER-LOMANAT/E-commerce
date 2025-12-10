import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function checkProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    
    // Check if products collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    const productCollection = collections.find(c => c.name === 'products');
    
    if (productCollection) {
      console.log("✅ Products collection exists");
      
      // Get count of products
      const Product = mongoose.model('Product', new mongoose.Schema({}), 'products');
      const count = await Product.countDocuments();
      console.log(`Total products in database: ${count}`);
      
      // Show first few products if they exist
      if (count > 0) {
        const products = await Product.find().limit(3);
        console.log("First 3 products:", JSON.stringify(products, null, 2));
      }
    } else {
      console.log("❌ Products collection does not exist");
      console.log("Available collections:", collections.map(c => c.name));
    }
    
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkProducts();
