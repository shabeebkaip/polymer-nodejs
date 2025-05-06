import express from 'express'
import createPaymentTerms from './api/create.js'
import updatePaymentTerms from './api/update.js'
import getPaymentTerms from './api/get.js'
import deletePaymentTerms from './api/delete.js'

const paymentTermsRouter = express.Router()
paymentTermsRouter.use('/create', createPaymentTerms)
paymentTermsRouter.use('/edit', updatePaymentTerms)
paymentTermsRouter.use('/list', getPaymentTerms)
paymentTermsRouter.use('/delete', deletePaymentTerms)

export default paymentTermsRouter