import 'reflect-metadata';
import { AppDataSource } from '../config/typeorm.config';
import { Category } from '../entities/Category';
import { Product } from '../entities/Product';
import { User } from '../entities/User';
import bcrypt from 'bcrypt';

const seedDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const categoryRepository = AppDataSource.getRepository(Category);
    const productRepository = AppDataSource.getRepository(Product);
    const userRepository = AppDataSource.getRepository(User);

    const categories = await categoryRepository.save([
      { name: 'Dog Food', description: 'Nutritious food for dogs', sortOrder: 1 },
      { name: 'Dog Toys', description: 'Fun toys for dogs', sortOrder: 2 },
      { name: 'Cat Food', description: 'Nutritious food for cats', sortOrder: 3 },
      { name: 'Cat Toys', description: 'Fun toys for cats', sortOrder: 4 },
      { name: 'Bird Supplies', description: 'Everything for birds', sortOrder: 5 },
      { name: 'Fish Supplies', description: 'Aquarium and fish supplies', sortOrder: 6 },
      { name: 'Small Pet Supplies', description: 'Supplies for small pets', sortOrder: 7 },
    ]);
    console.log('Categories seeded');

    const dogFood = categories.find(c => c.name === 'Dog Food');
    const catToys = categories.find(c => c.name === 'Cat Toys');
    const birdSupplies = categories.find(c => c.name === 'Bird Supplies');
    const fishSupplies = categories.find(c => c.name === 'Fish Supplies');

    await productRepository.save([
      {
        name: 'Premium Dog Food',
        description: 'High-quality nutrition for your dog',
        price: 49.99,
        stock: 50,
        imageUrl: '/images/dog-food.jpg',
        sku: 'DGF001',
        category: dogFood,
      },
      {
        name: 'Cat Toys Set',
        description: 'Interactive toys to keep your cat entertained',
        price: 24.99,
        stock: 100,
        imageUrl: '/images/cat-toys.jpg',
        sku: 'CTY001',
        category: catToys,
      },
      {
        name: 'Bird Cage Deluxe',
        description: 'Spacious and comfortable cage for birds',
        price: 89.99,
        stock: 20,
        imageUrl: '/images/bird-cage.jpg',
        sku: 'BRD001',
        category: birdSupplies,
      },
      {
        name: 'Fish Tank Filter',
        description: 'Keep your aquarium water crystal clear',
        price: 34.99,
        stock: 75,
        imageUrl: '/images/fish-filter.jpg',
        sku: 'FSH001',
        category: fishSupplies,
      },
      {
        name: 'Organic Dog Treats',
        description: 'Healthy and delicious treats for your dog',
        price: 12.99,
        stock: 200,
        imageUrl: '/images/dog-treats.jpg',
        sku: 'DGF002',
        category: dogFood,
      },
      {
        name: 'Cat Scratching Post',
        description: 'Durable scratching post for cats',
        price: 39.99,
        stock: 45,
        imageUrl: '/images/cat-scratch.jpg',
        sku: 'CTY002',
        category: catToys,
      },
    ]);
    console.log('Products seeded');

    const hashedPassword = await bcrypt.hash('admin123', 10);
    await userRepository.save({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@petshop.com',
      password: hashedPassword,
      role: 'admin',
      emailVerified: true,
      address: '123 Admin Street',
      city: 'Pet City',
      state: 'PS',
      zipCode: '12345',
      country: 'USA',
    });
    console.log('Admin user created');

    console.log('Database seeding completed successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();