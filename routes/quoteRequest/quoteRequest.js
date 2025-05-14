import express from 'express'
import createQuote from './api/create.js'
import getUserQuotes from './api/history.js'
import recivedRouter from './api/received.js'
import getAllQuotesRequests from './api/list.js'
import updateQuoteStatus from './api/status.update.js'

const quoteRouter = express.Router()
quoteRouter.use('/create', createQuote)
quoteRouter.use('/history', getUserQuotes)
quoteRouter.use('/received', recivedRouter)
quoteRouter.use('/list', getAllQuotesRequests)
quoteRouter.use('/status', updateQuoteStatus)


export default quoteRouter