/**
 * Department Routes
 */
const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middlewares/auth');

router.use(authenticate);

router.get('/', departmentController.getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.post('/', authorize('ADMIN'), departmentController.createDepartment);
router.put('/:id', authorize('ADMIN'), departmentController.updateDepartment);
router.delete('/:id', authorize('ADMIN'), departmentController.deleteDepartment);

module.exports = router;
