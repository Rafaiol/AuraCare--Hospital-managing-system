/**
 * Room Routes
 */
const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { authenticate, authorize } = require('../middlewares/auth');
const { paginationValidation, idParamValidation } = require('../middlewares/validation');

router.use(authenticate);

// Room routes
router.get('/', paginationValidation, roomController.getRooms);
router.post('/', authorize('ADMIN'), roomController.createRoom);
router.get('/statistics', roomController.getRoomStatistics);
// Bed routes
router.get('/beds/all', paginationValidation, roomController.getBeds);
router.post('/beds/:bedId/assign', roomController.assignBed);
router.post('/beds/:bedId/discharge', roomController.dischargePatient);

router.get('/:id', idParamValidation, roomController.getRoomById);
router.put('/:id', idParamValidation, authorize('ADMIN'), roomController.updateRoom);
router.delete('/:id', idParamValidation, authorize('ADMIN'), roomController.deleteRoom);

module.exports = router;
