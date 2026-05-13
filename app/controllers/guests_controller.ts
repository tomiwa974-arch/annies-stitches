import type { HttpContext } from '@adonisjs/core/http'
import { Product, Category, Work, Collection } from '#models/index'

export default class GuestsController {
  
  // ============ PAGE RENDERING ============
  
  async show({ params, inertia }: HttpContext) {
    const slug = params.slug as string

    try {
      const category = await Category.findBy('slug', slug)
      
      if (!category) {
        return inertia.render('guests/product', {
          category: null,
          works: [],
          error: 'Category not found'
        })
      }

      const works = await Work.query()
        .where('categoryId', category.id)
        .where('isActive', true)
        .preload('category')
        .orderBy('createdAt', 'desc')

      return inertia.render('guests/product', {
        category: category.serialize(),
        works: works.map(w => w.serialize()),
        isEmpty: works.length === 0
      })

    } catch (error) {
      console.error('Error fetching category:', error)
      return inertia.render('guests/product', {
        category: null,
        works: [],
        error: true
      })
    }
  }
  
  async store({ inertia }: HttpContext) {
    try {
      // Get all active products
      const products = await Product.query()
        .where('isActive', true)
        .orderBy('createdAt', 'desc')

      console.log('✅ Store route hit! Found', products.length, 'products')
      
      return inertia.render('guests/store', { 
        products: products.map(p => p.toJSON()),
        isEmpty: products.length === 0
      })
      
    } catch (error) {
      console.error('Error fetching products:', error)
      return inertia.render('guests/store', { 
        products: [],
        isEmpty: true,
        error: true
      })
    }
  }

  // ============ API ROUTES FOR FRONTEND ============
  
  async getCollection({ response }: HttpContext) {
    try {
      const collection = await Collection.first()
      return response.json(collection)
    } catch (error) {
      console.error('Error fetching collection:', error)
      return response.status(500).json({ error: 'Failed to fetch collection' })
    }
  }

  async getCategories({ response }: HttpContext) {
    try {
      const categories = await Category.query()
        .where('isActive', true)
        .orderBy('order')
      return response.json(categories)
    } catch (error) {
      console.error('Error fetching categories:', error)
      return response.status(500).json({ error: 'Failed to fetch categories' })
    }
  }

  async getWorks({ response }: HttpContext) {
    try {
      const works = await Work.query()
        .where('isActive', true)
        .preload('category')
        .orderBy('createdAt', 'desc')
      return response.json(works)
    } catch (error) {
      console.error('Error fetching works:', error)
      return response.status(500).json({ error: 'Failed to fetch works' })
    }
  }

  async getWorksByCategory({ params, response }: HttpContext) {
    try {
      const works = await Work.query()
        .where('categoryId', params.categoryId)
        .where('isActive', true)
        .preload('category')
        .orderBy('createdAt', 'desc')
      return response.json(works)
    } catch (error) {
      console.error('Error fetching works by category:', error)
      return response.status(500).json({ error: 'Failed to fetch works' })
    }
  }

  async getProducts({ response }: HttpContext) {
    try {
      const products = await Product.query()
        .where('isActive', true)
        .orderBy('createdAt', 'desc')
      return response.json(products)
    } catch (error) {
      console.error('Error fetching products:', error)
      return response.status(500).json({ error: 'Failed to fetch products' })
    }
  }

  // ============ CART & WISHLIST METHODS (Protected) ============
  
  async addToCart({ request, response, auth }: HttpContext) {
    try {
      // Check if user is logged in
      await auth.check()
      const user = auth.user
      const { productId, size, quantity } = request.all()
      
      // Validate input
      if (!productId) {
        return response.status(400).json({ error: 'Product ID is required' })
      }
      
      // Find the product
      const product = await Product.find(productId)
      if (!product) {
        return response.status(404).json({ error: 'Product not found' })
      }
      
      // Here you would save to a cart table in your database
      // For now, we'll just return success and let the frontend handle localStorage
      
      return response.json({ 
        success: true, 
        message: 'Added to cart',
        cart: [] // You would return the user's cart items here
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to add items to cart' })
    }
  }
  
  async getCart({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user
      
      // Here you would fetch cart items from database
      // For now, return empty array
      
      return response.json({ 
        success: true, 
        cart: [] 
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to view cart' })
    }
  }
  
  async addToWishlist({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user
      const { productId } = request.all()
      
      if (!productId) {
        return response.status(400).json({ error: 'Product ID is required' })
      }
      
      const product = await Product.find(productId)
      if (!product) {
        return response.status(404).json({ error: 'Product not found' })
      }
      
      // Here you would save to a wishlist table in your database
      
      return response.json({ 
        success: true, 
        message: 'Added to wishlist' 
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to add items to wishlist' })
    }
  }
  
  async getWishlist({ request, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user
      
      // Here you would fetch wishlist items from database
      
      return response.json({ 
        success: true, 
        wishlist: [] 
      })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to view wishlist' })
    }
  }
  
  async removeFromCart({ params, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user
      const { id } = params
      
      // Here you would remove item from cart in database
      
      return response.json({ success: true, message: 'Removed from cart' })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to modify cart' })
    }
  }
  
  async removeFromWishlist({ params, response, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user
      const { id } = params
      
      // Here you would remove item from wishlist in database
      
      return response.json({ success: true, message: 'Removed from wishlist' })
    } catch (error) {
      return response.status(401).json({ error: 'Please login to modify wishlist' })
    }
  }
}