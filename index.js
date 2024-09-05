require('dotenv').config()
const express = require('express')
const stripe = require('stripe')(process.env.STRIPE_SECRET)

const app = express()

app.set('view engine', 'ejs')
app.use(express.json()) // Make sure to add this to parse JSON

app.get('/', (req, res) => {
    res.render('index.ejs')
})

app.post('/checkout', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'inr',
                        product_data: {
                            name: 'Tickets for Egmore Museum'
                        },
                        unit_amount: 20 * 100 // 2000 rupees = 200000 paise
                    },
                    quantity: 10
                }            
            ],
            mode: 'payment',
            shipping_address_collection: {
                allowed_countries: ['IN'] // Use 'IN' for India
            },
            success_url: `${process.env.BASE_URL}/complete?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.BASE_URL}/cancel`
        });

        res.redirect(303, session.url); // Redirect to the Stripe Checkout page
    } catch (error) {
        console.error('Stripe API Error:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

app.get('/complete', async (req, res) => {
    try {
        const [session, lineItems] = await Promise.all([
            stripe.checkout.sessions.retrieve(req.query.session_id, { expand: ['payment_intent.payment_method'] }),
            stripe.checkout.sessions.listLineItems(req.query.session_id)
        ]);

        console.log('Session:', JSON.stringify(session));
        console.log('Line Items:', JSON.stringify(lineItems));

        res.send('Your payment was successful');
    } catch (error) {
        console.error('Error retrieving session:', error.message);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    }
});

app.get('/cancel', (req, res) => {
    res.redirect('/')
})

app.listen(3000, () => console.log('Server started on port 3000'))
