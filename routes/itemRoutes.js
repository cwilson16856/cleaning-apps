const express = require('express');
const router = express.Router();
const Quote = require('../models/quoteModel');

// Middleware to get quote by ID for item operations
async function getQuote(req, res, next) {
    let quote;
    try {
        quote = await Quote.findById(req.params.quoteId);
        if (quote == null) {
            return res.status(404).json({ message: 'Cannot find quote' });
        }
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
    res.quote = quote;
    next();
}

// POST route to add an item to a quote
router.post('/:quoteId/items', getQuote, async (req, res) => {
    if (res.quote) {
        const { description, quantity, price, isService } = req.body;
        const newItem = { description, quantity, price, isService };
        res.quote.items.push(newItem);
        try {
            const updatedQuote = await res.quote.save();
            res.status(201).json(updatedQuote);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
});

// PUT route to update an item in a quote
router.put('/:quoteId/items/:itemId', getQuote, async (req, res) => {
    if (res.quote) {
        const { description, quantity, price, isService } = req.body;
        const item = res.quote.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        item.description = description;
        item.quantity = quantity;
        item.price = price;
        item.isService = isService;
        try {
            const updatedQuote = await res.quote.save();
            res.json(updatedQuote);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
});

// DELETE route to remove an item from a quote
router.delete('/:quoteId/items/:itemId', getQuote, async (req, res) => {
    if (res.quote) {
        const item = res.quote.items.id(req.params.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }
        item.remove();
        try {
            const updatedQuote = await res.quote.save();
            res.json({ message: 'Deleted item', updatedQuote });
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    }
});

module.exports = router;