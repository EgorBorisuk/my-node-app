const Router = require('@koa/router');
const controller = require('../controllers/userController');
const validationMiddleware = require('../middleware/validationMiddleware');

const router = new Router({
    prefix: '/api/users'
});

// Специальные маршруты ставим перед /:id
router.get('/search', controller.search);
router.get('/stats', controller.stats);
router.get('/export', controller.export);

// Основные маршруты
router.get('/', controller.getAll);
router.get('/:id', controller.getById);

router.post(
    '/',
    validationMiddleware(controller.schema),
    controller.create
);

router.put(
    '/:id',
    validationMiddleware(controller.schema),
    controller.update
);

router.delete('/:id', controller.remove);

module.exports = router;