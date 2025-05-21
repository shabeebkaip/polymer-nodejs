import express from 'express'
import cmsCreate from './api/cms.create.js'
import cmsEdit from './api/cms.edit.js'
import cmsDelete from './api/cms.delete.js';
import cmsList from './api/cms.list.js';


const cmsRouter =express.Router()

cmsRouter.use('/create', cmsCreate);
cmsRouter.use('/edit', cmsEdit);
cmsRouter.use('/delete', cmsDelete);
cmsRouter.use('/list', cmsList);

export default cmsRouter