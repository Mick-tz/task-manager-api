const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')

const router = new express.Router()

router.post('/tasks', auth, async (req, res) => {
//    const task = new Task(req.body)
    const task = new Task({
        ...req.body, //this syntax specifies to copy everything from req.body
        owner: req.user._id
    })
    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

// GET /tasks?completed=bool
// GET /tasks?limit=n&skip=k
// GET /tasks?sortedBy=sortingField:type
router.get('/tasks', auth, async (req, res) => {
    const match = {}
    if (req.query.completed) {
        match.completed = (req.query.completed.toLowerCase() === 'true')
    }
    const sort = {}
    if (req.query.sortBy) {
        const devide = req.query.sortBy.split(':')
        sort[devide[0]] = devide[1].toLowerCase() === "desc" ? -1 : 1 // terniary operator, syntatic sugar
    }

    try {
        const user = req.user
        await user.populate({
            path: 'tasks',
            match, 
            options: { // limit and skip are know as pagination atributes
                limit: parseInt(req.query.limit), // if no limit is provided, mongoose will ignore
                skip: parseInt(req.query.skip), // same a previous line
                sort
            }
        }).execPopulate()
        const tasks = user.tasks
        res.send(tasks)
    } catch (e) {
        res.sendStatus(500)
    }
})

router.get('/tasks/:id', auth, async (req, res) => {
    const _id = req.params.id
    try {
        const task = await Task.findOne({ _id, owner: req.user._id })
        if (!task) {
            return res.sendStatus(404)
        }
        res.send(task)
    } catch (e) {
        res.sendStatus(500)
    }
})

router.patch('/tasks/:id', auth, async (req, res) => {

    const allowedUpdates = ['completed', 'description']
    const requestedUpdates = Object.keys(req.body)
    const isValid = requestedUpdates.every((update) => allowedUpdates.includes(update)) 
    if (!isValid) {
        return res.status(400).send({error: 'Unable to modify request field'})
    }

    try {
        
        let _id = req.params.id
        // will use middleware to refactor next line
        //const task = await Task.findByIdAndUpdate(_id, req.body, {new: true, runValidators: true})
        const task = await Task.findOne({_id, owner: req.user})
        if (!task) {
            return res.sendStatus(404)
        }
        requestedUpdates.forEach((update) => task[update] = req.body[update])
        task.save()
        res.send(task)
    } catch (e) {
        res.sendStatus(400)
    }
})

router.delete('/tasks/:tid', auth, async (req, res) => {
    try {
        let tid = req.params.tid
        let task = await Task.findOneAndDelete({_id: tid, owner: req.user})
        if (!task) {
            return res.sendStatus(404)
        }
        res.send(task)
    } catch (e) {
        res.sendStatus(500)
    }
})

module.exports = router