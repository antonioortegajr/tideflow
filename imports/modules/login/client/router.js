import { Meteor } from 'meteor/meteor'
import { Router } from 'meteor/iron:router'

import i18n from 'meteor/universe:i18n'

import { Settings } from '/imports/modules/management/both/collection'

import './index.html'

Router.route('/login', function () {
  let settingsSubscription = Meteor.subscribe('settings.public.all')

  if (settingsSubscription.ready()) {
    let one = Settings.findOne()
    if (!one) {
      return Router.go('install.index')
    }
  }
  if (Meteor.user()) {
    return Router.go('dashboard')
  }
  this.render('membership.login')
}, {
  name: 'membership.login',
  parent: 'home',
  title: i18n.__('login.title')
})