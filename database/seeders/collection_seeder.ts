import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { Collection } from '#models/index'

export default class extends BaseSeeder {
  async run() {
    const existingCollection = await Collection.first()
    
    if (!existingCollection) {
      await Collection.create({
        title: "Annie's Stitches",
        bio: "Hi I'm Annabelle— a self-made fashion designer. From sketch to stitch, I create thoughtfully made pieces that reflect confidence, detail, and individuality.",
        journeyText: "This is my journey in fashion. I built this brand from the ground up through years of dedication, learning, and hands-on work. Over the past 6–8 years, I've spent countless late nights refining my craft, growing through challenges, and creating pieces with intention.",
        happyClients: 1000,
        yearsExperience: 8,
        services: JSON.stringify(["CUSTOM TAILORING", "CORSET & STATEMENT DRESSES", "READY-TO-WEAR", "TRADITIONAL WEAR (ASO-EBI & ANKARA)", "MENS CASUAL WEAR", "MEN'S TRADITIONAL WEAR"])
      })
      console.log('Collection created!')
    } else {
      console.log('Collection already exists, skipping...')
    }
  }
}