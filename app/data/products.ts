// app/data/products.ts
export const products = {
  eveninggowns: {
    title: 'Evening Gowns',
    description: 'We partnered with Icicle for a double in-store collaboration based entirely on digital presentation that positions them as a leader in their market. Our work spanned brand strategy, logo design, visual identity systems, and custom web development to create a cohesive experience that drives business growth and user engagement.',
    influencers: ['Rachelle Baugh', 'Lanae Baugh', 'Jillian Baugh', 'Fannie Baugh', 'Kat Shaver', 'Branding'],
    testimonial: "I've worked with Derek on transforming our digital presence, and he was essential to our growth. He has this ability to understand business challenges, not just make things look pretty. Derek built custom solutions that streamlined our processes and made our team more efficient. Working with him was seamless and professional.",
    testimonialAuthor: 'Thomas Weber',
    testimonialRole: 'Brand Manager',
    nextWork: {
      title: 'Corset dresses',
      link: '/guests/corsetdresses'  // Link to next product
    }
  },
  
  corsetdresses: {
    title: 'Corset Dresses',
    description: 'We are committed to providing the best possible experience for our customers, and we are proud to be a part of their journey. We are constantly innovating and improving our products and services to meet the needs of our customers. We are confident that we can help you achieve your goals.',
    influencers: ['Sarah Johnson', 'Maya Williams', 'Elena Rodriguez'],
    testimonial: "We work with Derek on transforming our digital presence, and he was essential to our growth. He has this ability to understand business challenges, not just make things look pretty. Derek built custom solutions that streamlined our processes and made our team more efficient. Working with him was seamless and professional.",
    testimonialAuthor: 'Sarah Johnson',
    testimonialRole: 'Creative Director',
    nextWork: {
      title: 'Aso-Ebi Specials',
      link: '/guests/asobispecials'  // Link back to first product
    }
  },
  
  // Add the other 4 products here...
  asobispecials: {
    title: 'Aso-Ebi Specials',
    description: 'Our traditional wear collection celebrates culture and elegance with vibrant colors and intricate designs...',
    influencers: ['Aisha Mohammed', 'Funke Akindele', 'Temi Otedola'],
    testimonial: "The attention to detail in every piece is remarkable. The fabrics are luxurious and the craftsmanship is exceptional.",
    testimonialAuthor: 'Aisha Mohammed',
    testimonialRole: 'Fashion Influencer',
    nextWork: {
      title: 'Men Classic',
      link: '/guests/mensclassic'
    }
  },
  
  mensclassic: {
    title: "Men's Classic",
    description: 'Sophisticated and timeless pieces for the modern gentleman...',
    influencers: ['James Brown', 'Michael Smith', 'David Lee'],
    testimonial: "Finally, a brand that understands men's fashion. The fit is perfect and the quality is outstanding.",
    testimonialAuthor: 'James Brown',
    testimonialRole: 'Style Blogger',
    nextWork: {
      title: 'Bridal Collection',
      link: '/guests/bridalcollection'
    }
  },
  
  bridalcollection: {
    title: 'Bridal Collection',
    description: 'Make your special day unforgettable with our exquisite bridal pieces...',
    influencers: ['Emma Watson', 'Sophia Grace', 'Olivia Chen'],
    testimonial: "My wedding dress was absolutely perfect. I felt like a princess and received so many compliments.",
    testimonialAuthor: 'Emma Watson',
    testimonialRole: 'Happy Bride',
    nextWork: {
      title: "Custom Pieces",
      link: '/guests/custompieces'
    }
  },
  
  custompieces: {
    title: 'Custom Pieces',
    description: 'Have something specific in mind? We create bespoke pieces tailored to your vision...',
    influencers: ['Victoria Beckham', 'Naomi Campbell', 'Coco Rocha'],
    testimonial: "They brought my vision to life perfectly. The custom design process was smooth and the result exceeded my expectations.",
    testimonialAuthor: 'Victoria Beckham',
    testimonialRole: 'Designer',
    nextWork: {
      title: 'Evening Gowns',
      link: '/guests/eveninggowns'
    }
  }
}