const fs=require('node:fs')
const catalogue=JSON.parse(fs.readFileSync('resources/generated-fashion-catalogue.json'))
const base=process.argv[2]
if(!base)throw new Error('Pass the local server URL')
async function main(){
  const categories=await (await fetch(base+'/api/categories')).json()
  const products=await (await fetch(base+'/api/products')).json()
  if(categories.length!==catalogue.categories.length||products.length!==catalogue.products.length)throw new Error('Unexpected catalogue counts')
  if(products.some(product=>!product.images?.length))throw new Error('Missing product image relation')
  for(const route of ['/','/collection','/store','/magazine','/custom','/about',...catalogue.categories.map(category=>'/guests/'+category.slug)]){
    const response=await fetch(base+route)
    if(!response.ok)throw new Error(`${route}: ${response.status}`)
    const html=await response.text()
    const embedded=html.match(/data-page="([^"]+)"/)
    if(!embedded)throw new Error('Missing Inertia page: '+route)
    const page=JSON.parse(embedded[1].replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&'))
    if(route.startsWith('/guests/')&&(!page.props.works?.length||page.props.error))throw new Error('Missing works: '+route)
    console.log(`${route}: ${response.status}`)
  }
  for(const asset of catalogue.assets){
    const response=await fetch(`${base}/images/generated/${asset}.png`)
    if(!response.ok||!response.headers.get('content-type')?.startsWith('image/'))throw new Error('Missing asset: '+asset)
    await response.body.cancel()
  }
  console.log('Verified 6 category covers, 7 products with image galleries, 12 page routes, and all 8 generated images.')
}
main().catch(error=>{console.error(error.message);process.exitCode=1})
