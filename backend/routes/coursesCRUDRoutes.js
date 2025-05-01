const express = require('express');
const {createCourse , getAllCourses , updateCourse , deleteCourse} = require('../controller/coursesCRUDController');
const router = express.Router();

router.post('/', createCourse);          
router.get('/', getAllCourses);         
router.put('/:id', updateCourse);      
router.delete('/:id', deleteCourse) 

module.exports = router;