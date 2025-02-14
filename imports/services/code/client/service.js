import i18n from 'meteor/universe:i18n'

import { servicesAvailable } from '/imports/services/_root/client'

const service = {
  name: 'code',
  humanName: 's-code.name',
  description: 's-code.description',
  website: 'https://docs.tideflow.io/docs/services-code',
  icon: 'fa fa-code',
  iconColor: '#001628',
  ownable: false,
  inputable: false,
  stepable: true,
  templates: {
  },
  hooks: {
    // service: {},
    // step: {},
    // trigger: {}
  },
  events: [
    {
      name: 'run',
      humanName: 's-code.events.run.name',
      viewerTitle: 's-code.events.run.title',
      inputable: false,
      stepable: true,
      callback: () => {},
      templates: {
        eventConfig: 'servicesCodeConfig'
      },
      conditions: [
        // {}
      ]
    }
  ]
}

module.exports.service = service

servicesAvailable.push(service)