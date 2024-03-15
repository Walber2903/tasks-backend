import { randomUUID } from 'node:crypto'

import { Database } from './database.js'
import { buildRoutePath } from './utils/build-route-path.js'
import { readCsvAndSendRequests } from '../stream/import-csv.js';

const database = new Database()

export const routes = [
  {
    method: 'GET',
    path: buildRoutePath('/tasks'),
    handler: (req, res) => {
      const { search } = req.query

      const tasks = database.select('tasks', search ? {
        title: search,
        description: search,
      } : null)

      return res.writeHead(200).end(JSON.stringify(tasks))
    }
  },
  {
    method: 'POST',
    path: buildRoutePath('/tasks'),
    handler: (req, res) => {
      const { title, description } = req.body ? req.body : {}

      if (!title || !description) {
        return res.writeHead(400).end(JSON.stringify({message: 'Title and description is mandatory.'}))
      }

      const task = {
        id: randomUUID(),
        title,
        description,
        completed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      }

      database.insert('tasks', task)

      readCsvAndSendRequests().catch(error => {
        console.error('Erro ao ler o CSV e enviar as requisições POST:', error);
      });

      return res.writeHead(201).end(JSON.stringify({message: 'Task created!'}))
    }
  },
  {
    method: 'PUT',
    path: buildRoutePath('/tasks/:id'),
    handler: (req, res) => {
      const { id } = req.params
      const { title, description, completed_at, created_at } = req.body

      if (!title || !description) {
        return res.writeHead(400).end(JSON.stringify({message: 'Title and description is mandatory.'}))
      }

      const [task] = database.select('tasks', { id })

      if (!task) {
        return res.writeHead(404).end(JSON.stringify({message: 'Type a task.'}))
      }

      database.update('tasks', id, {
        title,
        description,
        completed_at,
        created_at,
        updated_at: new Date()
      })

      return res.writeHead(204).end(JSON.stringify({message: 'You have updated the task.'}))
    }
  },
  {
    method: 'DELETE',
    path: buildRoutePath('/tasks/:id'),
    handler: (req, res) => {
      const { id } = req.params

      const [task] = database.select('tasks', { id })

      if (!task) {
        return res.writeHead(404).end(JSON.stringify({message: 'Task not found!'}))
      }

      database.delete('tasks', id)

      return res.writeHead(204).end()
    }
  },
  {
    method: 'PATCH',
    path: buildRoutePath('/tasks/:id/complete'),
    handler: (req, res) => {
      const { id } = req.params

      const [task] = database.select('tasks', { id })

      if (!task) {
        return res.writeHead(404).end(JSON.stringify({message: 'Task not exist.'}))
      }

      const isTaskCompleted = !!task.completed_at
      const completed_at = isTaskCompleted ? null : new Date()

      database.update('tasks', id, {
        title: task.title,
        description: task.description,
        completed_at,
        created_at: task.created_at,
        updated_at: task.updated_at
      })

      return res.writeHead(204).end(JSON.stringify({message: 'You have updated the task.'}))
    }
  }
]