const connectToDatabase = require('/opt/nodejs/src/db') // initialize connection

// simple Error constructor for handling HTTP error codes
function HTTPError (statusCode, message) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

exports.lambdaHandler = async (event, context) => {
    try {
        const { CampaignProduct, Campaign, KitProduct, Product, Op } = await connectToDatabase()
        const campaign = await Campaign.findByPk(event.pathParameters.campaign_id)
        const campaignProduct = await CampaignProduct.findByPk(event.pathParameters.campaign_id)
        const kitProduct = await KitProduct.findAll({ where: { kit_product_id: campaignProduct.product_id }})
        const products = await Product.findAll({
            where: { [Op.or]: kitProduct.map(product => ({product_id: product.product_id}))}
        })
        
        console.log(JSON.stringify(campaign))
        console.log(JSON.stringify(campaignProduct))
        console.log(JSON.stringify(kitProduct))
        console.log(JSON.stringify(products))

        let kitsByCampaign = { 
            ...JSON.parse(JSON.stringify(campaign)),
            product_id: campaignProduct.product_id,
            tmna_free_qty: campaignProduct.tmna_free_qty,
            kitProducts: JSON.parse(JSON.stringify(kitProduct)).map(product => {     
                product.product = JSON.parse(JSON.stringify(products)).find(individualProduct => {
                    if (product.product_id === individualProduct.product_id) return individualProduct
                })
                return product
            })
        }

        return {
            statusCode: 200,
            body: JSON.stringify(kitsByCampaign)
        }
    } catch (err) {
        console.log(err)
        return {
            statusCode: err.statusCode || 500,
            headers: { 'Content-Type': 'text/plain' },
            body: 'Could not fetch the notes.'
        }
    }
}
