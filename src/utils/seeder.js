require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { Tag } = require('../models');

// Sample data
const users = [
    {
        username: 'admin',
        email: 'admin@ecommerce.com',
        password: 'admin123',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        isActive: true
    },
    {
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'customer',
        isActive: true,
        billing: {
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postcode: '10001',
            country: 'US',
            email: 'john@example.com',
            phone: '+1-555-123-4567'
        },
        shipping: {
            firstName: 'John',
            lastName: 'Doe',
            address1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postcode: '10001',
            country: 'US'
        }
    }
];

const categories = [
    {
        name: 'Electronics',
        description: 'Electronic devices and gadgets',
        image: {
            src: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
            alt: 'Electronics'
        }
    },
    {
        name: 'Smartphones',
        description: 'Latest smartphones and accessories',
        image: {
            src: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
            alt: 'Smartphones'
        }
    },
    {
        name: 'Laptops',
        description: 'High-performance laptops and notebooks',
        image: {
            src: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400',
            alt: 'Laptops'
        }
    },
    {
        name: 'Accessories',
        description: 'Tech accessories and peripherals',
        image: {
            src: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400',
            alt: 'Accessories'
        }
    },
    {
        name: 'Clothing',
        description: 'Fashion and apparel',
        image: {
            src: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400',
            alt: 'Clothing'
        }
    }
];

const tags = [
    { name: 'New Arrival' },
    { name: 'Best Seller' },
    { name: 'On Sale' },
    { name: 'Featured' },
    { name: 'Premium' }
];

// This will be populated after categories are created
let products = [];

const createProducts = (categoryIds, tagIds) => [
    {
        name: 'iPhone 15 Pro',
        description: '<p>The latest iPhone with advanced features including A17 Pro chip, titanium design, and improved camera system.</p>',
        shortDescription: 'Latest flagship iPhone with pro features',
        sku: 'IP15P-256',
        price: 999,
        regularPrice: 1099,
        salePrice: 999,
        onSale: true,
        stockQuantity: 50,
        categories: [categoryIds[0], categoryIds[1]],
        tags: [tagIds[0], tagIds[3]],
        images: [
            {
                src: 'https://images.unsplash.com/photo-1696446702633-1820c6650e38?w=800',
                alt: 'iPhone 15 Pro',
                position: 0
            }
        ],
        attributes: [
            {
                name: 'Color',
                options: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
                visible: true,
                variation: true
            },
            {
                name: 'Storage',
                options: ['128GB', '256GB', '512GB', '1TB'],
                visible: true,
                variation: true
            }
        ],
        featured: true
    },
    {
        name: 'MacBook Pro 14"',
        description: '<p>Powerful laptop with M3 Pro chip, stunning Liquid Retina XDR display, and all-day battery life.</p>',
        shortDescription: 'Professional laptop for creators',
        sku: 'MBP14-M3',
        price: 1999,
        regularPrice: 1999,
        stockQuantity: 30,
        categories: [categoryIds[0], categoryIds[2]],
        tags: [tagIds[1], tagIds[4]],
        images: [
            {
                src: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
                alt: 'MacBook Pro',
                position: 0
            }
        ],
        attributes: [
            {
                name: 'Color',
                options: ['Space Gray', 'Silver'],
                visible: true,
                variation: true
            },
            {
                name: 'Memory',
                options: ['16GB', '32GB', '64GB'],
                visible: true,
                variation: true
            }
        ],
        featured: true
    },
    {
        name: 'AirPods Pro (2nd Gen)',
        description: '<p>Premium wireless earbuds with active noise cancellation, adaptive audio, and personalized spatial audio.</p>',
        shortDescription: 'Wireless earbuds with ANC',
        sku: 'APP-2ND',
        price: 249,
        regularPrice: 249,
        stockQuantity: 100,
        categories: [categoryIds[0], categoryIds[3]],
        tags: [tagIds[1], tagIds[3]],
        images: [
            {
                src: 'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800',
                alt: 'AirPods Pro',
                position: 0
            }
        ],
        featured: false
    },
    {
        name: 'Samsung Galaxy S24 Ultra',
        description: '<p>Flagship Android phone with S Pen, 200MP camera, and powerful AI features.</p>',
        shortDescription: 'Premium Android smartphone',
        sku: 'SGS24U-512',
        price: 1199,
        regularPrice: 1299,
        salePrice: 1199,
        onSale: true,
        stockQuantity: 40,
        categories: [categoryIds[0], categoryIds[1]],
        tags: [tagIds[0], tagIds[2]],
        images: [
            {
                src: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800',
                alt: 'Samsung Galaxy S24 Ultra',
                position: 0
            }
        ],
        featured: true
    },
    {
        name: 'Sony WH-1000XM5',
        description: '<p>Industry-leading wireless noise-canceling headphones with exceptional sound quality.</p>',
        shortDescription: 'Premium noise-canceling headphones',
        sku: 'SONY-XM5',
        price: 399,
        regularPrice: 399,
        stockQuantity: 60,
        categories: [categoryIds[0], categoryIds[3]],
        tags: [tagIds[1], tagIds[4]],
        images: [
            {
                src: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800',
                alt: 'Sony Headphones',
                position: 0
            }
        ],
        featured: false
    },
    {
        name: 'Dell XPS 15',
        description: '<p>Powerful laptop with Intel Core i7, 16GB RAM, and stunning InfinityEdge display.</p>',
        shortDescription: 'High-performance Windows laptop',
        sku: 'DELL-XPS15',
        price: 1699,
        regularPrice: 1899,
        salePrice: 1699,
        onSale: true,
        stockQuantity: 25,
        categories: [categoryIds[0], categoryIds[2]],
        tags: [tagIds[2], tagIds[4]],
        images: [
            {
                src: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=800',
                alt: 'Dell XPS 15',
                position: 0
            }
        ],
        featured: false
    },
    {
        name: 'Apple Watch Series 9',
        description: '<p>Advanced smartwatch with health tracking, fitness features, and seamless iPhone integration.</p>',
        shortDescription: 'Smart watch with health features',
        sku: 'AW-S9-45',
        price: 429,
        regularPrice: 429,
        stockQuantity: 75,
        categories: [categoryIds[0], categoryIds[3]],
        tags: [tagIds[0], tagIds[3]],
        images: [
            {
                src: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800',
                alt: 'Apple Watch',
                position: 0
            }
        ],
        featured: true
    },
    {
        name: 'iPad Air',
        description: '<p>Versatile tablet with M1 chip, stunning display, and support for Apple Pencil and Magic Keyboard.</p>',
        shortDescription: 'Powerful and portable tablet',
        sku: 'IPAD-AIR-256',
        price: 749,
        regularPrice: 749,
        stockQuantity: 55,
        categories: [categoryIds[0]],
        tags: [tagIds[1]],
        images: [
            {
                src: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800',
                alt: 'iPad Air',
                position: 0
            }
        ],
        featured: false
    }
];

// Import and seed data
const importData = async () => {
    try {
        await connectDB();

        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany();
        await Product.deleteMany();
        await Category.deleteMany();
        await Tag.deleteMany();

        // Create users
        console.log('Creating users...');
        const createdUsers = await User.create(users);
        console.log(`✓ Created ${createdUsers.length} users`);

        // Create categories
        console.log('Creating categories...');
        const createdCategories = await Category.create(categories);
        console.log(`✓ Created ${createdCategories.length} categories`);

        // Make Smartphones and Laptops child of Electronics
        await Category.findByIdAndUpdate(createdCategories[1]._id, {
            parent: createdCategories[0]._id
        });
        await Category.findByIdAndUpdate(createdCategories[2]._id, {
            parent: createdCategories[0]._id
        });

        // Create tags
        console.log('Creating tags...');
        const createdTags = await Tag.create(tags);
        console.log(`✓ Created ${createdTags.length} tags`);

        // Create products
        console.log('Creating products...');
        const categoryIds = createdCategories.map(c => c._id);
        const tagIds = createdTags.map(t => t._id);
        products = createProducts(categoryIds, tagIds);
        const createdProducts = await Product.create(products);
        console.log(`✓ Created ${createdProducts.length} products`);

        // Update category counts
        console.log('Updating category counts...');
        for (const category of createdCategories) {
            await category.updateProductCount();
        }
        console.log('✓ Category counts updated');

        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║                                                          ║');
        console.log('║   ✓ Database seeded successfully!                        ║');
        console.log('║                                                          ║');
        console.log('║   Admin Login:                                           ║');
        console.log('║   Email: admin@ecommerce.com                             ║');
        console.log('║   Password: admin123                                     ║');
        console.log('║                                                          ║');
        console.log('║   Test User Login:                                       ║');
        console.log('║   Email: john@example.com                                ║');
        console.log('║   Password: password123                                  ║');
        console.log('║                                                          ║');
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

// Delete data
const deleteData = async () => {
    try {
        await connectDB();

        console.log('Deleting all data...');
        await User.deleteMany();
        await Product.deleteMany();
        await Category.deleteMany();
        await Tag.deleteMany();

        console.log('✓ Data deleted successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

// Check command line arguments
if (process.argv[2] === '-d') {
    deleteData();
} else {
    importData();
}