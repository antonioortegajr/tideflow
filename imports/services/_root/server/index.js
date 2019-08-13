const os = require('os')
const fs = require('fs')
const path = require('path')

let servicesAvailable = []
//calculateUsage
module.exports.servicesAvailable = servicesAvailable

const executeServiceHook = (service, hook, crud, stage, data, treat) => {
  if (!service) throw new Error('Service not specified')
  const returnableData = treat === 'original' ? data[0] : treat === 'new' ? data[1] : data[0]
  if (!service.hooks) return returnableData
  if (!service.hooks[hook]) return returnableData
  if (!service.hooks[hook][crud]) return returnableData
  if (!service.hooks[hook][crud][stage]) return returnableData
  return service.hooks[hook][crud][stage](data[0], data[1], treat)
}

// flow, delete, pre, [flow], original
const executeFlowHook = (service, hook, crud, stage, data, treat) => {
  if (!service) throw new Error('Service not specified')
  const returnableData = treat === 'original' ? data[0] : treat === 'new' ? data[1] : data[0]
  if (!service.hooks) return returnableData[hook]
  if (!service.hooks[hook]) return returnableData[hook]
  if (!service.hooks[hook][crud]) return returnableData[hook]
  if (!service.hooks[hook][crud][stage]) return returnableData[hook]
  return service.hooks[hook][crud][stage](data[0], data[1], treat)
}

const services = {
  create: {
    pre: (newService) => {
      let service = servicesAvailable.find(service => service.name === newService.type)
      if (!service) throw new Error('Service not found')

      return executeServiceHook(service, 'service', 'create', 'pre', [newService], 'original')
    },
    post: (newService) => {
      let service = servicesAvailable.find(service => service.name === newService.type)
      if (!service) throw new Error('Service not found')
      return executeServiceHook(service, 'service', 'create', 'post', [newService], 'original')
    }
  },
  update: {
    pre: (originalService, newService) => {
      let service = servicesAvailable.find(service => service.name === newService.type)
      if (!service) throw new Error('Service not found')
      return executeServiceHook(service, 'service', 'update', 'pre', [originalService, newService], 'new')
    },
    post: (originalService, newService) => {
      let service = servicesAvailable.find(service => service.name === newService.type)
      if (!service) throw new Error('Service not found')

      return executeServiceHook(service, 'service', 'update', 'post', [originalService, newService], 'new')
    }
  },
  delete: {
    pre: (toDelete) => {
      let service = servicesAvailable.find(service => service.name === toDelete.type)
      if (!service) throw new Error('Service not found')

      return executeServiceHook(service, 'service', 'delete', 'pre', [toDelete], 'original')
    },
    post: (deleted) => {
      let service = servicesAvailable.find(service => service.name === deleted.type)
      if (!service) throw new Error('Service not found')
      return executeServiceHook(service, 'service', 'delete', 'post', [deleted], 'original')
    }
  }
}

module.exports.services = services

const flows = {
  create: {
    pre: (newFlow) => {
      // Trigger hooks
      {
        let triggerService = servicesAvailable.find(service => service.name === newFlow.trigger.type)
        if (!triggerService) throw new Error('Service not found')
        newFlow.trigger = executeFlowHook(triggerService, 'trigger', 'create', 'pre', [newFlow], 'original')
      }

      // Trigger hooks
      // TODO: Steps hooks

      return newFlow
    },

    post: (newFlow) => {
      // Trigger hooks
      {
        let triggerService = servicesAvailable.find(service => service.name === newFlow.trigger.type)
        if (!triggerService) throw new Error('Service not found')
        newFlow.trigger = executeFlowHook(triggerService, 'trigger', 'create', 'post', [newFlow], 'original')
      }

      // TODO: Steps hooks

      return newFlow
    }
  },
  update: {
    pre: (originalFlow, newFlow) => {
      // Trigger hooks
      {
        // Old flow
        {
          let triggerService = servicesAvailable.find(service => service.name === originalFlow.trigger.type)
          if (!triggerService) throw new Error('Service not found')
          originalFlow.trigger = executeFlowHook(triggerService, 'trigger', 'update', 'pre', [originalFlow, newFlow], 'original')
        }

        // New flow
        {
          let triggerService = servicesAvailable.find(service => service.name === newFlow.trigger.type)
          if (!triggerService) throw new Error('Service not found')
          newFlow.trigger = executeFlowHook(triggerService, 'trigger', 'update', 'pre', [originalFlow, newFlow], 'new')
        }
      }
      // Todo bien
      // TODO: Steps hooks
      return newFlow
    },
    post: (originalFlow, newFlow) => {
      // Trigger hooks
      {
        // Old flow
        {
          let triggerService = servicesAvailable.find(service => service.name === originalFlow.trigger.type)
          if (!triggerService) throw new Error('Service not found')
          originalFlow.trigger = executeFlowHook(triggerService, 'trigger', 'update', 'post', [originalFlow, newFlow], 'original')
        }

        // New flow
        {
          let triggerService = servicesAvailable.find(service => service.name === newFlow.trigger.type)
          if (!triggerService) throw new Error('Service not found')
          newFlow.trigger = executeFlowHook(triggerService, 'trigger', 'update', 'post', [originalFlow, newFlow], 'new')
        }
      }
      // TODO: Steps hooks
      return newFlow
    }
  },
  delete: {
    pre: (flow) => {
      // Trigger hooks
      if (!flow.trigger) throw new Error('Service issue #flows.delete.pre')
      let triggerService = servicesAvailable.find(service => service.name === flow.trigger.type)
      if (!triggerService) throw new Error('Service not found')
      flow.trigger = executeFlowHook(triggerService, 'trigger', 'delete', 'pre', [flow], 'original')
      // TODO: Steps hooks
      return flow
    },
    post: (flow) => {
      // Trigger hooks
      if (!flow.trigger) throw new Error('Service issue #flows.delete.post')
      let triggerService = servicesAvailable.find(service => service.name === flow.trigger.type)
      if (!triggerService) throw new Error('Service not found')
      flow.trigger = executeFlowHook(triggerService, 'trigger', 'delete', 'post', [flow], 'original')
      // TODO: Steps hooks
      return flow
    }
  }
}

module.exports.flows = flows

/**
 * Given execution logs (as in database) return them in a format that can be
 * passed to services like `code` or `agent`, so they get only the necessary
 * data and its files that they can retrieve.
 * 
 * @param {array} executionLogs 
 * @param {boolean} external The system requires files to be accesible via
 * an url. This is useful for the agent service, as its executed in a 3rd party
 * server. If the files needs to be accesed within the same server, for example
 * in the `code` service, files are stored as tmp files.
 */
const processableResults = (executionLogs, external) => {
  if (!executionLogs || !executionLogs.length) return []

  return (executionLogs || []).map(el => {
    let { _id, stepIndex, type, event, createdAt, updatedAt, stepResults } = el

    stepResults.map(sr => {
      if (!external && sr.type === 'file') { // Store files locally
        const tmpFileName = `${os.tmpdir}${path.sep}${new Date().getTime()}-${sr.data.fileName}`
        fs.writeFileSync(tmpFileName, sr.data.data)
        sr.path = tmpFileName
        sr.fileName = sr.data.fileName
        sr.data = 'truncated'
      }
      else if (external && sr.type === 'file') {
        
      }
    })

    return { _id, stepIndex, type, event, createdAt, updatedAt, stepResults }
  }) // external ? 'external' : 'internal'
}

module.exports.processableResults = processableResults