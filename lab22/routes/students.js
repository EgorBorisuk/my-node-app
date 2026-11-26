
const Router = require('@koa/router');
const controller = require('../controllers/studentController');

const router = new Router({
    prefix: '/api/students'
});

router.get('/stats', controller.stats);
router.post('/batch', controller.batch);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;
